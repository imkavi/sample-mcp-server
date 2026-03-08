/**
 * MCP Server entry point.
 *
 * Uses McpServer.registerTool() (current API) with a Zod v4 looseObject
 * schema so all client-supplied arguments are forwarded to each tool's
 * execute() function unchanged.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { serverConfig } from "./config/serverConfig.js";
import { tools } from "./tools/index.js";
import { logInfo, logError } from "./utils/logger.js";

async function main() {
  const server = new McpServer({
    name: serverConfig.name,
    version: serverConfig.version,
  });

  logInfo(`Starting ${serverConfig.name} v${serverConfig.version}`);
  logInfo(`Registering ${tools.length} tool(s)…`);

  for (const tool of tools) {
    logInfo(`  ↳ registering tool: ${tool.name}`);

    // z.looseObject({}) is the Zod v4 way to accept any shape of arguments
    // and pass them through as-is. Each tool does its own input validation.
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: z.looseObject({}),
      },
      async (args) => {
        try {
          return await tool.execute(args);
        } catch (err) {
          logError(`Unhandled error in tool "${tool.name}"`, err);
          return {
            content: [{ type: "text", text: `Internal error: ${err.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logInfo("MCP server is running and ready to accept requests.");
}

main().catch((err) => {
  logError("Fatal error during server startup", err);
  process.exit(1);
});
