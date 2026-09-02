# @typeship-ax/mcp

MCP server for typeship. [API reference](./api.md)

Generated from the OpenAPI spec by [typeship](https://typeship.dev). Change the spec or generation settings, then regenerate; generated files are not hand-edited.

- **Zero runtime dependencies** — built on the platform `fetch` (Node 18+, browsers, edge runtimes)
- **Agent-ready MCP** — schema-derived tools, argument validation, read-only mode, and bounded results

## Install

```sh
npm install @typeship-ax/mcp
```

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
