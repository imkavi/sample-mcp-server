/**
 * Server configuration.
 * Centralizes all configurable values so they can be adjusted
 * via environment variables or direct edits without touching core logic.
 */

import path from "path";
import { fileURLToPath } from "url";

// Resolve to the project root (one level up from config/)
// Using import.meta.url instead of process.cwd() so the path is always
// correct regardless of the working directory the server was launched from
// (e.g. Claude Desktop spawns the server with a different cwd).
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const serverConfig = {
  name: process.env.MCP_SERVER_NAME || "sample-mcp-server",
  version: process.env.MCP_SERVER_VERSION || "1.0.0",

  // read_file safety: only allow reads within this directory tree
  allowedReadBasePath: process.env.ALLOWED_READ_BASE_PATH || PROJECT_ROOT,

  // Placeholder API key for future real weather service integration
  weatherApiKey: process.env.WEATHER_API_KEY || "",
};
