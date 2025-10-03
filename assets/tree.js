export function renderTree(items, parentElement, level = 0, parentIsLast = [], onFolderLabelClick) {
    const sorted = [...items].sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
    });
    sorted.forEach((item, idx) => {
        const isLast = idx === sorted.length - 1;
        if (item.isDirectory) {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'folder collapsed';
            folderDiv.title = item.path;
            folderDiv.dataset.path = item.path;
            folderDiv.style.setProperty('--tree-level', level);
            folderDiv.style.paddingLeft = (level * 14 + 10) + 'px';
            folderDiv.style.maxWidth = '210px';
            folderDiv.style.overflow = 'hidden';
            folderDiv.style.display = 'flex';
            folderDiv.style.alignItems = 'center';
            folderDiv.style.gap = '5px';
            folderDiv.style.fontFamily = "'Segoe UI', Arial, sans-serif";
            folderDiv.style.fontSize = '14px';
            folderDiv.style.cursor = 'pointer';
            folderDiv.style.userSelect = 'none';
            folderDiv.style.transition = 'background 0.15s, box-shadow 0.15s';
            folderDiv.style.borderRadius = '6px';
            folderDiv.style.marginBottom = '2px';

            folderDiv.onmouseenter = () => {
                folderDiv.style.background = '#1a2233';
                folderDiv.style.boxShadow = '0 1px 4px #0001';
            };
            folderDiv.onmouseleave = () => {
                folderDiv.style.background = 'none';
                folderDiv.style.boxShadow = 'none';
            };

            // Ikona folderu
            const folderIcon = document.createElement('span');
            folderIcon.style.fontSize = '16px';
            folderIcon.style.marginRight = '1px';
            folderDiv.appendChild(folderIcon);

            // Ikonka do zwijania/rozwijania
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'folder-toggle';
            toggleIcon.innerHTML = folderDiv.classList.contains('collapsed') ? '▶' : '▼';
            toggleIcon.style.fontSize = '12px';
            toggleIcon.style.marginRight = '1px';
            toggleIcon.style.cursor = 'pointer';
            toggleIcon.onclick = (e) => {
                e.stopPropagation();
                folderDiv.classList.toggle('collapsed');
                toggleIcon.innerHTML = folderDiv.classList.contains('collapsed') ? '▶' : '▼';
                folderIcon.textContent = folderDiv.classList.contains('collapsed') ? '📁' : '📂';
                if (!folderDiv.querySelector('.subtree') && !folderDiv.classList.contains('collapsed')) {
                    loadSubdirectory(item.path, folderDiv, level + 1, [...parentIsLast, isLast]);
                }
            };
            folderDiv.appendChild(toggleIcon);

            // Label na nazwę folderu
            const label = document.createElement('span');
            label.className = 'folder-label';
            label.textContent = item.name;
            label.style.fontWeight = '500';
            label.style.marginRight = '1px';
            label.style.maxWidth = '120px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.whiteSpace = 'nowrap';
            label.style.flex = '1 1 auto';
            label.style.padding = '2px 4px';
            label.style.borderRadius = '4px';
            label.style.transition = 'background 0.15s, color 0.15s';
            label.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.folder-label').forEach(el => {
                    el.style.background = 'none';
                    el.style.color = '';
                });
                label.style.background = '#0078d7';
                label.style.color = '#fff';
                if (typeof onFolderLabelClick === 'function') {
                    onFolderLabelClick(item);
                }
            };
            folderDiv.appendChild(label);

            const subtree = document.createElement('div');
            subtree.className = 'subtree';
            folderDiv.appendChild(subtree);

            let children = item.children || [];
            // Pokazuj tylko katalogi
            children = children.filter(child => child.isDirectory);
            if (children.length > 0) {
                renderTree(children, subtree, level + 1, [...parentIsLast, isLast], onFolderLabelClick);
            }
            parentElement.appendChild(folderDiv);
        }
    });
}

export async function loadSubdirectory(path, parentElement, level = 0, parentIsLast = []) {
    const subtree = parentElement.querySelector('.subtree');
    subtree.innerHTML = '<div class="loading">Ładowanie...</div>';

    try {
        const contents = await window.api.readDirectory(path);
        subtree.innerHTML = '';
        renderTree(contents, subtree, level, parentIsLast);
    } catch (error) {
        subtree.innerHTML = '<div class="error">Błąd ładowania</div>';
    }
}
