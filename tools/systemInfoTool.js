/**
 * system_info tool — returns information about the host system.
 */

import os from "os";
import { logInfo } from "../utils/logger.js";

export const systemInfoTool = {
  name: "system_info",
  description:
    "Returns information about the host system: platform, CPU architecture, memory usage, and uptime.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },

  /**
   * Execute the tool.
   */
  async execute(_args) {
    const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(1);
    const freeMemMB  = (os.freemem()  / 1024 / 1024).toFixed(1);
    const usedMemMB  = (os.totalmem() / 1024 / 1024 - Number(freeMemMB)).toFixed(1);
    const uptimeHrs  = (os.uptime() / 3600).toFixed(2);

    const info = {
      platform:     os.platform(),
      architecture: os.arch(),
      memory: {
        totalMB: totalMemMB,
        usedMB:  usedMemMB,
        freeMB:  freeMemMB,
      },
      uptimeHours: uptimeHrs,
    };

    logInfo("system_info called", info);

    const text = [
      `Platform:     ${info.platform}`,
      `Architecture: ${info.architecture}`,
      `Memory total: ${info.memory.totalMB} MB`,
      `Memory used:  ${info.memory.usedMB} MB`,
      `Memory free:  ${info.memory.freeMB} MB`,
      `Uptime:       ${info.uptimeHours} hours`,
    ].join("\n");

    return {
      content: [{ type: "text", text }],
    };
  },
};
