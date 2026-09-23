# @typeship-ax/mcp

MCP server for typeship. [API reference](./api.md)

Generated from the OpenAPI spec by [typeship](https://typeship.dev). Change the spec or generation settings, then regenerate; generated files are not hand-edited.

- **Zero runtime dependencies** — built on the platform `fetch` in Node 18+
- **Agent-ready MCP** — schema-derived tools, argument validation, read-only mode, and bounded results

## Build from source

Run these commands in the downloaded or cloned package directory:

```sh
npm install
npm run build
```

Requires Node.js 18+. The package is ESM.

To run the local MCP server, configure your MCP client with `node` and the absolute path to `dist/mcp.js`, as shown below. The server communicates over stdio.

## Install a published package

Generation does not publish a package. Before using the registry command below, confirm `name` and `version` in `package.json`, publish under a name you control, and verify that release is available on npm.

```sh
npm install --global @typeship-ax/mcp@0.12.1
```

## Connect after publishing

The npm connections below require `@typeship-ax/mcp` to be published under your package identity. To use downloaded source before publishing, use the local configuration in the next section. Hosted connections require a deployed server.

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

- Claude Code: `claude mcp add --transport http typeship https://typeship.dev/mcp`
- Codex: `codex mcp add typeship --url https://typeship.dev/mcp`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftypeship.dev%2Fmcp%22%7D)

### Hosted · read-only

- Claude Code: `claude mcp add --transport http typeship-readonly https://typeship.dev/mcp/readonly`
- Codex: `codex mcp add typeship-readonly --url https://typeship.dev/mcp/readonly`
- [Install in VS Code](vscode:mcp/install?%7B%22name%22%3A%22typeship-readonly%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftypeship.dev%2Fmcp%2Freadonly%22%7D)

## MCP server

A zero-dependency stdio server exposing a compact discovery surface: `search_docs`, `read_docs`, and `execute`. Read an operation before executing it to get its complete schema, example arguments, and safety classification. After building, add the local server to an MCP client:

```json
{
  "mcpServers": {
    "typeship": {
      "command": "node",
      "args": [
        "/absolute/path/to/package/dist/mcp.js"
      ],
      "env": {
        "TYPESHIP_TOKEN": "replace-with-your-credential"
      }
    }
  }
}
```

Replace the path with the absolute path to this package's built `dist/mcp.js`.

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
