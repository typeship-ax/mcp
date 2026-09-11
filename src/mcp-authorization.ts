import { oauthJsonRequest } from "./oauth-request.js";

export interface McpAuthorizationConfiguration {
  /** Exact authorization-server issuer. Never inferred from an incoming token. */
  issuer: string;
  /** Canonical public MCP endpoint, including its path. */
  resource: string;
  /** Optional public signing-key endpoint; otherwise use issuer discovery. */
  jwksUrl?: string;
  /** Minimum connection scopes; upstream API permissions are independent. */
  scopes?: readonly string[];
}

export interface McpPrincipal {
  readonly issuer: string;
  readonly subject: string;
  readonly resource: string;
  readonly scopes: readonly string[];
  /** Provider claims verified by signature or authenticated introspection. */
  readonly claims: Readonly<Record<string, unknown>>;
}

/** Server-only credentials. Supply at runtime, never in generation config. */
export interface McpTokenIntrospectionConfiguration {
  /** Fixed provider endpoint authorized to receive this issuer's tokens. */
  url: string;
  clientId: string;
  clientSecret: string;
  authMethod?: "client_secret_basic" | "client_secret_post";
  /** Entire response deadline, including the body; defaults to 10 seconds. */
  timeoutMs?: number;
}

export class McpAuthorizationError extends Error {
  constructor(readonly status: 401 | 403 | 503, readonly code: "invalid_token" | "insufficient_scope" | "authorization_unavailable") {
    super(code === "invalid_token" ? "A valid MCP access token is required." : code === "insufficient_scope" ? "The access token lacks the required MCP permissions." : "MCP authorization is unavailable. Check the server's authorization configuration.");
    this.name = "McpAuthorizationError";
  }
}

const invalid = () => new McpAuthorizationError(401, "invalid_token");
const unavailable = () => new McpAuthorizationError(503, "authorization_unavailable");
const scopePattern = /^[\x21\x23-\x5B\x5D-\x7E]+$/;

function endpoint(value: string, query = false): string {
  try {
    const url = new URL(value);
    if (value !== value.trim() || /[\u0000-\u0020\u007F"\\]/.test(value) || url.username || url.password || url.hash || (!query && url.search) ||
      !(url.protocol === "https:" || url.protocol === "http:" && ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname))) throw unavailable();
    return value;
  } catch { throw unavailable(); }
}

/** Validate configuration independently of any request or token claims. */
export function mcpAuthorizationConfiguration(value: McpAuthorizationConfiguration): McpAuthorizationConfiguration {
  if (!value || typeof value.issuer !== "string" || typeof value.resource !== "string") throw unavailable();
  const issuer = endpoint(value.issuer), resource = endpoint(value.resource);
  const scopes = value.scopes ?? [];
  if (!Array.isArray(scopes) || scopes.length > 20 || scopes.some(s => typeof s !== "string" || s.length > 500 || !scopePattern.test(s))) throw unavailable();
  return Object.freeze({ issuer, resource, ...(value.jwksUrl ? { jwksUrl: endpoint(value.jwksUrl, true) } : {}), scopes: Object.freeze([...new Set(scopes)]) });
}

function bytes(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw invalid();
  try {
    const decoded = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
    if (btoa(String.fromCharCode(...decoded)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_") !== value) throw invalid();
    return decoded;
  } catch { throw invalid(); }
}

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function decode(value: string): Record<string, unknown> {
  try { const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes(value))); if (!object(parsed)) throw invalid(); return parsed; }
  catch { throw invalid(); }
}

interface SigningKey { kty?: string; kid?: string; alg?: string; use?: string; key_ops?: string[]; n?: string; e?: string; crv?: string; x?: string; y?: string; d?: string; k?: string }

function principalFor(claims: Record<string, unknown>, configuration: McpAuthorizationConfiguration): McpPrincipal {
  const now = Date.now() / 1000;
  const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
  if (claims.cnf !== undefined || claims.iss !== configuration.issuer || typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 1000 ||
    !Array.isArray(audiences) || !audiences.every(a => typeof a === "string") || !audiences.includes(configuration.resource) ||
    typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= now ||
    (claims.nbf !== undefined && (typeof claims.nbf !== "number" || !Number.isFinite(claims.nbf) || claims.nbf > now)) ||
    (claims.iat !== undefined && (typeof claims.iat !== "number" || !Number.isFinite(claims.iat) || claims.iat > now + 60)) ||
    (claims.scope !== undefined && (typeof claims.scope !== "string" || claims.scope.length > 10_000))) throw invalid();
  const scopes = typeof claims.scope === "string" ? claims.scope.split(" ").filter(Boolean) : [];
  if (scopes.some(s => !scopePattern.test(s))) throw invalid();
  if (configuration.scopes!.some(s => !scopes.includes(s))) throw new McpAuthorizationError(403, "insufficient_scope");
  return Object.freeze({ issuer: configuration.issuer, subject: claims.sub, resource: configuration.resource, scopes: Object.freeze([...new Set(scopes)]), claims: Object.freeze(claims) });
}

function introspector(input: McpTokenIntrospectionConfiguration, configuration: McpAuthorizationConfiguration) {
  const url = endpoint(input.url);
  const method = input.authMethod ?? "client_secret_basic", timeoutMs = input.timeoutMs ?? 10_000;
  if (!["client_secret_basic", "client_secret_post"].includes(method) || !Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30_000 ||
    [input.clientId, input.clientSecret].some(value => typeof value !== "string" || !value || value.length > 16_000 || /[\u0000-\u001F\u007F]/.test(value))) throw unavailable();
  // Snapshot secrets in a private closure. Public metadata/config never exposes them.
  const { clientId, clientSecret } = input;
  const form = (value: string) => new URLSearchParams({ v: value }).toString().slice(2);
  const authorization = method === "client_secret_basic" ? "Basic " + btoa(form(clientId) + ":" + form(clientSecret)) : undefined;
  return async (token: string): Promise<McpPrincipal> => {
    const body = new URLSearchParams({ token, token_type_hint: "access_token" });
    if (method === "client_secret_post") { body.set("client_id", clientId); body.set("client_secret", clientSecret); }
    let data: Record<string, unknown> | undefined;
    try {
      const response = await oauthJsonRequest(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", ...(authorization ? { Authorization: authorization } : {}) }, body }, timeoutMs);
      if (response.status !== 200) throw unavailable();
      data = response.data;
    } catch { throw unavailable(); }
    if (!data || typeof data.active !== "boolean") throw unavailable();
    if (!data.active || (data.token_type !== undefined && (typeof data.token_type !== "string" || data.token_type.toLowerCase() !== "bearer"))) throw invalid();
    // RFC 7662 permits omitted issuer: the owner-pinned authenticated endpoint
    // establishes it. Audience, subject and expiry are mandatory for this handler.
    // Never substitute client_id for the MCP resource audience.
    const claims = { ...data, iss: data.iss === undefined ? configuration.issuer : data.iss };
    for (const key of ["token", "access_token", "refresh_token", "id_token", "client_secret"]) delete (claims as Record<string, unknown>)[key];
    return principalFor(claims, configuration);
  };
}

/** Resource-server validation using platform crypto or explicit introspection. The caller supplies
 * only a token; issuer, resource, discovery and key destinations are fixed by
 * the owner. No Authorization header is sent during discovery/key fetching.
 * Introspection replaces JWT verification for every request: no fallback and
 * no token-result cache, so provider revocation is checked on the next request. */
export function createMcpAuthorizer(input: McpAuthorizationConfiguration, introspection?: McpTokenIntrospectionConfiguration) {
  const configuration = mcpAuthorizationConfiguration(input);
  const introspect = introspection === undefined ? undefined : introspector(introspection, configuration);
  const cacheMs = 300_000, retryMs = 30_000;
  let keys: SigningKey[] = [], expiresAt = 0, lastAttempt = -Infinity;
  let pending: Promise<void> | undefined;
  async function refresh(): Promise<void> {
    if (pending) return pending;
    if (Date.now() - lastAttempt < retryMs) return;
    lastAttempt = Date.now();
    pending = (async () => {
      try {
        let jwksUrl = configuration.jwksUrl;
        if (!jwksUrl) {
          const issuer = new URL(configuration.issuer), path = issuer.pathname.replace(/\/$/, "");
          const candidates = [...new Set([
            issuer.origin + "/.well-known/oauth-authorization-server" + path,
            issuer.origin + "/.well-known/openid-configuration" + path,
            issuer.origin + path + "/.well-known/openid-configuration",
          ])];
          for (const url of candidates) {
            const response = await oauthJsonRequest(url, {}, 10_000);
            if (response.status === 404) continue;
            if (response.status !== 200 || response.data?.issuer !== configuration.issuer || typeof response.data.jwks_uri !== "string") throw unavailable();
            jwksUrl = endpoint(response.data.jwks_uri, true);
            break;
          }
          if (!jwksUrl) throw unavailable();
        }
        const response = await oauthJsonRequest(jwksUrl, {}, 10_000);
        if (response.status !== 200 || !Array.isArray(response.data?.keys) || response.data.keys.length === 0 || response.data.keys.length > 100) throw unavailable();
        keys = response.data.keys.filter(object) as SigningKey[];
        expiresAt = Date.now() + cacheMs;
      } catch { throw unavailable(); }
    })().finally(() => { pending = undefined; });
    return pending;
  }
  function eligible(header: Record<string, unknown>): SigningKey[] {
    return keys.filter(key => (!header.kid || key.kid === header.kid) && (!key.alg || key.alg === header.alg) &&
      (!key.use || key.use === "sig") && (!key.key_ops || Array.isArray(key.key_ops) && key.key_ops.includes("verify")) && !key.d && !key.k &&
      (header.alg === "RS256" && key.kty === "RSA" || header.alg === "ES256" && key.kty === "EC" && key.crv === "P-256" || header.alg === "EdDSA" && key.kty === "OKP" && key.crv === "Ed25519"));
  }
  async function verifySignature(header: Record<string, unknown>, data: Uint8Array<ArrayBuffer>, signature: Uint8Array<ArrayBuffer>): Promise<boolean> {
    const matches = eligible(header);
    if (matches.length !== 1) return false;
    const key = matches[0]!;
    try {
      const algorithm = header.alg === "RS256" ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } : header.alg === "ES256" ? { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" } : { name: "Ed25519" };
      if (header.alg === "RS256") {
        if (!key.n || bytes(key.n).byteLength < 256) return false;
      }
      const imported = await crypto.subtle.importKey("jwk", key, algorithm, false, ["verify"]);
      if (header.alg === "RS256" && ((imported.algorithm as { modulusLength?: number }).modulusLength ?? 0) < 2048) return false;
      return await crypto.subtle.verify(algorithm, imported, signature, data);
    } catch { return false; }
  }
  return {
    configuration,
    metadata() { return { resource: configuration.resource, authorization_servers: [configuration.issuer], bearer_methods_supported: ["header"], scopes_supported: [...configuration.scopes!] }; },
    challenge(error?: "invalid_token" | "insufficient_scope") {
      const resource = new URL(configuration.resource);
      const metadata = resource.origin + "/.well-known/oauth-protected-resource" + resource.pathname.replace(/\/$/, "");
      return 'Bearer resource_metadata="' + metadata + '"' + (configuration.scopes!.length ? ', scope="' + configuration.scopes!.join(" ") + '"' : "") + (error ? ', error="' + error + '"' : "");
    },
    async authorize(header: string | null): Promise<McpPrincipal> {
      if (!header || header.length > 16_400 || !/^Bearer [A-Za-z0-9._~+/-]+=*$/i.test(header)) throw invalid();
      const token = header.slice(7), parts = token.split(".");
      if (introspect) return introspect(token);
      if (parts.length !== 3) throw invalid();
      const protectedHeader = decode(parts[0]!), claims = decode(parts[1]!);
      if (!["RS256", "ES256", "EdDSA"].includes(String(protectedHeader.alg)) || protectedHeader.crit !== undefined || protectedHeader.jku !== undefined || protectedHeader.x5u !== undefined ||
        (protectedHeader.typ !== undefined && !["at+jwt", "JWT"].includes(String(protectedHeader.typ))) ||
        (protectedHeader.kid !== undefined && (typeof protectedHeader.kid !== "string" || !protectedHeader.kid || protectedHeader.kid.length > 200))) throw invalid();
      const signed = new TextEncoder().encode(parts[0] + "." + parts[1]), signature = bytes(parts[2]!);
      if (expiresAt <= Date.now()) { await refresh(); if (expiresAt <= Date.now()) throw unavailable(); }
      let verified = await verifySignature(protectedHeader, signed, signature);
      if (!verified && Date.now() - lastAttempt >= retryMs) { await refresh(); verified = await verifySignature(protectedHeader, signed, signature); }
      if (!verified) throw invalid();
      // No bearer token or unverified claims cross into credential resolution.
      return principalFor(claims, configuration);
    },
  };
}
