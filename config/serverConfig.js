/**
 * Server configuration.
 * Centralizes all configurable values so they can be adjusted
 * via environment variables or direct edits without touching core logic.
 */

export const serverConfig = {
  name: process.env.MCP_SERVER_NAME || "sample-mcp-server",
  version: process.env.MCP_SERVER_VERSION || "1.0.0",

  // read_file safety: only allow reads within this directory tree
  allowedReadBasePath: process.env.ALLOWED_READ_BASE_PATH || process.cwd(),

  // Placeholder API key for future real weather service integration
  weatherApiKey: process.env.WEATHER_API_KEY || "",
};
