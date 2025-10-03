export function showSingleMedia(filePath, fileName, mediaList = [], index = -1) {
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

export function showMediaList(folderObj) {
    const mediaPlayer = document.getElementById('media-player');
    mediaPlayer.innerHTML = '';
    if (!folderObj.children || folderObj.children.length === 0) {
        mediaPlayer.innerHTML = '<div>Brak plików w tym folderze.</div>';
        return;
    }
    // Filtruj pliki obrazów
    const imageFiles = folderObj.children.filter(child =>
        child.isDirectory === false &&
        child.name.match(/\.(jpe?g|png|gif|bmp|webp|svg|tiff?)$/i)
    );
    if (imageFiles.length === 0) {
        mediaPlayer.innerHTML = '<div>Brak obrazów w tym folderze.</div>';
        return;
    }

    // --- PAGINATION ---
    const pageSize = 100;
    let currentPage = 0;
    const totalPages = Math.ceil(imageFiles.length / pageSize);

    function renderPage(page) {
        mediaPlayer.innerHTML = '';
        // Nawigacja
        const nav = document.createElement('div');
        nav.style = 'display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:18px;background:#222;padding:8px 0;border-radius:8px;box-shadow:0 2px 8px #0002;';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Poprzednia';
        prevBtn.disabled = page === 0;
        prevBtn.onclick = () => { renderPage(page - 1); };

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Następna';
        nextBtn.disabled = page === totalPages - 1;
        nextBtn.onclick = () => { renderPage(page + 1); };

        const info = document.createElement('span');
        info.textContent = `Strona ${page + 1} / ${totalPages} (${imageFiles.length} obrazów)`;

        // Pole do wpisania numeru strony
        const pageInput = document.createElement('input');
        pageInput.type = 'number';
        pageInput.min = 1;
        pageInput.max = totalPages;
        pageInput.value = page + 1;
        pageInput.style = 'width:60px;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:14px;';
        pageInput.title = 'Numer strony';

        const goBtn = document.createElement('button');
        goBtn.textContent = 'Idź';
        goBtn.onclick = () => {
            let val = parseInt(pageInput.value, 10);
            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                renderPage(val - 1);
            } else {
                pageInput.value = page + 1;
            }
        };

        nav.appendChild(prevBtn);
        nav.appendChild(info);
        nav.appendChild(pageInput);
        nav.appendChild(goBtn);
        nav.appendChild(nextBtn);
        mediaPlayer.appendChild(nav);

        // Masonry grid tylko dla widocznych obrazów
        const grid = document.createElement('div');
        grid.className = 'media-masonry';
        grid.style.position = 'relative';
        grid.style.width = '100%';
        grid.style.minHeight = '400px';
        grid.style.padding = '8px 0 24px 0';
        grid.style.background = '#181818';
        grid.style.borderRadius = '12px';
        grid.style.boxShadow = '0 2px 12px #0002';

        const gutter = 16;
        const columnWidth = 220;
        let numColumns = Math.floor(mediaPlayer.offsetWidth / (columnWidth + gutter));
        if (numColumns < 1) numColumns = 1;
        let columns = Array(numColumns).fill(0);
        let items = [];
        // Renderuj tylko obrazy z bieżącej strony
        const pageFiles = imageFiles.slice(page * pageSize, (page + 1) * pageSize);
        pageFiles.forEach((file, idx) => {
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
            cell.style.boxShadow = '0 2px 8px #0003';
            cell.style.background = '#222';
            cell.style.transition = 'box-shadow 0.15s, transform 0.15s';
            cell.onmouseenter = () => {
                cell.style.boxShadow = '0 6px 24px #0078d7aa';
                cell.style.transform = 'scale(1.04)';
            };
            cell.onmouseleave = () => {
                cell.style.boxShadow = '0 2px 8px #0003';
                cell.style.transform = 'scale(1)';
            };
            let mediaTag = `<img src="${fileUrl}" style="object-fit:cover;width:100%;height:100%;display:block;border-radius:18px;" loading="lazy" />`;
            cell.innerHTML = mediaTag;
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                showSingleMedia(file.path, file.name, pageFiles, idx);
            });
            grid.appendChild(cell);
            items.push(cell);
        });
        mediaPlayer.appendChild(grid);

        // Layout masonry tylko dla widocznych obrazów
        function layoutMasonry() {
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
        let mediaEls = Array.from(grid.querySelectorAll('img'));
        let loaded = 0;
        if (mediaEls.length === 0) layoutMasonry();
        mediaEls.forEach(el => {
            if (el.complete) {
                loaded++;
                if (loaded === mediaEls.length) layoutMasonry();
            } else {
                el.onload = () => {
                    loaded++;
                    if (loaded === mediaEls.length) layoutMasonry();
                };
            }
        });
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

    renderPage(currentPage);
}
