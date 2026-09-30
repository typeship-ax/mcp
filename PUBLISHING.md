# Publishing @typeship-ax/mcp

How to build, release, and maintain this package. Its users need only [README.md](README.md).

## Build and test

Requires Node.js 20+. From this directory:

```sh
npm install
npm run build
npm test
```

## Name and version

`package.json` names this package `@typeship-ax/mcp` at version `0.23.0`. Raise `version` for every release.

## Publish

```sh
npm publish --access public
```

`prepublishOnly` builds the package first.

## MCP Registry

`server.json` describes the npm executable and any hosted transports. Its `dev.typeship/typeship` identity matches `package.json#mcpName`.

Install the official `mcp-publisher`, publish this npm package first, then validate or publish the listing:

```sh
npm run mcp:validate
npm run mcp:publish
```

## Host on Cloudflare Workers

`wrangler.toml` and `src/worker.ts` are an optional starting point for serving this MCP server over HTTP from a Cloudflare Worker; the npm package and its stdio server do not use them. The generated entry refuses every caller until you point `main` at your own Worker entry that calls `createMcpHandler` with `credentialsFor` for each verified MCP identity. Delete both files if you do not host the server this way.

## Customizing this package

- A custom file ships only when the package manifest, exports, build, and tests include it. Add a package check for every custom build or test step.
- Keep application-only wrappers outside this package. Code shipped from this package must pass the package's checks.
- When this package's repository receives reviewed regeneration pull requests, committed customizations are preserved and edits that overlap a generated change stop for review. Regenerating into a directory replaces its files.
