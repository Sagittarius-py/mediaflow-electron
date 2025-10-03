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
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');

    // IPC Handlers
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (result.canceled || result.filePaths.length === 0) return null;
        const folderPath = result.filePaths[0];
        return await readDirectoryRecursive(folderPath);
    });

    ipcMain.handle('read-directory', async (event, folderPath) => {
        return await readDirectoryRecursive(folderPath);
    });

    ipcMain.handle('open-folder', async (event, folderPath) => {
        require('electron').shell.openPath(folderPath);
    });

    ipcMain.handle('delete-file', async (event, filePath) => {
        try {
            fs.unlinkSync(filePath);
            return true;
        } catch {
            return false;
        }
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

async function readDirectoryRecursive(folderPath) {
    const result = {
        name: path.basename(folderPath),
        path: folderPath,
        isDirectory: true,
        children: []
    };

    try {
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(folderPath, entry.name);
            if (entry.isDirectory()) {
                const subDir = await readDirectoryRecursive(entryPath);
                result.children.push(subDir);
            } else {
                result.children.push({
                    name: entry.name,
                    path: entryPath,
                    isDirectory: false
                });
            }
        }
    } catch (error) {
        console.error('Error reading directory:', error);
    }

    return result;
}