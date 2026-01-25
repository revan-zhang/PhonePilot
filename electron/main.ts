import { app, BrowserWindow, ipcMain, net } from 'electron';
import path from 'path';
import { PhonePilotMcpServer } from './mcp';
import { setFrameCaptureCallback, setMcpLogCallback } from './mcp/state';

/**
 * Build output directory structure:
 * ├── dist-electron/
 * │   ├── main/main.js
 * │   └── preload/preload.js
 * └── dist/index.html
 */
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let mainWindow: BrowserWindow | null = null;
let mcpServer: PhonePilotMcpServer | null = null;

/** Pending frame capture resolve function */
let pendingFrameResolve: ((frame: string | null) => void) | null = null;

/** Use bracket notation to avoid vite:define plugin transformation */
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

/**
 * Creates the main application window.
 * Configures window size, preload script, and content loading.
 * Shows window only after ready to prevent visual flash.
 * Sends timestamp message to renderer on load.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send(
      'main-process-message',
      new Date().toLocaleString()
    );
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST || '', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Performs an HTTP request to the arm controller.
 * Used by MCP Server for arm control commands.
 */
async function httpRequest(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let responseData = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      response.on('end', () => {
        resolve(responseData);
      });

      response.on('error', (error: Error) => {
        reject(new Error(`Response error: ${error.message}`));
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    request.end();
  });
}

/**
 * Captures a frame from the renderer process via IPC.
 * Sends request to renderer and waits for response.
 */
async function captureFrameFromRenderer(): Promise<string | null> {
  if (!mainWindow) {
    console.warn('Cannot capture frame: mainWindow is null');
    return null;
  }

  return new Promise((resolve) => {
    // Set timeout in case renderer doesn't respond
    const timeout = setTimeout(() => {
      pendingFrameResolve = null;
      resolve(null);
    }, 5000);

    pendingFrameResolve = (frame: string | null) => {
      clearTimeout(timeout);
      pendingFrameResolve = null;
      resolve(frame);
    };

    // Request frame from renderer
    mainWindow.webContents.send('mcp-capture-frame-request');
  });
}

/**
 * Sends MCP log to renderer process.
 */
function sendMcpLogToRenderer(log: {
  type: 'request' | 'response' | 'error' | 'info';
  action: string;
  detail: string;
}): void {
  if (mainWindow) {
    mainWindow.webContents.send('mcp-log', log);
  }
}

/**
 * Initializes and starts the MCP Server.
 */
async function startMcpServer(): Promise<void> {
  // Set up frame capture callback
  setFrameCaptureCallback(captureFrameFromRenderer);

  // Set up MCP log callback to forward logs to renderer
  setMcpLogCallback(sendMcpLogToRenderer);

  // Create and start MCP server
  mcpServer = new PhonePilotMcpServer(httpRequest);
  const port = await mcpServer.start();

  // Notify renderer when MCP server is ready
  if (mainWindow) {
    mainWindow.webContents.send('mcp-server-ready', { port });
  }
}

/**
 * App initialization.
 * Creates window when Electron is ready.
 * Starts MCP Server for Claude/Cursor integration.
 * On macOS, recreates window when dock icon is clicked with no windows open.
 */
app.whenReady().then(async () => {
  createWindow();

  // Start MCP Server after window is created
  try {
    await startMcpServer();
  } catch (error) {
    console.error('Failed to start MCP Server:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/** Quit when all windows are closed, except on macOS */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/** Clean up MCP Server before quitting */
app.on('will-quit', () => {
  if (mcpServer) {
    mcpServer.stop();
    mcpServer = null;
  }
});

/** IPC handler: Returns app version */
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

/** IPC handler: Returns current platform */
ipcMain.handle('get-platform', () => {
  return process.platform;
});

/**
 * IPC handler: Performs HTTP request from main process.
 * Bypasses CORS restrictions that would block renderer process requests.
 *
 * @param url - Target URL for the HTTP request
 * @returns Promise resolving to { status, data }
 */
ipcMain.handle('http-request', async (_event, url: string) => {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let responseData = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        responseData += chunk.toString();
      });

      response.on('end', () => {
        resolve({
          status: response.statusCode,
          data: responseData,
        });
      });

      response.on('error', (error: Error) => {
        reject(new Error(`Response error: ${error.message}`));
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    request.end();
  });
});

/**
 * IPC listener: Receives captured frame from renderer process.
 * Called in response to 'mcp-capture-frame-request'.
 */
ipcMain.on('mcp-capture-frame-response', (_event, frame: string | null) => {
  if (pendingFrameResolve) {
    pendingFrameResolve(frame);
  }
});
