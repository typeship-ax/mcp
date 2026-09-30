# Typeship: agent guide

Instructions for coding agents that call the Typeship API through this MCP server (API version 1.0.0, package version 0.23.0).

Resolve an OpenAPI or GraphQL Spec, diagnose it, and keep every
selected CLI, MCP, and SDK Target current.

Every operation but one requires a bearer credential: an organization
API key from the console, or an OAuth access token carrying the operation's
read, generate, or write capability and the organization selected during
consent. OAuth grants cannot switch organizations after consent. A browser
session is not a credential for this API. The exception is POST /generate,
which works anonymously with the free plan's limits.

Examples use Parcel, a fictional delivery service. Replace its domains,
repository names, and resource identifiers with your own. The hosted
petstore Spec is a runnable sample.

## Before writing code
- `api.md` is the tool and schema reference; `api.json` is the machine-readable contract: every operation's inputs, outputs, errors, `safety` (`read`, `write`, or `destructive`), and an example. Look up exact names there instead of guessing.
- `README.md` covers installation and setup.
- Zero runtime dependencies; the program runs on Node.js 20+ and platform `fetch`.

## Authentication
- Bearer token: set the `TYPESHIP_TOKEN` environment variable.

## MCP server
- `README.md` shows how to connect an MCP client. The server supports MCP `2025-11-25` and `2026-07-28` and picks the version automatically; clients need no protocol flags.
- Clients start the server with `npx -y --package @typeship-ax/mcp typeship-mcp`. Set the auth environment variables in the client's configuration; `--read-only` removes write tools.
- This package exposes the compact `search_docs`, `read_docs`, and `execute` surface. Find an operation, read its arguments and example with `read_docs`, then call `execute` with its name and `arguments`; destructive operations return `CONFIRMATION_REQUIRED` until repeated with `confirm: true`. Operation names are not directly callable tools in this mode.
- Tool arguments are checked against the schema before any request (unknown or mistyped arguments are one `isError` result with per-argument issues); pass `fields` (dotted paths) to keep only the result keys you need; errors carry `code` and `next_steps`.

## Safety
- Read credentials from the environment or a secret store. Never hard-code them, print them, or put them in URLs or command arguments.
- Check an operation's `safety` in `api.json` before calling it. Confirm with the user before running a `write` or `destructive` operation they did not ask for.
- For exploration or reporting, run the MCP server with `--read-only` so no tool can write.
- Keep results small: select only the fields you need with `fields` (MCP).

## Documentation
- The reference for this exact package: `api.md` (offline, always current with the code).
- Conceptual guides live on the docs site. For questions about how the API's concepts fit together (flows, ordering, environments), fetch `https://typeship.dev/llms-full.txt` and read the relevant sections; `https://typeship.dev/llms.txt` is the page index. Relative links in the spec resolve against `https://typeship.dev/docs`.
