import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Receive messages from main process
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) =>
      callback(message)
    );
  },

  // Example: Send message to main process
  sendMessage: (channel: string, data: unknown) => {
    // Whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // HTTP request (bypasses CORS by going through main process)
  httpRequest: (url: string) => ipcRenderer.invoke('http-request', url),

  // MCP Frame capture: Listen for capture requests from main process
  onCaptureFrameRequest: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('mcp-capture-frame-request', handler);
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('mcp-capture-frame-request', handler);
    };
  },

  // MCP Frame capture: Send captured frame back to main process
  sendCaptureFrameResponse: (frame: string | null) => {
    ipcRenderer.send('mcp-capture-frame-response', frame);
  },

  // MCP Server status notification
  onMcpServerReady: (callback: (info: { port: number }) => void) => {
    ipcRenderer.on('mcp-server-ready', (_event, info) => callback(info));
  },

  // MCP Log: Receive log entries from main process
  onMcpLog: (
    callback: (log: {
      type: 'request' | 'response' | 'error' | 'info';
      action: string;
      detail: string;
    }) => void
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      log: { type: 'request' | 'response' | 'error' | 'info'; action: string; detail: string }
    ) => callback(log);
    ipcRenderer.on('mcp-log', handler);
    return () => {
      ipcRenderer.removeListener('mcp-log', handler);
    };
  },
});

// MCP Log entry type
interface McpLogPayload {
  type: 'request' | 'response' | 'error' | 'info';
  action: string;
  detail: string;
}

// Type definitions for the exposed API
declare global {
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
}
