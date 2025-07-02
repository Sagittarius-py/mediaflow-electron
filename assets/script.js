document.addEventListener('DOMContentLoaded', () => {
    const fileTree = document.getElementById('file-tree');
    const selectButton = document.getElementById('select-folder');

    // Global state for navigation
    let currentMediaList = [];
    let currentMediaIndex = -1;

    // --- TAGS/CATEGORIES ---
    let mediaTags = {};
    let allTags = [];

    // Load tags from localStorage
    function loadTags() {
        try {
            mediaTags = JSON.parse(localStorage.getItem('mediaTags') || '{}');
            allTags = JSON.parse(localStorage.getItem('allTags') || '[]');
        } catch { mediaTags = {}; allTags = []; }
    }
    // Save tags to localStorage
    function saveTags() {
        localStorage.setItem('mediaTags', JSON.stringify(mediaTags));
        localStorage.setItem('allTags', JSON.stringify(allTags));
    }

    // Show tag manager panel
    function showTagManager() {
        const panel = document.getElementById('tag-manager-panel');
        panel.style.display = 'block';
        panel.innerHTML = `<div style="background:rgba(1,1,1,0.95);padding:32px 24px 24px 24px;border-radius:16px;max-width:420px;margin:40px auto;color:#fff;box-shadow:0 8px 32px 0 #000a;">
            <h2 style='margin-top:0;font-size:1.5em;'>Manage Tags/Categories</h2>
            <div style='margin-bottom:18px;'>
                <input id='new-tag-input' type='text' placeholder='Add new tag...' style='padding:8px 12px;font-size:15px;border-radius:6px;border:none;width:70%;margin-right:8px;'>
                <button id='add-tag-btn' style='padding:8px 16px;font-size:15px;border-radius:6px;background:#0078d7;color:#fff;border:none;'>Add</button>
            </div>
            <div id='all-tags-list' style='display:flex;flex-wrap:wrap;gap:8px;'></div>
            <button id='close-tag-manager' style='margin-top:24px;padding:8px 18px;font-size:15px;border-radius:6px;background:#222;color:#fff;border:none;'>Close</button>
        </div>`;
        renderAllTagsList();
        document.getElementById('add-tag-btn').onclick = () => {
            const val = document.getElementById('new-tag-input').value.trim();
            if(val && !allTags.includes(val)) { allTags.push(val); saveTags(); renderAllTagsList(); document.getElementById('new-tag-input').value = ''; }
        };
        document.getElementById('close-tag-manager').onclick = () => { panel.style.display = 'none'; };
    }
    function renderAllTagsList() {
        const list = document.getElementById('all-tags-list');
        list.innerHTML = '';
        allTags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.textContent = tag;
            tagEl.style.cssText = 'background:#0078d7;padding:4px 12px;border-radius:12px;font-size:14px;display:inline-block;';
            const del = document.createElement('button');
            del.textContent = '✕';
            del.style.cssText = 'margin-left:6px;background:none;border:none;color:#fff;cursor:pointer;font-size:14px;';
            del.onclick = () => { allTags = allTags.filter(t => t!==tag); saveTags(); renderAllTagsList(); };
            tagEl.appendChild(del);
            list.appendChild(tagEl);
        });
    }

    // Renderowanie drzewa plików
    const renderTree = (items, parentElement, level = 0, parentIsLast = []) => {
        // Sortuj alfabetycznie, foldery na górze, pliki pod spodem
        const sorted = [...items].sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
        });
        sorted.forEach((item, idx) => {
            const isLast = idx === sorted.length - 1;
            if (item.isDirectory) {
                const folderDiv = document.createElement('div');
                folderDiv.className = 'folder collapsed'; // domyślnie zwinięte
                folderDiv.title = item.path;
                folderDiv.dataset.path = item.path;
                folderDiv.style.setProperty('--tree-level', level);

                // Prowadnice drzewa
                const guides = document.createElement('span');
                guides.className = 'tree-guides';
                for (let i = 0; i < level; i++) {
                    const guide = document.createElement('span');
                    guide.className = 'tree-guide';
                    if (parentIsLast[i]) {
                        guide.textContent = '   ';
                    } else {
                        guide.textContent = '│  ';
                    }
                    guides.appendChild(guide);
                }
                const guide = document.createElement('span');
                guide.className = 'tree-guide';
                guide.textContent = isLast ? '└─ ' : '├─ ';
                guides.appendChild(guide);
                folderDiv.appendChild(guides);

                // Ikonka do zwijania/rozwijania
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'folder-toggle';
                toggleIcon.innerHTML = '▶';
                toggleIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    folderDiv.classList.toggle('collapsed');
                    toggleIcon.innerHTML = folderDiv.classList.contains('collapsed') ? '▶' : '▼';
                    if (!folderDiv.querySelector('.subtree') && !folderDiv.classList.contains('collapsed')) {
                        loadSubdirectory(item.path, folderDiv, level + 1, [...parentIsLast, isLast]);
                    }
                });
                folderDiv.appendChild(toggleIcon);

                // Label na nazwę folderu
                const label = document.createElement('span');
                label.className = 'folder-label';
                label.textContent = item.name;
                label.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Wyświetl listę multimediów w folderze
                    showMediaList(item);
                });
                folderDiv.appendChild(label);

                const subtree = document.createElement('div');
                subtree.className = 'subtree';
                folderDiv.appendChild(subtree);
                if (item.children && item.children.length > 0) {
                    renderTree(item.children, subtree, level + 1, [...parentIsLast, isLast]);
                }
                parentElement.appendChild(folderDiv);
            } else {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'file';
                fileDiv.title = item.path;
                fileDiv.textContent = item.name;
                fileDiv.dataset.path = item.path;
                fileDiv.style.setProperty('--tree-level', level);
                // Prowadnice drzewa
                const guides = document.createElement('span');
                guides.className = 'tree-guides';
                for (let i = 0; i < level; i++) {
                    const guide = document.createElement('span');
                    guide.className = 'tree-guide';
                    if (parentIsLast[i]) {
                        guide.textContent = '   ';
                    } else {
                        guide.textContent = '│  ';
                    }
                    guides.appendChild(guide);
                }
                const guide = document.createElement('span');
                guide.className = 'tree-guide';
                guide.textContent = isLast ? '└─ ' : '├─ ';
                guides.appendChild(guide);
                fileDiv.insertBefore(guides, fileDiv.firstChild);
                // Dodaj atrybut do ikony pliku jeśli nieobsługiwany
                if (!item.name.match(/\.(mp3|mp4|wav|ogg|flac|aac|jpg|jpeg|png|gif|bmp|webp|svg|tiff?)$/i)) {
                    fileDiv.classList.add('file-unknown');
                }
                parentElement.appendChild(fileDiv);
            }
        });
    };

    // Leniwe ładowanie podfolderów
    const loadSubdirectory = async (path, parentElement) => {
        const subtree = parentElement.querySelector('.subtree');
        subtree.innerHTML = '<div class="loading">Ładowanie...</div>';

        try {
            const contents = await window.api.readDirectory(path);
            subtree.innerHTML = '';
            renderTree(contents, subtree);
        } catch (error) {
            subtree.innerHTML = '<div class="error">Błąd ładowania</div>';
        }
    };

    // Patch select folder logic to save last opened (only once)
    selectButton.addEventListener('click', async () => {
        const rootStructure = await window.api.selectFolder();
        if (rootStructure) {
            fileTree.innerHTML = '';
            renderTree([rootStructure], fileTree);
            document.getElementById('media-player').innerHTML = '';
            localStorage.setItem('lastOpenedFolder', rootStructure.path); // Save to localStorage
        }
    });

    // On load, try to auto-open last folder (only once, and only if not already rendered)
    async function tryAutoOpenLastFolder() {
        const last = localStorage.getItem('lastOpenedFolder');
        if (last) {
            try {
                const rootStructure = await window.api.readDirectory(last);
                if (rootStructure && rootStructure.name) {
                    fileTree.innerHTML = '';
                    renderTree([rootStructure], fileTree);
                }
            } catch (e) {
                // Folder not found or error, ignore
            }
        }
    }
    // Wywołaj po zainicjalizowaniu DOM
    tryAutoOpenLastFolder();

    // Wyświetlanie pliku multimedialnego po kliknięciu
    fileTree.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('file')) {
            e.stopPropagation();
            const filePath = target.dataset.path;
            const fileName = target.textContent;
            // Find all media files in the same folder
            const parentFolder = target.closest('.subtree, #file-tree');
            const siblings = Array.from(parentFolder.querySelectorAll('.file'));
            const mediaFiles = siblings.filter(f => f.textContent.match(/\.(mp3|mp4|wav|ogg|flac|aac|jpeg|jpg|png|gif|bmp|webp|svg|tiff?)$/i));
            const mediaList = mediaFiles.map(f => ({
                path: f.dataset.path,
                name: f.textContent
            }));
            const index = mediaList.findIndex(f => f.path === filePath);
            currentMediaList = mediaList;
            currentMediaIndex = index;
            showSingleMedia(filePath, fileName, mediaList, index);
        }
    });

    // Helper: show single media with navigation
    function showSingleMedia(filePath, fileName, mediaList = [], index = -1) {
        const mediaPlayer = document.getElementById('media-player');
        mediaPlayer.innerHTML = '';
        let fileUrl = filePath;
        if (!/^file:\/\//i.test(filePath)) {
            fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
        }
        fileUrl = encodeURI(fileUrl);
        let mediaHtml = '';
        if (fileName.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
            mediaHtml = `<audio controls src="${fileUrl}"></audio>`;
        } else if (fileName.match(/\.(mp4)$/i)) {
            mediaHtml = `<video controls width="600" src="${fileUrl}"></video>`;
        } else if (fileName.match(/\.(jpeg|jpg|png|gif|bmp|webp|svg|tiff?)$/i)) {
            mediaHtml = `<img src="${fileUrl}" style="max-width:100%;max-height:500px;" />`;
        } else {
            mediaHtml = '<div style="color:#888;font-size:13px;display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">📄</span>Nieobsługiwany format pliku.</div>';
        }
        // Navigation buttons
        let navHtml = '';
        if (mediaList.length > 1 && index >= 0) {
            navHtml = `<div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0;">
                <button id="media-prev" ${index === 0 ? 'disabled' : ''}>&larr; Previous</button>
                <span style="color:#aaa;font-size:12px;">${index+1} / ${mediaList.length}</span>
                <button id="media-next" ${index === mediaList.length-1 ? 'disabled' : ''}>Next &rarr;</button>
            </div>`;
        }
        mediaPlayer.innerHTML = navHtml + mediaHtml;
        // Button events
        if (mediaList.length > 1 && index >= 0) {
            document.getElementById('media-prev').onclick = () => showSingleMedia(mediaList[index-1].path, mediaList[index-1].name, mediaList, index-1);
            document.getElementById('media-next').onclick = () => showSingleMedia(mediaList[index+1].path, mediaList[index+1].name, mediaList, index+1);
            // Keyboard navigation
            document.onkeydown = (e) => {
                if (e.key === 'ArrowLeft' && index > 0) {
                    showSingleMedia(mediaList[index-1].path, mediaList[index-1].name, mediaList, index-1);
                } else if (e.key === 'ArrowRight' && index < mediaList.length-1) {
                    showSingleMedia(mediaList[index+1].path, mediaList[index+1].name, mediaList, index+1);
                }
            };
        } else {
            document.onkeydown = null;
        }
    }

    // Wyświetlanie listy multimediów w folderze
    function showMediaList(folderObj) {
        const mediaPlayer = document.getElementById('media-player');
        mediaPlayer.innerHTML = '';
        if (!folderObj.children || folderObj.children.length === 0) {
            mediaPlayer.innerHTML = '<div>Brak plików w tym folderze.</div>';
            return;
        }
        // Filtruj pliki multimedialne
        const mediaFiles = folderObj.children.filter(child =>
            child.isDirectory === false &&
            (child.name.match(/\.(mp3|mp4|wav|ogg|flac|aac)$/i) || child.name.match(/\.(jpe?g|png|gif|bmp|webp|svg|tiff?)$/i))
        );
        if (mediaFiles.length === 0) {
            mediaPlayer.innerHTML = '<div>Brak plików multimedialnych w tym folderze.</div>';
            return;
        }
        // --- Masonry grid: JS-driven, true dynamic sizing ---
        const grid = document.createElement('div');
        grid.className = 'media-masonry';
        grid.style.position = 'relative';
        grid.style.width = '100%';
        grid.style.minHeight = '400px';
        const gutter = 16; // px
        const columnWidth = 220; // px, can be adjusted
        let numColumns = Math.floor(mediaPlayer.offsetWidth / (columnWidth + gutter));
        if (numColumns < 1) numColumns = 1;
        // Prepare columns array
        let columns = Array(numColumns).fill(0);
        let items = [];
        // Pre-create all cells
        mediaFiles.forEach((file, idx) => {
            let fileUrl = file.path;
            if (!/^file:\/\//i.test(file.path)) {
                fileUrl = 'file:///' + file.path.replace(/\\/g, '/');
            }
            fileUrl = encodeURI(fileUrl);
            let cell = document.createElement('div');
            cell.className = 'media-masonry-item';
            cell.tabIndex = 0;
            cell.style.position = 'absolute';
            cell.style.width = columnWidth + 'px';
            cell.style.boxSizing = 'border-box';
            cell.style.borderRadius = '18px';
            cell.style.overflow = 'hidden';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            let mediaTag = '';
            if (file.name.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
                mediaTag = `<audio controls src="${fileUrl}"></audio>`;
            } else if (file.name.match(/\.(mp4)$/i)) {
                mediaTag = `<video controls width="100%" src="${fileUrl}" style="object-fit:cover;width:100%;height:100%;display:block;border-radius:18px;"></video>`;
            } else if (file.name.match(/\.(jpe?g|png|gif|bmp|webp|svg|tiff?)$/i)) {
                mediaTag = `<img src="${fileUrl}" style="object-fit:cover;width:100%;height:100%;display:block;border-radius:18px;" />`;
            }
            cell.innerHTML = mediaTag;
            // Click to open single media view
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                currentMediaList = mediaFiles;
                currentMediaIndex = idx;
                showSingleMedia(file.path, file.name, mediaFiles, idx);
            });
            grid.appendChild(cell);
            items.push(cell);
        });
        mediaPlayer.appendChild(grid);
        // After all images loaded, layout
        function layoutMasonry() {
            // Reset columns
            columns = Array(numColumns).fill(0);
            items.forEach(cell => {
                let minCol = 0;
                for (let i = 1; i < numColumns; i++) {
                    if (columns[i] < columns[minCol]) minCol = i;
                }
                cell.style.left = (minCol * (columnWidth + gutter)) + 'px';
                cell.style.top = columns[minCol] + 'px';
                columns[minCol] += cell.offsetHeight + gutter;
            });
            grid.style.height = Math.max(...columns) + 'px';
        }
        // Wait for all images/videos to load
        let mediaEls = Array.from(grid.querySelectorAll('img, video'));
        let loaded = 0;
        if (mediaEls.length === 0) layoutMasonry();
        mediaEls.forEach(el => {
            if (el.complete || el.readyState >= 2) {
                loaded++;
                if (loaded === mediaEls.length) layoutMasonry();
            } else {
                el.onload = el.onloadeddata = () => {
                    loaded++;
                    if (loaded === mediaEls.length) layoutMasonry();
                };
            }
        });
        // Relayout on resize
        window.addEventListener('resize', () => {
            let newNum = Math.floor(mediaPlayer.offsetWidth / (columnWidth + gutter));
            if (newNum < 1) newNum = 1;
            if (newNum !== numColumns) {
                numColumns = newNum;
                layoutMasonry();
            } else {
                layoutMasonry();
            }
        });
    }

    document.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('file') || e.target.classList.contains('folder')) {
            e.preventDefault();
            // Tutaj implementuj menu kontekstowe
            console.log('Menu kontekstowe dla:', e.target.dataset.path);
        }
    });

    // Open tag manager button
    const openTagManagerBtn = document.getElementById('open-tag-manager');
    openTagManagerBtn.onclick = showTagManager;

    // Patch single media view to show tags
    const origShowSingleMedia = showSingleMedia;
    showSingleMedia = function(filePath, fileName, mediaList = [], index = -1) {
        origShowSingleMedia(filePath, fileName, mediaList, index);
        renderMediaTags(filePath);
    };

    // Show tags for a single media file
    function renderMediaTags(filePath) {
        loadTags();
        const mediaPlayer = document.getElementById('media-player');
        let tagBox = document.createElement('div');
        tagBox.style.cssText = 'margin:18px 0 0 0;display:flex;flex-wrap:wrap;gap:8px;align-items:center;';
        let tags = mediaTags[filePath] || [];
        tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.textContent = tag;
            tagEl.style.cssText = 'background:#0078d7;padding:4px 12px;border-radius:12px;font-size:14px;display:inline-block;';
            const del = document.createElement('button');
            del.textContent = '✕';
            del.style.cssText = 'margin-left:6px;background:none;border:none;color:#fff;cursor:pointer;font-size:14px;';
            del.onclick = () => { tags = tags.filter(t => t!==tag); mediaTags[filePath]=tags; saveTags(); renderMediaTags(filePath); };
            tagEl.appendChild(del);
            tagBox.appendChild(tagEl);
        });
        // Add tag select
        const addSel = document.createElement('select');
        addSel.style.cssText = 'padding:4px 10px;border-radius:8px;font-size:14px;';
        addSel.innerHTML = `<option value=''>+ Add tag</option>` + allTags.filter(t=>!tags.includes(t)).map(t=>`<option value='${t}'>${t}</option>`).join('');
        addSel.onchange = () => { if(addSel.value) { tags.push(addSel.value); mediaTags[filePath]=tags; saveTags(); renderMediaTags(filePath); } };
        tagBox.appendChild(addSel);
        // Replace or append
        let old = mediaPlayer.querySelector('.media-tags-box');
        tagBox.className = 'media-tags-box';
        if(old) old.replaceWith(tagBox); else mediaPlayer.appendChild(tagBox);
    }
});