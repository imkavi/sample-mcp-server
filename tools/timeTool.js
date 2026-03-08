/**
 * get_time tool — returns the current server time in ISO 8601 format.
 */

import { logInfo } from "../utils/logger.js";

export const timeTool = {
  name: "get_time",
  description: "Returns the current server date and time in ISO 8601 format.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },

  /**
   * Execute the tool.
   * @returns {Promise<{ content: Array<{ type: string, text: string }> }>}
   */
  async execute(_args) {
    // toISOString() is always UTC. Use toLocaleString with the system timezone
    // so the returned time matches the server's local clock.
    const now = new Date();
    const localTime = now.toLocaleString("sv-SE", {
      timeZoneName: "short",
      hour12: false,
    });
    logInfo(`get_time called — returning ${localTime}`);
    return {
      content: [
        {
          type: "text",
          text: `Current server time: ${localTime}`,
        },
      ],
    };
  },
};
