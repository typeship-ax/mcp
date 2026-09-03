# @typeship-ax/mcp

MCP server for typeship. [API reference](./api.md)

Generated from the OpenAPI spec by [typeship](https://typeship.dev). Change the spec or generation settings, then regenerate; generated files are not hand-edited.

- **Zero runtime dependencies** — built on the platform `fetch` (Node 18+, browsers, edge runtimes)
- **Agent-ready MCP** — schema-derived tools, argument validation, read-only mode, and bounded results

## Install

```sh
npm install @typeship-ax/mcp
```

## Connect

Choose one connection. The commands add the server without editing a client file; the VS Code link opens a reviewed install prompt.

Authentication: provide `TYPESHIP_TOKEN` through the MCP client's environment or secret settings. Keep credential values out of URLs and command arguments.

> **Cursor:** Cursor 3.2 is not supported: it opens with the legacy initialize handshake, while this server speaks MCP 2026-07-28.

### Local

- Claude Code: `claude mcp add typeship -- npx -y --package @typeship-ax/mcp typeship-mcp`
- Codex: `codex mcp add typeship -- npx -y --package @typeship-ax/mcp typeship-mcp`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22--package%22%2C%22%40typeship-ax%2Fmcp%22%2C%22typeship-mcp%22%5D%7D)

### Local · read-only

- Claude Code: `claude mcp add typeship-readonly -- npx -y --package @typeship-ax/mcp typeship-mcp --read-only`
- Codex: `codex mcp add typeship-readonly -- npx -y --package @typeship-ax/mcp typeship-mcp --read-only`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship-readonly%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22--package%22%2C%22%40typeship-ax%2Fmcp%22%2C%22typeship-mcp%22%2C%22--read-only%22%5D%7D)

### Hosted

- Claude Code: `claude mcp add --transport http typeship https://typeship.dev/mcp/18amqhczenlh`
- Codex: `codex mcp add typeship --url https://typeship.dev/mcp/18amqhczenlh`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftypeship.dev%2Fmcp%2F18amqhczenlh%22%7D)

### Hosted · read-only

- Claude Code: `claude mcp add --transport http typeship-readonly https://typeship.dev/mcp/18amqhczenlh/readonly`
- Codex: `codex mcp add typeship-readonly --url https://typeship.dev/mcp/18amqhczenlh/readonly`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship-readonly%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftypeship.dev%2Fmcp%2F18amqhczenlh%2Freadonly%22%7D)

## MCP server

A zero-dependency stdio server exposing a compact discovery surface: `search_docs`, `read_docs`, and `execute`. Read an operation before executing it to get its complete schema, example arguments, and safety classification. Add this package to an MCP client:

```json
{
  "mcpServers": {
    "typeship": {
      "command": "npx",
      "args": [
        "-y",
        "--package",
        "@typeship-ax/mcp",
        "typeship-mcp"
      ],
      "env": {
        "TYPESHIP_TOKEN": "replace-with-your-credential"
      }
    }
  }
}
```

Replace the credential placeholder using the MCP client's secret storage when it has one. The local server reads `TYPESHIP_TOKEN` from its environment; credentials never belong in command arguments. If you also generated the CLI, its `typeship login` command stores credentials the local MCP server can reuse.

Tool input schemas are derived from the OpenAPI spec, so agents see real parameter types and required fields. Arguments are checked before anything reaches the API (unknown or mistyped ones come back as one `isError` result, nothing is dropped), every tool takes `fields` to keep only the result keys it needs, and errors carry a stable `code` and `next_steps`.

Add `--read-only` to `args` (or set `TYPESHIP_MCP_READ_ONLY=1`) for a server that cannot write, `--tools generate,projects` (or `TYPESHIP_MCP_TOOLS`) to expose a subset, and `TYPESHIP_MCP_MAX_RESULT_CHARS` to change the result size cap (64,000).

## MCP Registry

`server.json` describes the npm executable and any hosted transports. Its `dev.typeship/typeship` identity matches `package.json#mcpName`.

Install the official `mcp-publisher`, publish this npm package first, then validate or publish the listing:

```bash
npm run mcp:validate
npm run mcp:publish
```
