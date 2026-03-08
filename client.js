/**
 * Sample MCP client.
 *
 * Spawns the local MCP server as a child process, connects to it,
 * lists available tools, and calls each one to show sample responses.
 *
 * Run:  node client.js
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// ── helpers ────────────────────────────────────────────────────────────────

function print(label, value) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("─".repeat(60));
  if (typeof value === "object") {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(value);
  }
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting MCP client…");

  // StdioClientTransport spawns the server as a child process and
  // wires up stdin/stdout for the MCP protocol automatically.
  const transport = new StdioClientTransport({
    command: "node",
    args: ["server.js"],
  });

  const client = new Client(
    { name: "sample-mcp-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected to MCP server.\n");

  // ── 1. List all registered tools ──────────────────────────────────────
  const { tools } = await client.listTools();
  print(
    `Available tools (${tools.length})`,
    tools.map((t) => `• ${t.name} — ${t.description}`).join("\n")
  );

  // ── 2. Call get_time ──────────────────────────────────────────────────
  const timeResult = await client.callTool({ name: "get_time", arguments: {} });
  print("get_time result", timeResult.content[0].text);

  // ── 3. Call get_weather ───────────────────────────────────────────────
  const weatherResult = await client.callTool({
    name: "get_weather",
    arguments: { city: "Amsterdam" },
  });
  print("get_weather result (city: Amsterdam)", weatherResult.content[0].text);

  // ── 4. Call read_file ─────────────────────────────────────────────────
  const fileResult = await client.callTool({
    name: "read_file",
    arguments: { path: "package.json" },
  });
  print("read_file result (path: package.json)", fileResult.content[0].text);

  // ── 5. Call system_info ───────────────────────────────────────────────
  const sysResult = await client.callTool({ name: "system_info", arguments: {} });
  print("system_info result", sysResult.content[0].text);

  // ── done ──────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  console.log("  All tool calls complete.");
  console.log("─".repeat(60));

  await client.close();
}

main().catch((err) => {
  console.error("Client error:", err);
  process.exit(1);
});
