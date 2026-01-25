/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    getAppVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    onMainProcessMessage: (callback: (message: string) => void) => void;
    sendMessage: (channel: string, data: unknown) => void;
    httpRequest: (url: string) => Promise<{ status: number; data: string }>;
  };
}
