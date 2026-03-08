/**
 * Tool registry — exports all available tools as an array.
 *
 * To add a new tool:
 * 1. Create a file in this directory (e.g. tools/myNewTool.js) that exports
 *    an object with: { name, description, inputSchema, execute }
 * 2. Import it here and add it to the `tools` array below.
 * The server will register it automatically — no other changes required.
 */

import { timeTool }       from "./timeTool.js";
import { weatherTool }    from "./weatherTool.js";
import { fileReaderTool } from "./fileReaderTool.js";
import { systemInfoTool } from "./systemInfoTool.js";

export const tools = [
  timeTool,
  weatherTool,
  fileReaderTool,
  systemInfoTool,
];
