'use strict';

const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// --fullscreen flag: start in fullscreen mode (useful for Steam Deck / kiosk use)
const startFullscreen = process.argv.includes('--fullscreen');

function createWindow() {
    const win = new BrowserWindow({
        // Steam Deck native resolution; works on any display
        width: 1280,
        height: 800,
        minWidth: 320,
        minHeight: 480,
        title: 'SkyrimWebMonitor',
        fullscreen: startFullscreen,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // ws:// from file:// is allowed by Chromium — no mixed-content issue.
        },
    });

    win.loadFile(path.join(__dirname, '../dist/index.html'));

    // F11 — toggle fullscreen
    globalShortcut.register('F11', () => {
        win.setFullScreen(!win.isFullScreen());
    });

    // F12 — DevTools (handy for debugging on device)
    globalShortcut.register('F12', () => {
        win.webContents.toggleDevTools();
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
