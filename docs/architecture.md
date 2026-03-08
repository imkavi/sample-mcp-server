# Architecture

## Model Context Protocol (MCP)

MCP is an open protocol that standardises how AI assistants communicate with external tools and data sources. Think of it as a structured RPC layer between an AI model and the real world:

```
AI Client (e.g. Claude Desktop)
        │
        │  JSON-RPC over stdio / SSE
        ▼
   MCP Server  ◄──── this project
        │
        ├── tool: get_time
        ├── tool: get_weather  ──► weatherService.js
        ├── tool: read_file
        └── tool: system_info
```

The server declares tools; the AI decides when and how to call them based on the user's request.

---

## Server Architecture

### Entry Point — `server.js`

1. Reads configuration from `config/serverConfig.js`.
2. Imports the tool array from `tools/index.js`.
3. Iterates over the array and calls `server.tool(name, description, schema, handler)` for each tool.
4. Connects a `StdioServerTransport` so the server can communicate with any MCP client over stdin/stdout.

The loop-based registration means **zero changes to `server.js`** are needed when adding new tools.

---

## Tool System

### Interface Contract

Every tool module exports an object that satisfies this interface:

```js
{
  name: string,          // unique tool identifier (snake_case)
  description: string,   // shown to the AI to explain what the tool does
  inputSchema: {         // JSON Schema for the tool's arguments
    type: "object",
    properties: { ... },
    required: [ ... ],
  },
  execute(args): Promise<{ content: Array<{ type, text }>, isError?: boolean }>
}
```

### Tool Registry — `tools/index.js`

Acts as the single source of truth for which tools are active. Adding or removing a tool is a one-line change here.

### Error Handling Strategy

All tools follow these rules:
- Validate inputs at the top of `execute()` and return early with `isError: true` on bad input.
- Wrap async operations in try/catch and return structured error responses — never throw unhandled.
- The server wraps each handler in its own try/catch as a final safety net.

---

## Services Layer

`services/` decouples external integrations from tool handlers.

- `weatherService.js` currently returns mock data but exposes the same async interface a real HTTP call would use. Swapping to a live API requires only editing this file.

---

## Configuration

`config/serverConfig.js` reads from environment variables with sensible defaults. This makes the server deployable in different environments without code changes.

---

## Logging

`utils/logger.js` exports `logInfo` and `logError`. Both write to **stderr** (not stdout) to avoid polluting the MCP stdio transport, which uses stdout for protocol messages.

---

## Scalability Strategy

The tool registry pattern scales naturally to large numbers of tools. Future tool groups can be organised as sub-directories:

```
tools/
├── github/
│   ├── listReposTool.js
│   └── createIssueTool.js
├── devops/
│   ├── deployTool.js
│   └── statusTool.js
├── database/
│   └── queryTool.js
└── index.js   ← imports and re-exports all of the above
```

Each tool group can have its own service layer (`services/github/`, `services/database/`, etc.) following the same pattern as `weatherService.js`.

For very large deployments the server can be split into multiple focused MCP servers, each registered separately with the AI client.

---

## Security Considerations

- **`read_file`**: resolves paths against a configurable base directory and rejects traversal attempts (`../`) that would escape it.
- **No shell execution**: no tool calls child processes or evaluates dynamic code.
- **Input validation**: every tool validates its arguments before acting on them.
