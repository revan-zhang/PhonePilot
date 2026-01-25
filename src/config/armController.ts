/**
 * Arm controller configuration.
 * Contains default values for server connection, timing, and movement settings.
 */
export const ARM_CONTROLLER_CONFIG = {
  /** Default server IP address */
  defaultServerIP: '192.168.1.236',
  /** API service port */
  apiPort: '8082',
  /** Default COM port */
  defaultComPort: 'COM3',
  /** API endpoint path */
  apiPath: '/MyWcfService/getstring',
  /** Delay after connection for device to be ready (ms) */
  deviceReadyDelay: 2000,
  /** Delay between sequential commands (ms) */
  commandDelay: 300,
  /** Delay for click operation (ms) */
  clickDelay: 250,
  /** Available step size options */
  stepOptions: [1, 5, 10, 20] as const,
  /** Default step size for movement */
  defaultStepSize: 10,
} as const;

/**
 * Parses server response by removing surrounding quotes.
 * The server returns JSON-formatted strings (e.g., "1136"), which need quote stripping.
 *
 * @param response - Raw response string from server
 * @returns Cleaned string without surrounding quotes
 */
export function parseServerResponse(response: string): string {
  return response.replace(/^"|"$/g, '');
}

/**
 * Parses resource handle from server response.
 * Returns the parsed number, or 0 if parsing fails.
 *
 * @param response - Raw response string from server
 * @returns Parsed resource handle (> 0 for success, 0 for failure)
 */
export function parseResourceHandle(response: string): number {
  const cleanResult = parseServerResponse(response);
  const handle = parseInt(cleanResult, 10);
  return isNaN(handle) ? 0 : handle;
}

/**
 * Builds the API URL for arm controller commands.
 *
 * @param serverIP - Server IP address
 * @param params - Command parameters (duankou, hco, daima)
 * @returns Complete API URL with query parameters
 */
export function buildArmApiUrl(
  serverIP: string,
  params: { duankou: string; hco: number; daima: string }
): string {
  const { apiPort, apiPath } = ARM_CONTROLLER_CONFIG;
  const baseUrl = `http://${serverIP}:${apiPort}${apiPath}`;
  const queryParams = new URLSearchParams({
    duankou: params.duankou,
    hco: params.hco.toString(),
    daima: params.daima,
  });
  return `${baseUrl}?${queryParams.toString()}`;
}
