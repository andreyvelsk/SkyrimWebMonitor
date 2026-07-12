'use strict';

const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
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
            preload: path.join(__dirname, 'preload.cjs'),
            // ws:// from file:// is allowed by Chromium — no mixed-content issue.
        },
    });

    win.loadFile(path.join(__dirname, '../dist/index.html'));

    // Notify renderer of OS fullscreen changes so the button icon stays in sync
    win.on('enter-full-screen', () => win.webContents.send('fullscreen-changed', true));
    win.on('leave-full-screen', () => win.webContents.send('fullscreen-changed', false));

    // F11 — toggle fullscreen
    globalShortcut.register('F11', () => {
        win.setFullScreen(!win.isFullScreen());
    });

    // F12 — DevTools (handy for debugging on device)
    globalShortcut.register('F12', () => {
        win.webContents.toggleDevTools();
    });
}

// Zoom control from renderer (same behaviour as native Ctrl+/-)
ipcMain.on('set-zoom', (event, factor) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.webContents.setZoomFactor(factor);
});

// Fullscreen toggle from renderer (same as F11)
ipcMain.on('toggle-fullscreen', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setFullScreen(!win.isFullScreen());
});

// Get current fullscreen state (used on component mount for initial sync)
ipcMain.handle('get-fullscreen-state', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isFullScreen() : false;
});

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
