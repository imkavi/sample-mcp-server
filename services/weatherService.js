/**
 * Weather service.
 *
 * Currently returns mock data. To integrate a real weather API:
 * 1. Set WEATHER_API_KEY in your environment.
 * 2. Replace the mock implementation below with an HTTP call
 *    (e.g. fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)).
 */

import { serverConfig } from "../config/serverConfig.js";
import { logInfo } from "../utils/logger.js";

// Static mock data keyed by lower-case city name
const MOCK_WEATHER = {
  amsterdam: { condition: "sunny", tempC: 18 },
  london:    { condition: "cloudy", tempC: 12 },
  tokyo:     { condition: "rainy", tempC: 22 },
  new_york:  { condition: "windy", tempC: 15 },
  sydney:    { condition: "sunny", tempC: 25 },
};

/**
 * Return weather information for a given city.
 * @param {string} city
 * @returns {Promise<{ condition: string, tempC: number, city: string }>}
 */
export async function getWeather(city) {
  logInfo(`Fetching weather for city: ${city}`);

  const key = city.toLowerCase().replace(/\s+/g, "_");
  const data = MOCK_WEATHER[key] ?? { condition: "partly cloudy", tempC: 20 };

  // Simulate async latency so the interface matches a real API call
  await new Promise((resolve) => setTimeout(resolve, 50));

  return { city, condition: data.condition, tempC: data.tempC };
}
