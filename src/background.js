import { app, protocol, BrowserWindow, Tray, Menu, screen, nativeImage } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import path from 'path';
import getData from './resourceManager';
import { LazyConfig } from './lazyConfig';
const isDevelopment = process.env.NODE_ENV !== 'production';

const config = new LazyConfig();

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

let win;
let tray;

async function createWindow() {
  let display = screen.getAllDisplays()[0];
  const { width, height } = display.workAreaSize;
  const { x, y } = display.bounds;
  const icon = nativeImage.createFromPath(path.join(__static, 'favicon.ico'));
  win = new BrowserWindow({
    x: config.has('x') ? config.get('x') : x,
    y: config.has('y') ? config.get('y') : y,
    width: config.has('width') ? config.get('x') : width,
    height: config.has('width') ? config.get('x') : height,
    frame: false,
    show: false,
    backgroundColor: '#000000',
    icon: icon,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  win.setMenu(null);

  win.setMinimizable(false);
  if (config.get('maximized')) {
    win.maximize();
  }

  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Reload',
      click: () => {
        win.webContents.reload();
      }
    },
    {
      label: 'Dev Tools',
      click: () => {
        win.webContents.openDevTools();
      }
    },
    {
      label: 'Exit',
      click: () => {
        process.exit(0);
      }
    }
  ]);
  tray.setToolTip('Resource Monitor');
  tray.setContextMenu(contextMenu);

  win.once('ready-to-show', () => {
    win.show();
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol('app');
    win.loadURL('app://./index.html');
  }

  setInterval(async () => {
    win.webContents.send('data', await getData());
  }, 1000);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    })
  }
}