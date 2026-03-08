/**
 * MCP Server entry point.
 *
 * Converts each tool's JSON Schema inputSchema into a real Zod schema so
 * Claude sees the correct parameter names, types, and descriptions when
 * it calls list_tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { serverConfig } from "./config/serverConfig.js";
import { tools } from "./tools/index.js";
import { logInfo, logError } from "./utils/logger.js";

/**
 * Build a Zod object schema from a JSON Schema properties map.
 * Supports string, number, and boolean types; marks non-required fields optional.
 *
 * @param {{ properties?: Record<string, { type: string, description?: string }>, required?: string[] }} inputSchema
 * @returns {z.ZodObject}
 */
function buildZodSchema(inputSchema) {
  const properties = inputSchema?.properties ?? {};
  const required = new Set(inputSchema?.required ?? []);
  const shape = {};

  for (const [key, def] of Object.entries(properties)) {
    let field;
    switch (def.type) {
      case "number":
      case "integer":
        field = z.number();
        break;
      case "boolean":
        field = z.boolean();
        break;
      default:
        field = z.string();
    }

    if (def.description) {
      field = field.describe(def.description);
    }

    shape[key] = required.has(key) ? field : field.optional();
  }

  return z.object(shape);
}

async function main() {
  const server = new McpServer({
    name: serverConfig.name,
    version: serverConfig.version,
  });

  logInfo(`Starting ${serverConfig.name} v${serverConfig.version}`);
  logInfo(`Registering ${tools.length} tool(s)…`);

  for (const tool of tools) {
    logInfo(`  ↳ registering tool: ${tool.name}`);

    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: buildZodSchema(tool.inputSchema),
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
