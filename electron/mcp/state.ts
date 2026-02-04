/**
 * Shared state management for MCP Server.
 * Maintains arm connection status, position, and provides state accessors.
 */

export interface ArmState {
  /** Whether the arm is connected */
  isConnected: boolean;
  /** Resource handle returned from connection (> 0 = valid) */
  resourceHandle: number;
  /** Server IP address */
  serverIP: string;
  /** COM port */
  comPort: string;
  /** Current X position in millimeters */
  currentX: number;
  /** Current Y position in millimeters */
  currentY: number;
  /** Z-axis depth for click operations */
  zDepth: number;
}

/** Default arm controller configuration */
export const ARM_CONFIG = {
  defaultServerIP: '192.168.5.106',
  apiPort: '8082',
  defaultComPort: 'COM3',
  apiPath: '/MyWcfService/getstring',
  deviceReadyDelay: 2000,
  commandDelay: 300,
  clickDelay: 250,
  defaultZDepth: 12,
  zUp: 0,
} as const;

/** Global arm state instance */
let armState: ArmState = {
  isConnected: false,
  resourceHandle: 0,
  serverIP: ARM_CONFIG.defaultServerIP,
  comPort: ARM_CONFIG.defaultComPort,
  currentX: 0,
  currentY: 0,
  zDepth: ARM_CONFIG.defaultZDepth,
};

/** Frame capture callback type */
type FrameCaptureCallback = () => Promise<string | null>;

/** Frame capture function (set by main process when renderer is ready) */
let frameCaptureCallback: FrameCaptureCallback | null = null;

/** MCP Log entry type */
export interface McpLogEntry {
  type: 'request' | 'response' | 'error' | 'info';
  action: string;
  detail: string;
}

/** MCP log callback type */
type McpLogCallback = (log: McpLogEntry) => void;

/** MCP log function (set by main process) */
let mcpLogCallback: McpLogCallback | null = null;

/**
 * Gets the current arm state.
 */
export function getArmState(): Readonly<ArmState> {
  return { ...armState };
}

/**
 * Updates the arm state with partial values.
 */
export function updateArmState(updates: Partial<ArmState>): void {
  armState = { ...armState, ...updates };
}

/**
 * Resets the arm state to defaults.
 */
export function resetArmState(): void {
  armState = {
    isConnected: false,
    resourceHandle: 0,
    serverIP: ARM_CONFIG.defaultServerIP,
    comPort: ARM_CONFIG.defaultComPort,
    currentX: 0,
    currentY: 0,
    zDepth: ARM_CONFIG.defaultZDepth,
  };
}

/**
 * Sets the frame capture callback function.
 * Called by main process when renderer is ready.
 */
export function setFrameCaptureCallback(callback: FrameCaptureCallback): void {
  frameCaptureCallback = callback;
}

/**
 * Captures a frame from the camera.
 * Returns base64-encoded JPEG image or null if capture fails.
 */
export async function captureFrame(): Promise<string | null> {
  if (!frameCaptureCallback) {
    console.warn('Frame capture callback not set');
    return null;
  }
  return frameCaptureCallback();
}

/**
 * Builds the API URL for arm controller commands.
 */
export function buildArmApiUrl(params: {
  duankou: string;
  hco: number;
  daima: string;
}): string {
  const baseUrl = `http://${armState.serverIP}:${ARM_CONFIG.apiPort}${ARM_CONFIG.apiPath}`;
  const queryParams = new URLSearchParams({
    duankou: params.duankou,
    hco: params.hco.toString(),
    daima: params.daima,
  });
  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Parses server response by removing surrounding quotes.
 */
export function parseServerResponse(response: string): string {
  return response.replace(/^"|"$/g, '');
}

/**
 * Parses resource handle from server response.
 */
export function parseResourceHandle(response: string): number {
  const cleanResult = parseServerResponse(response);
  const handle = parseInt(cleanResult, 10);
  return isNaN(handle) ? 0 : handle;
}

/**
 * Delays execution for specified milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sets the MCP log callback function.
 * Called by main process to enable log forwarding to renderer.
 */
export function setMcpLogCallback(callback: McpLogCallback): void {
  mcpLogCallback = callback;
}

/**
 * Sends an MCP log entry to the renderer process.
 */
export function sendMcpLog(log: McpLogEntry): void {
  if (mcpLogCallback) {
    mcpLogCallback(log);
  }
  // Also log to console
  console.log(`[MCP ${log.type.toUpperCase()}] ${log.action}: ${log.detail}`);
}
