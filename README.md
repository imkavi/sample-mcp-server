# sample-mcp-server

A beginner-friendly, extensible **Model Context Protocol (MCP)** server built with Node.js. Clone it, run it, and use it as a foundation for your own MCP integrations.

---

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard by Anthropic that lets AI assistants like Claude call external tools and services in a safe, structured way.

Think of it like a plugin system for AI:

```
You (user) ──► Claude ──► MCP Server ──► Your tools / APIs / data
```

This project is an MCP **server** — it exposes tools that any MCP-compatible client (Claude Desktop, the MCP Inspector, or a custom client) can call.

---

## Tools Included

| Tool | Input | Description |
|---|---|---|
| `get_time` | _(none)_ | Returns the current server time |
| `get_weather` | `city` (string) | Returns mock weather for a city |
| `read_file` | `path` (string) | Reads a file (sandboxed to project root) |
| `system_info` | _(none)_ | Returns platform, CPU, memory, and uptime |

---

## Prerequisites

- [Node.js](https://nodejs.org) **v18 or higher**
- npm (comes with Node.js)

Verify your setup:

```bash
node --version   # should print v18.x.x or higher
npm --version
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/sample-mcp-server.git
cd sample-mcp-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the demo client

The included `client.js` connects to the server, lists all tools, and calls each one so you can see the output immediately — no external client needed.

```bash
node client.js
```

Expected output:

```
Starting MCP client…
Connected to MCP server.

────────────────────────────────────────────────────────────
  Available tools (4)
────────────────────────────────────────────────────────────
• get_time — Returns the current server date and time in ISO 8601 format.
• get_weather — Returns the current weather conditions for a given city.
• read_file — Reads the contents of a file at the given path. ...
• system_info — Returns information about the host system: ...

────────────────────────────────────────────────────────────
  get_time result
────────────────────────────────────────────────────────────
Current server time: 2026-01-01T10:00:00.000Z

────────────────────────────────────────────────────────────
  get_weather result (city: Amsterdam)
────────────────────────────────────────────────────────────
Weather in Amsterdam is sunny, 18°C

... and so on
```

---

## Connect to Claude Desktop

To use this server with Claude Desktop:

### 1. Find your Claude Desktop config file

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### 2. Add this server to the config

```json
{
  "mcpServers": {
    "sample-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/sample-mcp-server/server.js"]
    }
  }
}
```

Replace `/absolute/path/to/sample-mcp-server` with the actual path where you cloned the repo.

### 3. Restart Claude Desktop

The tools will appear automatically. You can now ask Claude things like:
- *"What time is it on the server?"*
- *"What's the weather in Tokyo?"*
- *"Read the file package.json for me."*
- *"Show me the system info."*

---

## Use the MCP Inspector (optional)

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is an official browser-based UI for testing MCP servers.

```bash
npx @modelcontextprotocol/inspector node server.js
```

Then open the URL it prints (usually `http://localhost:5173`) to browse and call tools interactively.

---

## Project Structure

```
sample-mcp-server/
├── server.js              # Entry point — starts the MCP server
├── client.js              # Demo client — connect and call all tools
├── package.json
│
├── config/
│   └── serverConfig.js    # Environment-variable-backed configuration
│
├── tools/
│   ├── index.js           # Tool registry — add new tools here
│   ├── timeTool.js        # get_time
│   ├── weatherTool.js     # get_weather
│   ├── fileReaderTool.js  # read_file
│   └── systemInfoTool.js  # system_info
│
├── services/
│   └── weatherService.js  # Data layer for weather (swap for a real API)
│
├── utils/
│   └── logger.js          # logInfo() / logError() helpers
│
└── docs/
    └── architecture.md    # In-depth architecture and design notes
```

---

## Adding Your Own Tool

Two steps — no changes to the server core required.

### Step 1 — Create the tool file

```js
// tools/helloTool.js
import { logInfo } from "../utils/logger.js";

export const helloTool = {
  name: "hello",
  description: "Greets a person by name.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "The person's name." },
    },
    required: ["name"],
  },
  async execute(args) {
    const { name } = args;
    if (!name || typeof name !== "string") {
      return {
        content: [{ type: "text", text: "Error: 'name' is required." }],
        isError: true,
      };
    }
    logInfo(`hello tool called for: ${name}`);
    return {
      content: [{ type: "text", text: `Hello, ${name}!` }],
    };
  },
};
```

### Step 2 — Register it

```js
// tools/index.js
import { helloTool } from "./helloTool.js";

export const tools = [
  timeTool,
  weatherTool,
  fileReaderTool,
  systemInfoTool,
  helloTool,   // ← add this line
];
```

Restart the server — the new tool is live.

---

## Environment Variables

All variables are optional; the server works with its defaults out of the box.

| Variable | Default | Description |
|---|---|---|
| `MCP_SERVER_NAME` | `sample-mcp-server` | Server name reported to clients |
| `MCP_SERVER_VERSION` | `1.0.0` | Version string reported to clients |
| `ALLOWED_READ_BASE_PATH` | current working directory | Files outside this path are blocked by `read_file` |
| `WEATHER_API_KEY` | _(empty)_ | Placeholder for a future real weather API |

Example:

```bash
ALLOWED_READ_BASE_PATH=/tmp node server.js
```

---

## How It Works

### Request flow

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
│                                                             │
│  1. Reads config  ──►  config/serverConfig.js               │
│  2. Loads tools   ──►  tools/index.js                       │
│  3. Registers each tool with McpServer                      │
│  4. Listens on stdio for incoming requests                  │
└────────────────────────┬────────────────────────────────────┘
                         │  routes call to matching tool
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      tools/                                 │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  timeTool   │  │ weatherTool  │  │  fileReaderTool  │   │
│  │  get_time   │  │  get_weather │  │    read_file     │   │
│  └─────────────┘  └──────┬───────┘  └──────────────────┘   │
│                          │                                  │
│  ┌──────────────┐        │ delegates                        │
│  │ systemInfo   │        ▼                                  │
│  │  system_info │  services/weatherService.js               │
│  └──────────────┘  (mock → swap for real API)               │
└─────────────────────────────────────────────────────────────┘
                         │  structured response
                         │  { content: [{ type, text }] }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        MCP Client                           │
│              receives result, shows it to user              │
└─────────────────────────────────────────────────────────────┘
```

### Step by step

1. **Client connects** — Claude Desktop (or `client.js`) spawns `server.js` as a child process and connects via stdio.
2. **Tool discovery** — the client sends `list_tools`; the server responds with the name, description, and input schema of every registered tool.
3. **Tool call** — the client sends `call_tool` with a tool name and arguments.
4. **Dispatch** — `server.js` routes the call to the matching tool's `execute(args)` function.
5. **Service layer** — tools that need external data (e.g. `get_weather`) delegate to a service in `services/`, keeping the tool handler thin.
6. **Response** — the tool returns `{ content: [{ type: "text", text: "..." }] }` which flows back to the client.

For a deeper dive, see [docs/architecture.md](docs/architecture.md).

---

## Troubleshooting

**`node: command not found`** — Install Node.js from [nodejs.org](https://nodejs.org).

**`Cannot find package '@modelcontextprotocol/sdk'`** — Run `npm install` first.

**Tools not showing in Claude Desktop** — Check the `args` path in `claude_desktop_config.json` is the correct absolute path, then fully restart Claude Desktop.

**`read_file` returns "Access denied"** — The path you requested is outside the allowed base directory. Set `ALLOWED_READ_BASE_PATH` if you need access to a different directory.

---

## Learn More

- [Model Context Protocol documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Claude Desktop](https://claude.ai/download)

---

## License

MIT
