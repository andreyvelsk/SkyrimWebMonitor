'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    /** Zoom (identical to Ctrl+/-): fixed elements stay anchored to viewport. */
    setZoom: (factor) => ipcRenderer.send('set-zoom', factor),

    /** OS-level fullscreen toggle (same as F11 / win.setFullScreen). */
    toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),

    /** Get current OS fullscreen state from main process. */
    getFullscreenState: () => ipcRenderer.invoke('get-fullscreen-state'),

    /**
     * Subscribe to OS fullscreen state changes.
     * Returns a cleanup function — call it in onUnmounted.
     */
    onFullscreenChange: (callback) => {
        const handler = (_, isFs) => callback(isFs);
        ipcRenderer.on('fullscreen-changed', handler);
        return () => ipcRenderer.removeListener('fullscreen-changed', handler);
    },
});
