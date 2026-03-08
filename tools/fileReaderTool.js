/**
 * read_file tool — reads and returns the contents of a file.
 *
 * Safety: paths are resolved relative to `serverConfig.allowedReadBasePath`
 * (defaults to the process working directory). Any path that escapes this
 * root via traversal (e.g. "../../etc/passwd") is rejected.
 */

import fs from "fs/promises";
import path from "path";
import { serverConfig } from "../config/serverConfig.js";
import { logInfo, logError } from "../utils/logger.js";

export const fileReaderTool = {
  name: "read_file",
  description:
    "Reads the contents of a file at the given path. Paths must be within the server's allowed base directory.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Relative or absolute path to the file to read.",
      },
    },
    required: ["path"],
  },

  /**
   * Execute the tool.
   * @param {{ path: string }} args
   */
  async execute(args) {
    const { path: filePath } = args;

    if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
      return {
        content: [{ type: "text", text: "Error: 'path' must be a non-empty string." }],
        isError: true,
      };
    }

    const basePath = path.resolve(serverConfig.allowedReadBasePath);
    const resolvedPath = path.resolve(basePath, filePath.trim());

    // Prevent directory traversal outside the allowed base
    if (!resolvedPath.startsWith(basePath + path.sep) && resolvedPath !== basePath) {
      logError(`read_file blocked unsafe path: ${resolvedPath}`);
      return {
        content: [
          {
            type: "text",
            text: `Error: Access denied. Path must be within ${basePath}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const content = await fs.readFile(resolvedPath, "utf-8");
      logInfo(`read_file read ${resolvedPath} (${content.length} chars)`);
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (err) {
      logError(`read_file error for ${resolvedPath}`, err);
      const message =
        err.code === "ENOENT"
          ? `Error: File not found: ${resolvedPath}`
          : err.code === "EACCES"
          ? `Error: Permission denied: ${resolvedPath}`
          : `Error reading file: ${err.message}`;
      return {
        content: [{ type: "text", text: message }],
        isError: true,
      };
    }
  },
};
