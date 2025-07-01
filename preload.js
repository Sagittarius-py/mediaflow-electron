const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readDirectory: (path) => ipcRenderer.invoke('read-directory', path)
});


document.getElementById('minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize-window')
})

document.getElementById('maximize-btn').addEventListener('click', () => {
    ipcRenderer.send('maximize-window')
})

document.getElementById('close-btn').addEventListener('click', () => {
    ipcRenderer.send('close-window')
})