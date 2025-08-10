document.addEventListener('DOMContentLoaded', function () {
    // --- CORE COMPONENT INITIALIZATION ---
    const mainSplit = Split(['#fileSidebar', '#editorArea', '#pdfPreview'], {
        sizes: [20, 45, 35], minSize: [150, 200, 200], gutterSize: 8, cursor: 'col-resize'
    });
    const previewSplit = Split(['#pdfContainer', '#dockerConsoleContainer'], {
        direction: 'vertical', sizes: [80, 20], minSize: [100, 50], gutterSize: 8, cursor: 'row-resize'
    });
    const sourceEditor = ace.edit("sourceEditor", {
        theme: "ace/theme/solarized_dark",
        mode: "ace/mode/latex",
        fontSize: 12,
        wordWrap: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showGutter: true,
        tabSize: 2,
        value: `% Welcome! Create or upload a file to get started.`
    });
    const dockerConsole = ace.edit("dockerConsole", {
        theme: "ace/theme/solarized_dark",
        mode: "ace/mode/text",
        readOnly: true,
        fontSize: 12,
        wordWrap: true,
        value: "Console output will appear here.\n"
    });

    // --- DOM ELEMENT REFERENCES ---
    const fileListSidebar = document.getElementById('fileListSidebar');
    const statusText = document.getElementById('statusText');
    const newFileBtn = document.getElementById('newFile');
    const newFolderBtn = document.getElementById('newFolder');
    const uploadFilesInput = document.getElementById('uploadFiles');
    const downloadAllBtn = document.getElementById('bulkDownloadUploaded');

    // --- GLOBAL STATE ---
    let db;
    let currentOpenFile = null;
    let selectedPath = null;

    // The rest of the new, clean implementation will be added here.

    // --- DATABASE LOGIC ---
    function initDB() {
        const request = indexedDB.open('latexerDB_final', 1);
        request.onupgradeneeded = e => e.target.result.createObjectStore('files', { keyPath: 'path' });
        request.onsuccess = e => { db = e.target.result; renderFileTree(); };
        request.onerror = e => console.error("IndexedDB error:", e.target.errorCode);
    }
    async function dbGetAll() {
        return new Promise((resolve, reject) => {
            const req = db.transaction(['files'],'readonly').objectStore('files').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = e => reject(e.error);
        });
    }
    async function dbGet(path) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(['files'],'readonly').objectStore('files').get(path);
            req.onsuccess = () => resolve(req.result);
            req.onerror = e => reject(e.error);
        });
    }
    async function dbPut(item) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(['files'],'readwrite').objectStore('files').put(item);
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e.error);
        });
    }
    async function dbDelete(path) {
        return new Promise((resolve, reject) => {
            const req = db.transaction(['files'],'readwrite').objectStore('files').delete(path);
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e.error);
        });
    }

    // --- FILE TREE RENDERING ---
    async function renderFileTree() {
        const files = await dbGetAll();
        fileListSidebar.innerHTML = '';
        const tree = {};
        files.forEach(file => {
            let path = file.path.split('/');
            let currentLevel = tree;
            path.forEach((part, i) => {
                if (!part) return;
                if (!currentLevel[part]) currentLevel[part] = {};
                if (i < path.length - 1) {
                    currentLevel = currentLevel[part];
                } else {
                    currentLevel[part] = { ...file, _isLeaf: true };
                }
            });
        });
        const treeElement = createTreeElement(tree, '');
        fileListSidebar.appendChild(treeElement);
    }
    function createTreeElement(treeNode, currentPath) {
        const ul = document.createElement('ul');
        ul.className = 'file-tree';
        if (currentPath !== '') ul.classList.add('child-tree');

        for (const name in treeNode) {
            const node = treeNode[name];
            const isLeaf = node._isLeaf;
            const path = currentPath ? `${currentPath}/${name}` : name;

            const li = document.createElement('li');
            const itemDiv = document.createElement('div');
            itemDiv.dataset.path = isLeaf ? node.path : path + '/';
            itemDiv.className = isLeaf ? 'file-item' : 'folder-item';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'file-name';
            nameDiv.innerHTML = `<i class="fas ${isLeaf ? 'fa-file-alt' : 'fa-folder'}"></i><span>${name}</span>`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'file-actions';
            actionsDiv.innerHTML = `
                <a href="#" title="Edit" style="display: ${isLeaf ? 'inline-block' : 'none'}"><i class="fas fa-edit"></i></a>
                <a href="#" title="Preview" style="display: ${isLeaf ? 'inline-block' : 'none'}"><i class="fas fa-eye"></i></a>
                <a href="#" title="Rename"><i class="fas fa-pencil-alt"></i></a>
                <a href="#" title="Download" style="display: ${isLeaf ? 'inline-block' : 'none'}"><i class="fas fa-download"></i></a>
                <a href="#" title="Delete"><i class="fas fa-trash"></i></a>
            `;

            itemDiv.appendChild(nameDiv);
            itemDiv.appendChild(actionsDiv);
            li.appendChild(itemDiv);

            if (!isLeaf) {
                const childrenUl = createTreeElement(node, path);
                childrenUl.style.display = 'none'; // Folders start collapsed
                li.appendChild(childrenUl);
            }
            ul.appendChild(li);
        }
        return ul;
    }

    initDB();

    // --- MODAL AND PREVIEW LOGIC (from previous implementation, confirmed working) ---
    const modal = document.getElementById('inputModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalInputContainer = document.getElementById('modalInputContainer');
    const modalInput = document.getElementById('modalInput');
    const modalError = document.getElementById('modalError');
    const modalOkBtn = document.getElementById('modalOk');
    const modalCancelBtn = document.getElementById('modalCancel');
    let modalOkCallback = null;

    function showModal(config) {
        modalTitle.textContent = config.title;
        modalInput.value = config.defaultValue || '';
        modalError.style.display = 'none';
        if (config.type === 'confirm') {
            modalInputContainer.style.display = 'none';
            modalMessage.textContent = config.message;
            modalMessage.style.display = 'block';
        } else {
            modalInputContainer.style.display = 'block';
            modalMessage.style.display = 'none';
            modalInput.focus();
        }
        modal.classList.add('visible');
        modalOkCallback = config.callback;
    }
    function hideModal() { modal.classList.remove('visible'); }
    modalOkBtn.addEventListener('click', () => {
        if (modalInputContainer.style.display === 'none' || modalInput.value) {
            hideModal();
            if (modalOkCallback) modalOkCallback(modalInputContainer.style.display !== 'none' ? modalInput.value : undefined);
        } else {
            modalError.textContent = 'Name cannot be empty.';
            modalError.style.display = 'block';
        }
    });
    modalCancelBtn.addEventListener('click', hideModal);

    // --- FILE INTERACTION LOGIC ---
    async function openFile(path) {
        const file = await dbGet(path);
        if (file && file.type === 'file') {
            sourceEditor.setValue(file.content || '', -1);
            currentOpenFile = file;
            statusText.textContent = `${file.name} loaded.`;
        }
    }

    newFileBtn.addEventListener('click', () => {
        showModal({ title: 'Create New File', type: 'input', callback: async (name) => {
            if (!name.endsWith('.tex')) name += '.tex';
            await dbPut({ path: name, name: name, type: 'file', content: '' });
            statusText.textContent = `File "${name}" created.`;
            renderFileTree();
        }});
    });
    newFolderBtn.addEventListener('click', () => {
        showModal({ title: 'Create New Folder', type: 'input', callback: async (name) => {
            await dbPut({ path: name + '/', name: name, type: 'folder' });
            statusText.textContent = `Folder "${name}" created.`;
            renderFileTree();
        }});
    });

    uploadFilesInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        const textExtensions = ['tex', 'bib', 'txt', 'md', 'csv', 'log'];
        for (const file of files) {
            const reader = new FileReader();
            const extension = file.name.split('.').pop().toLowerCase();
            const isText = textExtensions.includes(extension) || file.type.startsWith('text/');

            reader.onload = async (event) => {
                await dbPut({
                    path: file.name, name: file.name, type: 'file',
                    isText: isText, mimeType: file.type, content: event.target.result
                });
                statusText.textContent = `Uploaded "${file.name}".`;
                renderFileTree();
            };
            if (isText) reader.readAsText(file);
            else reader.readAsDataURL(file);
        }
    });

    // Main event handler for the sidebar
    fileListSidebar.addEventListener('click', (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (!itemDiv) return;

        // Always select the item on any click within it
        const allItems = fileListSidebar.querySelectorAll('.file-item, .folder-item');
        allItems.forEach(item => item.classList.remove('selected'));
        itemDiv.classList.add('selected');
        selectedPath = itemDiv.dataset.path;

        const actionLink = e.target.closest('.file-actions a');
        if (actionLink) {
            e.preventDefault();
            handleAction(actionLink.title, selectedPath);
        }
    });

    fileListSidebar.addEventListener('dblclick', (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (!itemDiv) return;
        if (itemDiv.classList.contains('file-item')) {
            openFile(itemDiv.dataset.path);
        } else { // Toggle folder
            const childTree = itemDiv.nextElementSibling;
            if (childTree && childTree.tagName === 'UL') {
                childTree.style.display = childTree.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

    async function handleAction(action, path) {
        const name = path.endsWith('/') ? path.slice(0, -1).split('/').pop() : path.split('/').pop();

        if (action === 'Edit') {
            openFile(path);
        } else if (action === 'Delete') {
            showModal({
                title: 'Confirm Delete', type: 'confirm', message: `Delete "${name}"? This cannot be undone.`,
                callback: async () => {
                    const isFolder = path.endsWith('/');
                    const pathsToDelete = [path];
                    if (isFolder) {
                        const allFiles = await dbGetAll();
                        allFiles.forEach(f => {
                            if (f.path.startsWith(path) && f.path !== path) pathsToDelete.push(f.path);
                        });
                    }
                    for (const p of pathsToDelete) await dbDelete(p);
                    if (currentOpenFile && pathsToDelete.includes(currentOpenFile.path)) {
                        sourceEditor.setValue('');
                        currentOpenFile = null;
                    }
                        statusText.textContent = `Deleted "${name}".`;
                    renderFileTree();
                }
            });
        } else if (action === 'Rename') {
            showModal({
                title: `Rename "${name}"`, type: 'input', defaultValue: name,
                callback: async (newName) => {
                    const isFolder = path.endsWith('/');
                    const parentPath = path.substring(0, path.lastIndexOf(name));
                    const newPath = parentPath + newName + (isFolder ? '/' : '');
                    if (isFolder) {
                        const allFiles = await dbGetAll();
                        const children = allFiles.filter(f => f.path.startsWith(path));
                        for (const child of children) {
                            const newChildPath = child.path.replace(path, newPath);
                            await dbDelete(child.path);
                            child.path = newChildPath;
                            if (child.path === newPath) child.name = newName;
                            await dbPut(child);
                        }
                    } else {
                        const file = await dbGet(path);
                        await dbDelete(path);
                        file.path = newPath;
                        file.name = newName;
                        await dbPut(file);
                    }
                        statusText.textContent = `Renamed "${name}" to "${newName}".`;
                    renderFileTree();
                }
            });
        }
        // ... preview and download actions
        else if (action === 'Preview') {
            const file = await dbGet(path);
            previewTitle.textContent = `Preview: ${file.name}`;
            previewContent.innerHTML = '';

            if (file.isText) {
                const pre = document.createElement('pre');
                pre.textContent = file.content;
                previewContent.appendChild(pre);
            } else if (file.mimeType.startsWith('image/')) {
                previewContent.innerHTML = `<img src="${file.content}" style="max-width: 100%;">`;
            } else if (file.mimeType === 'application/pdf') {
                const canvas = document.createElement('canvas');
                previewContent.appendChild(canvas);
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;
                const pdfData = atob(file.content.substring(file.content.indexOf(',') + 1));
                const loadingTask = pdfjsLib.getDocument({data: pdfData});
                loadingTask.promise.then(pdf => {
                    pdf.getPage(1).then(page => {
                        const viewport = page.getViewport({scale: 1.5});
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
                    });
                });
            } else {
                previewContent.textContent = 'Preview is not available for this file type.';
            }
            previewModal.classList.add('visible');
        } else if (action === 'Download') {
            const file = await dbGet(path);
            const link = document.createElement('a');
            if (file.isText) {
                const blob = new Blob([file.content], { type: 'text/plain' });
                link.href = URL.createObjectURL(blob);
            } else {
                link.href = file.content; // It's a Data URL
            }
            link.download = file.name;
            link.click();
            if (file.isText) URL.revokeObjectURL(link.href);
        }
    }

    // Drag and Drop
    let draggedPath = null;
    fileListSidebar.addEventListener('dragstart', (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (itemDiv) {
            draggedPath = itemDiv.dataset.path;
            e.dataTransfer.effectAllowed = 'move';
        }
    });
    fileListSidebar.addEventListener('dragover', (e) => e.preventDefault());
    fileListSidebar.addEventListener('drop', async (e) => {
        e.preventDefault();
        const destFolderDiv = e.target.closest('.folder-item');
        const destPath = destFolderDiv ? destFolderDiv.dataset.path : '';
        if (draggedPath === null || new RegExp(`^${draggedPath}`).test(destPath)) return;

        const oldPath = draggedPath;
        const itemName = oldPath.endsWith('/') ? oldPath.slice(0, -1).split('/').pop() : oldPath.split('/').pop();
        const newPath = destPath + itemName + (oldPath.endsWith('/') ? '/' : '');

        const isFolder = oldPath.endsWith('/');
        if (isFolder) {
            const allFiles = await dbGetAll();
            const children = allFiles.filter(f => f.path.startsWith(oldPath));
            for (const child of children) {
                const newChildPath = child.path.replace(oldPath, newPath);
                await dbDelete(child.path);
                child.path = newChildPath;
                await dbPut(child);
            }
        } else {
            const file = await dbGet(oldPath);
            await dbDelete(oldPath);
            file.path = newPath;
            await dbPut(file);
        }
        statusText.textContent = `Moved "${itemName}" to "${destPath || 'root'}".`;
        renderFileTree();
        draggedPath = null;
    });

    // --- Final UX Enhancements ---
    const saveNotification = document.getElementById('saveNotification');
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNotification.style.display = 'block';
            setTimeout(() => { saveNotification.style.display = 'none'; }, 2000);
        }
    });

    // --- AUTO-SAVING ---
    let saveTimeout;
    sourceEditor.session.on('change', () => {
        clearTimeout(saveTimeout);
        if (currentOpenFile) {
            statusText.textContent = `Editing...`;
            saveTimeout = setTimeout(async () => {
                currentOpenFile.content = sourceEditor.getValue();
                await dbPut(currentOpenFile);
                statusText.textContent = `Auto-saved ${currentOpenFile.name}`;
            }, 1000);
        }
    });

    // --- LINTER & VISUAL EDITOR ---
    const viewModeSwitch = document.getElementById('viewMode');
    const codeEditorContainer = document.getElementById('codeEditorContainer');
    const visualEditorContainer = document.getElementById('visualEditorContainer');
    const visualEditor = document.getElementById('visualEditor');
    let isSyncing = false;

    viewModeSwitch.addEventListener('change', () => {
        if (viewModeSwitch.checked) {
            isSyncing = true;
            visualEditor.innerText = sourceEditor.getValue();
            isSyncing = false;
            codeEditorContainer.style.display = 'none';
            visualEditorContainer.style.display = 'block';
        } else {
            isSyncing = true;
            sourceEditor.setValue(visualEditor.innerText, -1);
            isSyncing = false;
            visualEditorContainer.style.display = 'none';
            codeEditorContainer.style.display = 'block';
        }
    });
    sourceEditor.session.on('change', () => {
        if (!isSyncing && viewModeSwitch.checked) {
            isSyncing = true;
            visualEditor.innerText = sourceEditor.getValue();
            isSyncing = false;
        }
    });
    visualEditor.addEventListener('input', () => {
        if (!isSyncing) {
            isSyncing = true;
            sourceEditor.setValue(visualEditor.innerText, -1);
            isSyncing = false;
        }
    });

    function detectErrors(code) {
        const lines = code.split('\n');
        const annotations = [];
        const envStack = [];
        lines.forEach((line, i) => {
            if ((line.match(/(?<!\\)\$/g) || []).length % 2 !== 0) annotations.push({ row: i, column: 0, text: "Odd number of unescaped '$'.", type: "error" });
            if ((line.match(/{/g) || []).length !== (line.match(/}/g) || []).length) annotations.push({ row: i, column: 0, text: "Unbalanced curly braces {}.", type: "error" });
            const begins = line.match(/\\begin\{[^\}]+\}/g) || [];
            begins.forEach(b => envStack.push({ env: b.match(/\\begin\{([^\}]+)\}/)[1], line: i }));
            const ends = line.match(/\\end\{[^\}]+\}/g) || [];
            ends.forEach(e => {
                const env = e.match(/\\end\{([^\}]+)\}/)[1];
                if (envStack.length > 0 && envStack[envStack.length - 1].env === env) envStack.pop();
                else annotations.push({ row: i, column: 0, text: `Unmatched \\end{${env}}`, type: "error" });
            });
        });
        envStack.forEach(item => annotations.push({ row: item.line, column: 0, text: `Unclosed \\begin{${item.env}}`, type: "error" }));
        return annotations;
    }
    let lintTimeout;
    sourceEditor.session.on('change', () => {
        clearTimeout(lintTimeout);
        lintTimeout = setTimeout(() => {
            sourceEditor.session.setAnnotations(detectErrors(sourceEditor.getValue()));
        }, 500);
    });

    // --- SETTINGS PANEL ---
    const settingsPanel = document.getElementById('settingsPanel');
    const openSettingsBtn = document.getElementById('openSettings');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const editorThemeSelect = document.getElementById('editorThemePanel');
    const editorFontSizeSlider = document.getElementById('editorFontSizePanel');
    // ... add other settings controls
    openSettingsBtn.addEventListener('click', () => settingsPanel.style.display = 'block');
    closeSettingsBtn.addEventListener('click', () => settingsPanel.style.display = 'none');
    function applySettings() {
        const theme = editorThemeSelect.value;
        const fontSize = parseInt(editorFontSizeSlider.value, 10);
        sourceEditor.setTheme(theme);
        dockerConsole.setTheme(theme);
        sourceEditor.setFontSize(fontSize);
        dockerConsole.setFontSize(fontSize);
        // ... apply other settings
    }
    editorThemeSelect.addEventListener('change', applySettings);
    editorFontSizeSlider.addEventListener('input', applySettings);
    // ... add other listeners
});
