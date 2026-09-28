# @typeship-ax/mcp

MCP server for the Typeship API. [API reference](./api.md)

Resolve an OpenAPI or GraphQL Spec, diagnose it, and keep every selected CLI, MCP, and SDK Target current.

## Installation

MCP clients start the server with `npx`, so it needs no separate installation (see [Connect an MCP client](#connect-an-mcp-client)). To install the `typeship-mcp` command globally instead:

```sh
npm install --global @typeship-ax/mcp@0.22.0
```

Requires Node.js 20+.

## Connect an MCP client

Provide `TYPESHIP_API_KEY` through the MCP client's environment or secret settings. Keep credential values out of URLs and command arguments.

### Local

- Claude Code: `claude mcp add typeship -- npx -y --package @typeship-ax/mcp typeship-mcp`
- Codex: `codex mcp add typeship -- npx -y --package @typeship-ax/mcp typeship-mcp`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22--package%22%2C%22%40typeship-ax%2Fmcp%22%2C%22typeship-mcp%22%5D%7D)

### Local · read-only

- Claude Code: `claude mcp add typeship-readonly -- npx -y --package @typeship-ax/mcp typeship-mcp --read-only`
- Codex: `codex mcp add typeship-readonly -- npx -y --package @typeship-ax/mcp typeship-mcp --read-only`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship-readonly%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22--package%22%2C%22%40typeship-ax%2Fmcp%22%2C%22typeship-mcp%22%2C%22--read-only%22%5D%7D)

### Hosted

- Claude Code: `claude mcp add --transport http typeship https://typeship.dev/mcp`
- Codex: `codex mcp add typeship --url https://typeship.dev/mcp`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftypeship.dev%2Fmcp%22%7D)

### Hosted · read-only

- Claude Code: `claude mcp add --transport http typeship-readonly https://typeship.dev/mcp/readonly`
- Codex: `codex mcp add typeship-readonly --url https://typeship.dev/mcp/readonly`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship-readonly%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftypeship.dev%2Fmcp%2Freadonly%22%7D)

### Other clients

Add a server entry to your client's MCP configuration. For Cursor, merge it into `mcpServers` in `.cursor/mcp.json`, then enable the server in Cursor's MCP settings:

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
        "TYPESHIP_API_KEY": "replace-with-your-credential"
      }
    }
  }
}
```

Replace the credential placeholder using the MCP client's secret storage when it has one. The server reads `TYPESHIP_API_KEY` from its environment; credentials never belong in command arguments.

The server supports MCP `2025-11-25` and `2026-07-28` and picks the version automatically, so clients need no protocol settings. After registering it with Claude Code, `claude mcp list` shows the connection.

## Tools

The server runs over stdio with no runtime dependencies and exposes a compact discovery surface: `search_docs`, `read_docs`, and `execute`. Read an operation before executing it to get its arguments, an example, and its safety classification.

Tool input schemas come from the OpenAPI spec, so agents see real parameter types and required fields. Arguments are checked before anything reaches the API (unknown or mistyped ones come back as one `isError` result, nothing is dropped), every tool takes `fields` to keep only the result keys it needs, and errors carry a stable `code` and `next_steps`.

Add `--read-only` to `args` (or set `TYPESHIP_MCP_READ_ONLY=1`) for a server that cannot write, `--tools projects,specs` (or `TYPESHIP_MCP_TOOLS`) to expose a subset, and `TYPESHIP_MCP_MAX_RESULT_CHARS` to change the result size cap (64,000).

Generated from the OpenAPI spec by [typeship](https://typeship.dev).
