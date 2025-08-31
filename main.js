// import required modules
import { app, BrowserWindow } from 'electron';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

let mainWindow;

// define current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

// create app window
function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'public/icon.ico'),
  });
  // maximize window
  mainWindow.maximize();
  // load HTML file with UI
  mainWindow.loadFile(join(__dirname, 'dist/index.html'));
}

// create window after app is ready
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// quit app when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});