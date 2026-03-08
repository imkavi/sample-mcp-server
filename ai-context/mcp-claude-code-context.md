# MCP Sample Project — Claude Code Context File

## Status

Project is fully built and working. All files described below exist and are functional.

---

## Goal

A beginner-friendly, extensible MCP (Model Context Protocol) server starter built
with Node.js. Designed so new tools can be added without modifying the core server.

---

## Technology Stack

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **MCP SDK:** `@modelcontextprotocol/sdk` v1.x
- **Schema validation:** `zod` v4 (transitive dep of the SDK, used in server.js)
- **Node built-ins:** `fs/promises`, `os`, `path`

---

## Project Structure

```
sample-mcp-server/
├── server.js              # Entry point — McpServer + registerTool loop
├── client.js              # Demo client — spawns server, calls all tools
├── package.json           # ES module, @modelcontextprotocol/sdk dep
├── .gitignore
│
├── config/
│   └── serverConfig.js    # Env-var backed config (name, version, paths)
│
├── tools/
│   ├── index.js           # Tool registry array — only file to edit when adding tools
│   ├── timeTool.js        # get_time
│   ├── weatherTool.js     # get_weather (delegates to weatherService)
│   ├── fileReaderTool.js  # read_file (path traversal protection)
│   └── systemInfoTool.js  # system_info (os module)
│
├── services/
│   └── weatherService.js  # Mock weather data; ready to swap for real API
│
├── utils/
│   └── logger.js          # logInfo() / logError() — writes to stderr only
│
├── docs/
│   └── architecture.md    # MCP concept, server design, scalability notes
│
└── ai-context/
    └── mcp-claude-code-context.md   # This file
```

---

## Architecture & Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Client                           │
│           (Claude Desktop · MCP Inspector · client.js)      │
└────────────────────────┬────────────────────────────────────┘
                         │  JSON-RPC over stdio
                         │  (list_tools / call_tool)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        server.js                            │
│  - McpServer.registerTool() for each tool in tools/index.js │
│  - z.looseObject({}) schema → args passed through as-is     │
│  - StdioServerTransport for client communication            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      tools/                                 │
│  Each tool exports: { name, description, inputSchema,       │
│                       async execute(args) }                 │
│                                                             │
│  timeTool ── weatherTool ──► weatherService.js              │
│  fileReaderTool (sandboxed) ── systemInfoTool               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Implementation Decisions

### server.js — McpServer + registerTool

Uses `McpServer.registerTool()` (non-deprecated API) instead of `server.tool()`.
The schema is `z.looseObject({})` (Zod v4 equivalent of passthrough) so all
client-supplied args reach `execute()` unchanged. Each tool does its own validation.

```js
server.registerTool(tool.name, { description, inputSchema: z.looseObject({}) }, handler)
```

### Tool interface contract

Every tool module exports a plain object:

```js
{
  name: string,          // snake_case, unique
  description: string,
  inputSchema: {         // JSON Schema (used for docs, not runtime validation)
    type: "object",
    properties: { ... },
    required: [ ... ],
  },
  async execute(args) {
    // validate args, do work, return:
    return { content: [{ type: "text", text: "..." }] }
    // on error:
    return { content: [{ type: "text", text: "Error: ..." }], isError: true }
  }
}
```

### Tool registry — tools/index.js

Single source of truth. To add a tool: create the file, import it here, add to array.
No changes to server.js required.

### Logger writes to stderr

`logInfo` / `logError` in `utils/logger.js` use `console.error` (stderr).
stdout is reserved for the MCP stdio transport protocol messages.

### read_file path safety

Resolves the requested path against `serverConfig.allowedReadBasePath` (defaults to
`process.cwd()`). Rejects any resolved path that doesn't start with the base path,
blocking `../` traversal attacks.

### get_time timezone fix

Uses `new Date().toLocaleString("sv-SE", { timeZoneName: "short", hour12: false })`
instead of `toISOString()` to return the server's local time rather than UTC.

---

## Tool Specifications

### get_time
- Input: none
- Returns: local server time with timezone label
- Example: `Current server time: 2026-03-08 12:00:00 CET`

### get_weather
- Input: `city` (string, required)
- Delegates to `services/weatherService.js` (mock data keyed by city name)
- Example: `Weather in Amsterdam is sunny, 18°C`
- Future: set `WEATHER_API_KEY` env var and replace mock with real HTTP call

### read_file
- Input: `path` (string, required)
- Reads file relative to `ALLOWED_READ_BASE_PATH`
- Returns file contents or structured error (ENOENT, EACCES, traversal blocked)

### system_info
- Input: none
- Returns: platform, CPU architecture, total/used/free memory (MB), uptime (hours)
- Uses Node.js `os` module

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `MCP_SERVER_NAME` | `sample-mcp-server` | Reported to clients on connect |
| `MCP_SERVER_VERSION` | `1.0.0` | Reported to clients on connect |
| `ALLOWED_READ_BASE_PATH` | `process.cwd()` | Sandbox root for read_file |
| `WEATHER_API_KEY` | _(empty)_ | Placeholder for future real weather API |

---

## Running

```bash
npm install       # install dependencies
node client.js    # demo: spawns server, calls all tools, prints output
node server.js    # run server standalone (connect via Claude Desktop / Inspector)
```

---

## Adding a New Tool (summary)

1. Create `tools/myTool.js` exporting the tool object (name, description, inputSchema, execute)
2. Import and add to the array in `tools/index.js`
3. Restart server — tool is live

---

## Client (client.js)

A self-contained demo that:
1. Spawns `server.js` via `StdioClientTransport`
2. Connects with `@modelcontextprotocol/sdk/client`
3. Calls `listTools()` then `callTool()` for each tool
4. Prints formatted results to stdout

Useful for quick local verification without needing Claude Desktop or the MCP Inspector.
