const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
    saveLastFolder: (dirPath) => ipcRenderer.invoke('save-last-folder', dirPath),
    getLastFolder: () => ipcRenderer.invoke('get-last-folder')
});


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('minimize-window')
    });
    document.getElementById('maximize-btn').addEventListener('click', () => {
        ipcRenderer.send('maximize-window')
    });
    document.getElementById('close-btn').addEventListener('click', () => {
        ipcRenderer.send('close-window')
    });
});