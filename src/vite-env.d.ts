/// <reference types="vite/client" />

interface McpLogPayload {
  type: 'request' | 'response' | 'error' | 'info';
  action: string;
  detail: string;
}

interface Window {
  electronAPI: {
    getAppVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    onMainProcessMessage: (callback: (message: string) => void) => void;
    sendMessage: (channel: string, data: unknown) => void;
    httpRequest: (url: string) => Promise<{ status: number; data: string }>;
    // MCP Frame capture
    onCaptureFrameRequest: (callback: () => void) => () => void;
    sendCaptureFrameResponse: (frame: string | null) => void;
    onMcpServerReady: (callback: (info: { port: number }) => void) => void;
    // MCP Logs
    onMcpLog: (callback: (log: McpLogPayload) => void) => () => void;
  };
}
