import { loadTags, showTagManager, renderMediaTags } from './tags.js';
import { renderTree, loadSubdirectory } from './tree.js';
import { showSingleMedia, showMediaList } from './media.js';
import { setupContextMenu } from './contextmenu.js';

document.addEventListener('DOMContentLoaded', async () => {
    const fileTree = document.getElementById('file-tree');
    const selectButton = document.getElementById('select-folder');

    loadTags();

    async function showFolderImages(folderObj) {
        if (!folderObj || !folderObj.path) return;
        const folderData = await window.api.readDirectory(folderObj.path);
        if (folderData && folderData.children) {
            showMediaList(folderData);
        }
    }

    async function tryAutoOpenLastFolder() {
        const last = localStorage.getItem('lastOpenedFolder');
        if (last && fileTree.innerHTML.trim() === '') {
            try {
                const rootStructure = await window.api.readDirectory(last);
                if (rootStructure && rootStructure.name) {
                    fileTree.innerHTML = '';
                    renderTree([rootStructure], fileTree, 0, [], showFolderImages);
                }
            } catch {}
        }
    }
    await tryAutoOpenLastFolder();

    selectButton.addEventListener('click', async () => {
        if (!window.api || typeof window.api.selectFolder !== 'function') {
            alert('API nie jest dostępne. Sprawdź preload script.');
            return;
        }
        const rootStructure = await window.api.selectFolder();
        if (rootStructure) {
            fileTree.innerHTML = '';
            renderTree([rootStructure], fileTree, 0, [], showFolderImages);
            document.getElementById('media-player').innerHTML = '';
            localStorage.setItem('lastOpenedFolder', rootStructure.path);
        }
    });

    fileTree.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('file')) {
            e.stopPropagation();
            const filePath = target.dataset.path;
            const fileName = target.textContent;
            const parentFolder = target.closest('.subtree, #file-tree');
            const siblings = Array.from(parentFolder.querySelectorAll('.file'));
            const mediaFiles = siblings.filter(f => f.textContent.match(/\.(mp3|mp4|wav|ogg|flac|aac|jpeg|jpg|png|gif|bmp|webp|svg|tiff?)$/i));
            const mediaList = mediaFiles.map(f => ({
                path: f.dataset.path,
                name: f.textContent
            }));
            const index = mediaList.findIndex(f => f.path === filePath);
            showSingleMedia(filePath, fileName, mediaList, index);
            renderMediaTags(filePath);
        } else if (target.classList.contains('folder-toggle')) {
            e.stopPropagation();
            const folderDiv = target.closest('.folder');
            if (folderDiv && folderDiv.dataset.path) {
                folderDiv.classList.toggle('collapsed');
                target.innerHTML = folderDiv.classList.contains('collapsed') ? '▶' : '▼';
                if (!folderDiv.querySelector('.subtree') && !folderDiv.classList.contains('collapsed')) {
                    loadSubdirectory(folderDiv.dataset.path, folderDiv);
                }
            }
        }
    });

    setupContextMenu();

    document.getElementById('open-tag-manager').onclick = showTagManager;
});