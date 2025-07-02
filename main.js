const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

// Helpers for last opened folder persistence
const lastDirPath = path.join(app.getPath('userData'), 'last-folder.txt');
function saveLastOpenedFolder(dirPath) {
    try { fs.writeFileSync(lastDirPath, dirPath, 'utf-8'); } catch {}
}
function getLastOpenedFolder() {
    try {
        if (fs.existsSync(lastDirPath)) {
            const p = fs.readFileSync(lastDirPath, 'utf-8').trim();
            if (p && fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
        }
    } catch {}
    return null;
}

// Funkcja do czytania struktury folderów
const getDirectoryStructure = (dirPath) => {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    return items.map(item => ({
        name: item.name,
        path: path.join(dirPath, item.name),
        isDirectory: item.isDirectory(),
        children: item.isDirectory() ? getDirectoryStructure(path.join(dirPath, item.name)) : []
    }));
};

app.whenReady().then(() => {
mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    transparent: true, // Enable transparency for custom effects
    frame: false, // We'll create our own title bar
    titleBarStyle: 'hidden', // Hide default title bar but keep window controls
    titleBarOverlay: {
        color: '#2a2a2a', // Dark overlay color for traffic lights
        symbolColor: '#e0e0e0', // Light color for control buttons
        height: 40 // Custom title bar height
    },
    visualEffectState: 'active', // Enable vibrancy effects on macOS
    backgroundColor: '#00000000',
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
    }
});

    mainWindow.loadFile('index.html');

    // IPC Handlers
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (!result.canceled) {
            const rootPath = result.filePaths[0];
            return {
                name: path.basename(rootPath),
                path: rootPath,
                isDirectory: true,
                children: getDirectoryStructure(rootPath)
            };
        }
        return null;
    });

    ipcMain.handle('read-directory', (event, dirPath) => {
        return getDirectoryStructure(dirPath);
    });

    ipcMain.handle('save-last-folder', (event, dirPath) => {
        saveLastOpenedFolder(dirPath);
    });
    ipcMain.handle('get-last-folder', () => {
        return getLastOpenedFolder();
    });
});

ipcMain.on('minimize-window', () => {
    mainWindow.minimize()
})

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow.maximize()
    }
})

ipcMain.on('close-window', () => {
    mainWindow.close()
})