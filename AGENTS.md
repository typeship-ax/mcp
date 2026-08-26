# typeship — agent context

This package contains the generated MCP server for **typeship** (API v1.0.0, package v1.0.0).

Resolve an OpenAPI or GraphQL Definition, diagnose it, and keep every
selected SDK, CLI, and MCP Target current.

Every operation but one requires a bearer credential: an organization
API key from the console, or an OAuth access token carrying the operation's
read, generate, or write capability and the organization selected during
consent. OAuth grants cannot switch organizations after consent. A browser
session is not a credential for this API. The exception is POST /generate,
which works anonymously with the free plan's limits.

## Ground rules
- Generated code: never edit files in this package by hand — changes are lost on regeneration. Wrap the client in your own code instead.
- Zero runtime dependencies; everything runs on platform `fetch` (Node 18+, browsers, edge).
- `api.md` is the native method reference; `api.json` is the machine-readable operation, schema, safety, and example contract. Read them before guessing.

## Authentication
- Bearer token: set the `TYPESHIP_TOKEN` environment variable.

## MCP server
- Run `typeship-mcp` over stdio from an MCP client, or use `npx -y --package @typeship-ax/mcp typeship-mcp`. Set the package's auth environment variables in that client; `--read-only` prevents write tools.
- This package exposes the compact `search_docs`, `read_docs`, and `execute` surface. Find an operation, read its complete contract, then call `execute` with its name and `arguments`; destructive operations return `CONFIRMATION_REQUIRED` until repeated with `confirm: true`. Operation names are not directly callable tools in this mode.
- Tool arguments are checked against the schema before any request (unknown or mistyped arguments are one `isError` result with per-argument issues); pass `fields` (dotted paths) to keep only the result keys you need; errors carry `code` and `next_steps`.

## Documentation
- The reference for this exact package: `api.md` (offline, always current with the code).
- Conceptual guides live on the docs site. For questions about how the API's concepts fit together (flows, ordering, environments), fetch `https://typeship.dev/llms-full.txt` and read the relevant sections; `https://typeship.dev/llms.txt` is the page index.
