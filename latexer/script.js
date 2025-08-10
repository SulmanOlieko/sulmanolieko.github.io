document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize Split.js Layouts
    const mainSplit = Split(['#fileSidebar', '#editorArea', '#pdfPreview'], {
        sizes: [20, 45, 35],
        minSize: [150, 200, 200],
        gutterSize: 8,
        cursor: 'col-resize'
    });

    const previewSplit = Split(['#pdfContainer', '#dockerConsoleContainer'], {
        direction: 'vertical',
        sizes: [80, 20],
        minSize: [100, 50],
        gutterSize: 8,
        cursor: 'row-resize'
    });

    // 2. Initialize Ace Editors
    const sourceEditor = ace.edit("sourceEditor");
    sourceEditor.setTheme("ace/theme/solarized_dark");
    sourceEditor.session.setMode("ace/mode/latex");
    sourceEditor.setOptions({
        fontSize: 12,
        wordWrap: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showGutter: true,
        tabSize: 2
    });
    sourceEditor.setValue(`% Welcome! Create or upload a file to get started.`, -1);

    const dockerConsole = ace.edit("dockerConsole");
    dockerConsole.setTheme("ace/theme/solarized_dark");
    dockerConsole.session.setMode("ace/mode/text");
    dockerConsole.setReadOnly(true);
    dockerConsole.setOptions({
        fontSize: 12,
        wordWrap: true
    });
    dockerConsole.setValue("Console output will appear here.\n");

    // 3. Settings Panel Logic
    const settingsPanel = document.getElementById('settingsPanel');
    const openSettingsBtn = document.getElementById('openSettings');
    const closeSettingsBtn = document.getElementById('closeSettings');
    const editorThemeSelect = document.getElementById('editorThemePanel');
    const editorFontSizeSlider = document.getElementById('editorFontSizePanel');
    const showDockerSwitch = document.getElementById('showDockerConsole');
    const showPdfSwitch = document.getElementById('showPdfPreview');
    const wordWrapSwitch = document.getElementById('editorWordWrap');
    const lineNumbersSwitch = document.getElementById('editorLineNumbers');
    const printMarginSwitch = document.getElementById('showPrintMargin');
    const autocompleteSwitch = document.getElementById('enableAutocomplete');

    openSettingsBtn.addEventListener('click', () => settingsPanel.style.display = 'block');
    closeSettingsBtn.addEventListener('click', () => settingsPanel.style.display = 'none');

    function applySettings() {
        const settings = {
            theme: editorThemeSelect.value,
            fontSize: parseInt(editorFontSizeSlider.value, 10),
            showDocker: showDockerSwitch.checked,
            showPdf: showPdfSwitch.checked,
            wordWrap: wordWrapSwitch.checked,
            lineNumbers: lineNumbersSwitch.checked,
            printMargin: printMarginSwitch.checked,
            autocomplete: autocompleteSwitch.checked
        };

        sourceEditor.setTheme(settings.theme);
        dockerConsole.setTheme(settings.theme);
        sourceEditor.setFontSize(settings.fontSize);
        dockerConsole.setFontSize(settings.fontSize);

        document.getElementById('dockerConsoleContainer').style.display = settings.showDocker ? 'block' : 'none';
        document.getElementById('pdfPreview').querySelector('.pdf-header').style.display = settings.showPdf ? 'block' : 'none';
        document.getElementById('pdfContainer').style.display = settings.showPdf ? 'block' : 'none';

        sourceEditor.session.setUseWrapMode(settings.wordWrap);
        sourceEditor.renderer.setShowGutter(settings.lineNumbers);
        sourceEditor.setShowPrintMargin(settings.printMargin);
        sourceEditor.setOptions({
            enableBasicAutocompletion: settings.autocomplete,
            enableLiveAutocompletion: settings.autocomplete
        });

        previewSplit.setSizes(settings.showDocker ? [80, 20] : [100, 0]);
        localStorage.setItem('latexerSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('latexerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            editorThemeSelect.value = settings.theme || 'ace/theme/solarized_dark';
            editorFontSizeSlider.value = settings.fontSize || 12;
            showDockerSwitch.checked = typeof settings.showDocker === 'boolean' ? settings.showDocker : true;
            showPdfSwitch.checked = typeof settings.showPdf === 'boolean' ? settings.showPdf : true;
            wordWrapSwitch.checked = typeof settings.wordWrap === 'boolean' ? settings.wordWrap : true;
            lineNumbersSwitch.checked = typeof settings.lineNumbers === 'boolean' ? settings.lineNumbers : true;
            printMarginSwitch.checked = typeof settings.printMargin === 'boolean' ? settings.printMargin : true;
            autocompleteSwitch.checked = typeof settings.autocomplete === 'boolean' ? settings.autocomplete : true;
        }
        applySettings();
    }

    editorThemeSelect.addEventListener('change', applySettings);
    editorFontSizeSlider.addEventListener('input', applySettings);
    showDockerSwitch.addEventListener('change', applySettings);
    showPdfSwitch.addEventListener('change', applySettings);
    wordWrapSwitch.addEventListener('change', applySettings);
    lineNumbersSwitch.addEventListener('change', applySettings);
    printMarginSwitch.addEventListener('change', applySettings);
    autocompleteSwitch.addEventListener('change', applySettings);

    loadSettings();

    // PDF Compilation Logic
    const compileBtn = document.getElementById('compile');
    const compileSpinner = document.getElementById('compileSpinner');
    const pdfViewUI = document.getElementById('pdfViewUI');

    compileBtn.addEventListener('click', async () => {
        compileSpinner.style.display = 'inline-block';
        dockerConsole.setValue('Compilation started...\n');
        const latexCode = sourceEditor.getValue();
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const apiUrl = 'https://latexonline.cc/compile';

        try {
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `text=${encodeURIComponent(latexCode)}`
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.status === 'success' && result.log) {
                const pdfFileName = result.log.replace('.log', '.pdf');
                const pdfUrl = `https://latexonline.cc/data/${pdfFileName}`;
                dockerConsole.setValue('Compilation successful.\n' + result.log);
                pdfViewUI.innerHTML = `<iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;
            } else if (result.status === 'error' && result.log) {
                dockerConsole.setValue('Compilation failed with errors:\n' + result.log);
                pdfViewUI.innerHTML = `<p style="text-align: center; padding-top: 50px; color: red;">Compilation Failed. Check console for details.</p>`;
            } else {
                throw new Error('Invalid response from compilation API.');
            }
        } catch (error) {
            console.error('Compilation API error:', error);
            dockerConsole.setValue(`An error occurred during compilation: ${error.message}\n`);
            pdfViewUI.innerHTML = `<p style="text-align: center; padding-top: 50px; color: red;">An error occurred. See browser console for details.</p>`;
        } finally {
            compileSpinner.style.display = 'none';
        }
    });

    // All new code will be added below this line

    // --- FILE MANAGEMENT SYSTEM (NEW IMPLEMENTATION) ---

    let db;
    let currentOpenFile = null;
    const fileListSidebar = document.getElementById('fileListSidebar');
    const statusText = document.getElementById('statusText');

    function initDB() {
        const request = indexedDB.open('latexerDB_v2', 1);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore('files', { keyPath: 'path' });
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            renderFileTree();
        };

        request.onerror = (e) => {
            console.error("IndexedDB error:", e.target.errorCode);
        };
    }

    async function getAllFiles() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function renderFileTree() {
        const files = await getAllFiles();
        fileListSidebar.innerHTML = ''; // Clear existing tree

        const tree = {};
        files.forEach(file => {
            let path = file.path.split('/');
            let currentLevel = tree;
            path.forEach((part, i) => {
                if (!part) return; // Skip empty parts from trailing slashes
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
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
            // Use fa-folder-open when expanded
            nameDiv.innerHTML = `<i class="fas ${isLeaf ? 'fa-file-alt' : 'fa-folder'}"></i> ${name}`;

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'file-actions';
            actionsDiv.innerHTML = `
                <a href="#" title="Edit" class="action-edit" style="display: ${isLeaf ? 'inline-block' : 'none'}"><i class="fas fa-edit"></i></a>
                <a href="#" title="Preview" class="action-preview" style="display: ${isLeaf ? 'inline-block' : 'none'}"><i class="fas fa-eye"></i></a>
                <a href="#" title="Rename" class="action-rename"><i class="fas fa-pencil-alt"></i></a>
                <a href="#" title="Download" class="action-download" style="display: ${isLeaf ? 'inline-block' : 'none'}"><i class="fas fa-download"></i></a>
                <a href="#" title="Delete" class="action-delete"><i class="fas fa-trash"></i></a>
            `;

            itemDiv.appendChild(nameDiv);
            itemDiv.appendChild(actionsDiv);
            li.appendChild(itemDiv);

            if (!isLeaf) {
                const childrenUl = createTreeElement(node, path);
                li.appendChild(childrenUl);
            }

            ul.appendChild(li);
        }
        return ul;
    }

    // --- DB Helper Functions ---
    async function dbPut(item) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function dbGet(path) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(path);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function dbDelete(path) {
         return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(path);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // --- File Action Handlers ---
    const newFileBtn = document.getElementById('newFile');
    const newFolderBtn = document.getElementById('newFolder');
    const uploadFilesInput = document.getElementById('uploadFiles');

    // --- Modal Logic ---
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

    function hideModal() {
        modal.classList.remove('visible');
    }

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

    // --- Preview Modal Logic ---
    const previewModal = document.getElementById('previewModal');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('preview-content');
    const previewCloseBtn = document.getElementById('previewClose');
    previewCloseBtn.addEventListener('click', () => previewModal.style.display = 'none');


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

    uploadFilesInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        const textExtensions = ['tex', 'bib', 'txt', 'md', 'csv'];

        for (const file of files) {
            const reader = new FileReader();
            const extension = file.name.split('.').pop().toLowerCase();

            reader.onload = async (event) => {
                const content = event.target.result;
                const newItem = {
                    path: file.name,
                    name: file.name,
                    type: 'file',
                    isText: textExtensions.includes(extension) || file.type.startsWith('text/'),
                    mimeType: file.type,
                    content: content
                };
                await dbPut(newItem);
                renderFileTree();
            };

            if (textExtensions.includes(extension) || file.type.startsWith('text/')) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        }
    });

    // --- Sidebar Click & Drag Handlers ---
    let selectedPath = null;

    function selectItem(itemDiv) {
        // Remove previous selection
        const currentlySelected = fileListSidebar.querySelector('.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        // Add new selection
        itemDiv.classList.add('selected');
        selectedPath = itemDiv.dataset.path;
    }

    async function openFile(path) {
        const file = await dbGet(path);
        if (file && file.type === 'file') {
            sourceEditor.setValue(file.content || '', -1);
            currentOpenFile = file;
            statusText.textContent = `${file.name} loaded.`;
        }
    }

    fileListSidebar.addEventListener('dblclick', (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (!itemDiv) return;

        if (itemDiv.classList.contains('file-item')) {
            openFile(itemDiv.dataset.path);
        } else {
            const childTree = itemDiv.nextElementSibling;
            if (childTree && childTree.tagName === 'UL') {
                const icon = itemDiv.querySelector('.fas');
                const isVisible = childTree.style.display !== 'none';
                childTree.style.display = isVisible ? 'none' : 'block';
                icon.classList.toggle('fa-folder', isVisible);
                icon.classList.toggle('fa-folder-open', !isVisible);
            }
        }
    });

    fileListSidebar.addEventListener('click', async (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (!itemDiv) return;

        const actionLink = e.target.closest('.file-actions a');
        selectItem(itemDiv);

        if (!actionLink) {
            // Single click selects, handled by selectItem.
        } else { // Action logic
            e.preventDefault();
            const path = itemDiv.dataset.path;
            const name = path.endsWith('/') ? path.slice(0, -1) : path;
            const action = actionLink.title;

            if (action === 'Edit') {
                openFile(path);
            } else if (action === 'Delete') {
                showModal({
                    title: 'Confirm Delete', type: 'confirm', message: `Delete "${name}"? This cannot be undone.`,
                    callback: async () => {
                        const isFolder = path.endsWith('/');
                        const pathsToDelete = [path];
                        if (isFolder) {
                            const allFiles = await getAllFiles();
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
            } else if (action === 'Download') {
                const file = await dbGet(path);
                const blob = new Blob([file.content], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = file.name;
                link.click();
                URL.revokeObjectURL(link.href);
            } else if (action === 'Preview') {
                const file = await dbGet(path);
                previewTitle.textContent = `Preview: ${file.name}`;
                previewContent.innerHTML = ''; // Clear previous

                if (file.isText) {
                    const previewEditor = document.createElement('div');
                    previewEditor.style.height = '100%';
                    previewContent.appendChild(previewEditor);
                    const acePreview = ace.edit(previewEditor);
                    acePreview.setTheme(editorThemeSelect.value);
                    acePreview.setReadOnly(true);
                    acePreview.setValue(file.content, -1);
                } else if (file.mimeType.startsWith('image/')) {
                    previewContent.innerHTML = `<img src="${file.content}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
                } else if (file.mimeType === 'application/pdf') {
                    const canvas = document.createElement('canvas');
                    previewContent.appendChild(canvas);

                    // Use PDF.js
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

                    // Decode Data URL
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
                    previewContent.innerHTML = `<p>Cannot preview this file type.</p>`;
                }
                previewModal.style.display = 'flex';
            } else if (action === 'Rename') {
                const oldPath = path;
                const isFolder = oldPath.endsWith('/');
                const oldName = isFolder ? oldPath.slice(0, -1).split('/').pop() : oldPath.split('/').pop();

                showModal({
                    title: `Rename "${oldName}"`, type: 'input', defaultValue: oldName,
                    callback: async (newName) => {
                        const parentPath = oldPath.substring(0, oldPath.lastIndexOf(oldName));
                        const newPath = parentPath + newName + (isFolder ? '/' : '');

                        if (isFolder) {
                            const allFiles = await getAllFiles();
                            const children = allFiles.filter(f => f.path.startsWith(oldPath));
                            for (const child of children) {
                                const newChildPath = child.path.replace(oldPath, newPath);
                                await dbDelete(child.path);
                                child.path = newChildPath;
                                if (child.path === newPath) child.name = newName;
                                await dbPut(child);
                            }
                        } else {
                            const file = await dbGet(oldPath);
                            await dbDelete(oldPath);
                            file.path = newPath;
                            file.name = newName;
                            await dbPut(file);
                        }
                        statusText.textContent = `Renamed to "${newName}".`;
                        renderFileTree();
                    }
                });
            }
        }
    });


    // --- Drag & Drop Logic ---
    let draggedPath = null;
    fileListSidebar.addEventListener('dragstart', (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (itemDiv) {
            draggedPath = itemDiv.dataset.path;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedPath);
        }
    });
    fileListSidebar.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
    });
    fileListSidebar.addEventListener('drop', async (e) => {
        e.preventDefault();
        const destFolderDiv = e.target.closest('.folder-item');
        // If dropped on the sidebar but not in a folder, treat root as destination
        const destPath = destFolderDiv ? destFolderDiv.dataset.path : '';

        if (draggedPath === null) return;
        const oldPath = draggedPath;
        const itemName = oldPath.endsWith('/') ? oldPath.slice(0, -1).split('/').pop() : oldPath.split('/').pop();
        const newPath = destPath + itemName + (oldPath.endsWith('/') ? '/' : '');

        if (newPath.startsWith(oldPath)) {
            return alert("Cannot move a folder into itself.");
        }

        // Use the same logic as rename
        const isFolder = oldPath.endsWith('/');
        if (isFolder) {
            const allFiles = await getAllFiles();
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


    // --- Auto-saving logic ---
    let saveTimeout;
    sourceEditor.session.on('change', () => {
        clearTimeout(saveTimeout);
        if (currentOpenFile) {
            saveTimeout = setTimeout(async () => {
                currentOpenFile.content = sourceEditor.getValue();
                await dbPut(currentOpenFile);
                statusText.textContent = `Auto-saved ${currentOpenFile.name}`;
            }, 1000);
        }
    });


    initDB();

    // --- RE-INTEGRATE OTHER FEATURES ---

    // Visual/Code Editor Toggling
    const viewModeSwitch = document.getElementById('viewMode');
    const codeEditorContainer = document.getElementById('codeEditorContainer');
    const visualEditorContainer = document.getElementById('visualEditorContainer');
    const visualEditor = document.getElementById('visualEditor');
    let isSyncing = false;

    viewModeSwitch.addEventListener('change', () => {
        if (viewModeSwitch.checked) { // Switched to Visual Mode
            isSyncing = true;
            visualEditor.innerText = sourceEditor.getValue();
            isSyncing = false;
            codeEditorContainer.style.display = 'none';
            visualEditorContainer.style.display = 'block';
        } else { // Switched to Code Mode
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

    // Basic Syntax Linter
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
            const code = sourceEditor.getValue();
            sourceEditor.session.setAnnotations(detectErrors(code));
        }, 500);
    });

    // Ctrl+S/Cmd+S Save Notification
    const saveNotification = document.getElementById('saveNotification');
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNotification.style.display = 'block';
            setTimeout(() => { saveNotification.style.display = 'none'; }, 3000);
        }
    });

});
