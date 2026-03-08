/**
 * Lightweight logger utility.
 * All server and tool modules should use these helpers instead of
 * calling console.log directly so log output can be consistently
 * formatted and later redirected to a file or external service.
 */

/**
 * Log an informational message with a timestamp.
 * @param {string} message
 * @param {unknown} [data] - optional structured data to append
 */
export function logInfo(message, data) {
  const ts = new Date().toISOString();
  if (data !== undefined) {
    console.error(`[INFO]  ${ts} — ${message}`, data);
  } else {
    console.error(`[INFO]  ${ts} — ${message}`);
  }
}

/**
 * Log an error message with a timestamp.
 * @param {string} message
 * @param {unknown} [error] - optional Error object or structured data
 */
export function logError(message, error) {
  const ts = new Date().toISOString();
  if (error !== undefined) {
    console.error(`[ERROR] ${ts} — ${message}`, error);
  } else {
    console.error(`[ERROR] ${ts} — ${message}`);
  }
}
