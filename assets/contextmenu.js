export function setupContextMenu() {
    document.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('file') || e.target.classList.contains('folder')) {
            e.preventDefault();
            // Usuń stare menu jeśli istnieje
            const oldMenu = document.getElementById('custom-context-menu');
            if (oldMenu) oldMenu.remove();

            const menu = document.createElement('div');
            menu.id = 'custom-context-menu';
            menu.style.position = 'fixed';
            menu.style.top = `${e.clientY}px`;
            menu.style.left = `${e.clientX}px`;
            menu.style.background = '#222';
            menu.style.color = '#fff';
            menu.style.padding = '8px 0';
            menu.style.borderRadius = '8px';
            menu.style.boxShadow = '0 2px 12px #000a';
            menu.style.zIndex = 9999;
            menu.style.minWidth = '160px';

            const path = e.target.dataset.path;
            // Akcje menu
            const actions = [];
            actions.push({ label: 'Kopiuj ścieżkę', onClick: () => {
                navigator.clipboard.writeText(path);
            }});
            if (e.target.classList.contains('folder')) {
                actions.push({ label: 'Otwórz folder', onClick: () => {
                    window.api.openFolder(path);
                }});
            }
            if (e.target.classList.contains('file')) {
                actions.push({ label: 'Usuń plik', onClick: async () => {
                    if (confirm('Czy na pewno chcesz usunąć ten plik?')) {
                        await window.api.deleteFile(path);
                        e.target.remove();
                    }
                }});
            }
            actions.forEach(action => {
                const btn = document.createElement('div');
                btn.textContent = action.label;
                btn.style.padding = '8px 18px';
                btn.style.cursor = 'pointer';
                btn.onmouseenter = () => btn.style.background = '#444';
                btn.onmouseleave = () => btn.style.background = 'none';
                btn.onclick = () => {
                    action.onClick();
                    menu.remove();
                };
                menu.appendChild(btn);
            });

            document.body.appendChild(menu);

            // Zamknij menu po kliknięciu gdziekolwiek
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }
    });
}
