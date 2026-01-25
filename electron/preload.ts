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
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      onMainProcessMessage: (callback: (message: string) => void) => void;
      sendMessage: (channel: string, data: unknown) => void;
      httpRequest: (url: string) => Promise<{ status: number; data: string }>;
    };
  }
}
