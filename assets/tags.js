export let mediaTags = {};
export let allTags = [];

export function loadTags() {
    try {
        mediaTags = JSON.parse(localStorage.getItem('mediaTags') || '{}');
        allTags = JSON.parse(localStorage.getItem('allTags') || '[]');
    } catch { mediaTags = {}; allTags = []; }
}

export function saveTags() {
    localStorage.setItem('mediaTags', JSON.stringify(mediaTags));
    localStorage.setItem('allTags', JSON.stringify(allTags));
}

export function showTagManager() {
    loadTags();
    const panel = document.getElementById('tag-manager-panel');
    panel.style.display = 'flex';
    panel.style.justifyContent = 'center';
    panel.style.alignItems = 'center';
    panel.style.position = 'fixed';
    panel.style.bottom = '0';
    panel.style.left = '0';
    panel.style.width = '100%';
    panel.style.height = '100%';
    panel.style.zIndex = '99999';
    panel.style.background = 'rgba(0,0,0,0.65)';
    panel.style.backdropFilter = 'blur(2px)';
    panel.innerHTML = `
        <div style="
            background: #232a3a;
            padding: 28px 18px 18px 18px;
            border-radius: 14px;
            max-width: 340px;
            width: 94vw;
            margin: 0 auto;
            margin-top: 8vh;
            color: #fff;
            box-shadow: 0 12px 48px 0 #000a;
            position: fixed;
            font-family: 'Segoe UI', Arial, sans-serif;

        ">
            <h2 style='margin-top:0;font-size:1.3em;font-weight:500;'>Manage Tags/Categories</h2>
            <div style='margin-bottom:16px;display:flex;gap:8px;'>
                <input id='new-tag-input' type='text' placeholder='Add new tag...' style='padding:7px 12px;font-size:15px;border-radius:6px;border:1px solid #444;width:70%;background:#181818;color:#fff;'>
                <button id='add-tag-btn' style='padding:7px 16px;font-size:15px;border-radius:6px;background:#0078d7;color:#fff;border:none;'>Add</button>
            </div>
            <div id='all-tags-list' style='display:flex;flex-wrap:wrap;gap:7px;'></div>
            <button id='close-tag-manager' style='margin-top:18px;padding:7px 18px;font-size:15px;border-radius:6px;background:#444;color:#fff;border:none;float:right;'>Close</button>
        </div>`;
    renderAllTagsList();
    document.getElementById('add-tag-btn').onclick = () => {
        const val = document.getElementById('new-tag-input').value.trim();
        if(val && !allTags.includes(val)) {
            allTags.push(val);
            saveTags();
            renderAllTagsList();
            document.getElementById('new-tag-input').value = '';
        }
    };
    document.getElementById('close-tag-manager').onclick = () => { closeTagManager(); };
    document.body.classList.add('tag-popup-open');
}

function closeTagManager() {
    const panel = document.getElementById('tag-manager-panel');
    panel.style.display = 'none';
    document.body.classList.remove('tag-popup-open');
}

function renderAllTagsList() {
    const list = document.getElementById('all-tags-list');
    list.innerHTML = '';
    allTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.textContent = tag;
        tagEl.style.cssText = `
            background:#0078d7;
            padding:4px 12px;
            border-radius:12px;
            font-size:14px;
            display:inline-flex;
            align-items:center;
            gap:4px;
            font-family:'Segoe UI',Arial,sans-serif;
        `;
        const del = document.createElement('button');
        del.textContent = '✕';
        del.style.cssText = `
            margin-left:4px;
            background:none;
            border:none;
            color:#fff;
            cursor:pointer;
            font-size:14px;
            padding:0 2px;
        `;
        del.onclick = () => {
            allTags = allTags.filter(t => t!==tag);
            saveTags();
            renderAllTagsList();
        };
        tagEl.appendChild(del);
        list.appendChild(tagEl);
    });
}

export function renderMediaTags(filePath) {
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
        del.onclick = () => {
            tags = tags.filter(t => t!==tag);
            mediaTags[filePath]=tags;
            saveTags();
            renderMediaTags(filePath);
        };
        tagEl.appendChild(del);
        tagBox.appendChild(tagEl);
    });
    // Add tag select
    const addSel = document.createElement('select');
    addSel.style.cssText = 'padding:4px 10px;border-radius:8px;font-size:14px;';
    addSel.innerHTML = `<option value=''>+ Add tag</option>` + allTags.filter(t=>!tags.includes(t)).map(t=>`<option value='${t}'>${t}</option>`).join('');
    addSel.onchange = () => {
        if(addSel.value) {
            tags.push(addSel.value);
            mediaTags[filePath]=tags;
            saveTags();
            renderMediaTags(filePath);
        }
    };
    tagBox.appendChild(addSel);
    // Replace or append
    let old = mediaPlayer.querySelector('.media-tags-box');
    tagBox.className = 'media-tags-box';
    if(old) old.replaceWith(tagBox); else mediaPlayer.appendChild(tagBox);
}
