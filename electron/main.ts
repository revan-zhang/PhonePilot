import { app, BrowserWindow, ipcMain, net } from 'electron';
import path from 'path';

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
 * App initialization.
 * Creates window when Electron is ready.
 * On macOS, recreates window when dock icon is clicked with no windows open.
 */
app.whenReady().then(() => {
  createWindow();

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
