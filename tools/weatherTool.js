/**
 * get_weather tool — returns current weather for a given city.
 * Delegates to services/weatherService.js for data retrieval so the
 * business logic can be swapped to a real API without touching this file.
 */

import { getWeather } from "../services/weatherService.js";
import { logInfo, logError } from "../utils/logger.js";

export const weatherTool = {
  name: "get_weather",
  description: "Returns the current weather conditions for a given city.",
  inputSchema: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "The name of the city to get weather for.",
      },
    },
    required: ["city"],
  },

  /**
   * Execute the tool.
   * @param {{ city: string }} args
   */
  async execute(args) {
    const { city } = args;

    if (!city || typeof city !== "string" || city.trim() === "") {
      return {
        content: [{ type: "text", text: "Error: 'city' must be a non-empty string." }],
        isError: true,
      };
    }

    try {
      const weather = await getWeather(city.trim());
      logInfo(`get_weather succeeded for city: ${city}`);
      return {
        content: [
          {
            type: "text",
            text: `Weather in ${weather.city} is ${weather.condition}, ${weather.tempC}°C`,
          },
        ],
      };
    } catch (err) {
      logError("get_weather failed", err);
      return {
        content: [{ type: "text", text: `Error fetching weather: ${err.message}` }],
        isError: true,
      };
    }
  },
};
