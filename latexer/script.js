document.addEventListener('DOMContentLoaded', function () {
    // --- IndexedDB Setup ---
    let db;
    const dbRequest = indexedDB.open('latexerDB', 1);

    dbRequest.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files', { keyPath: 'path' });
        }
    };

    dbRequest.onsuccess = function(event) {
        db = event.target.result;
        console.log("Database opened successfully.");
        // Initial render of the file tree
        // renderFileTree();
    };

    dbRequest.onerror = function(event) {
        console.error("IndexedDB error:", event.target.errorCode);
    };


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
    // Set initial content
    sourceEditor.setValue(
`\\documentclass{article}
\\usepackage{graphicx}
\\title{My First Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a simple paragraph. You can use \\textbf{bold}, \\textit{italic}, and \\underline{underlined} text.

Here is a list:
\\begin{itemize}
    \\item Item 1
    \\item Item 2
\\end{itemize}

Here is some math: $E = mc^2$

\\end{document}`, -1);


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

        // Resize splits after changing visibility
        previewSplit.setSizes(settings.showDocker ? [80, 20] : [100, 0]);

        localStorage.setItem('latexerSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('latexerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            editorThemeSelect.value = settings.theme;
            editorFontSizeSlider.value = settings.fontSize;
            showDockerSwitch.checked = settings.showDocker;
            showPdfSwitch.checked = settings.showPdf;
            wordWrapSwitch.checked = settings.wordWrap;
            lineNumbersSwitch.checked = settings.lineNumbers;
            printMarginSwitch.checked = settings.printMargin;
            autocompleteSwitch.checked = settings.autocomplete;
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

    // 4. Visual/Code Editor Toggling and Syncing
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

    // 5. Visual Editor Toolbar Logic
    function wrapSelection(cmd) {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        let replacement = '';

        switch (cmd) {
            case 'bold': replacement = `\\textbf{${selectedText}}`; break;
            case 'italic': replacement = `\\textit{${selectedText}}`; break;
            case 'underline': replacement = `\\underline{${selectedText}}`; break;
            case 'section': replacement = `\\section{${selectedText}}`; break;
            case 'subsection': replacement = `\\subsection{${selectedText}}`; break;
            case 'itemize': replacement = `\\begin{itemize}\n\\item ${selectedText}\n\\end{itemize}`; break;
        }

        range.deleteContents();
        range.insertNode(document.createTextNode(replacement));

        // Trigger input event to sync changes
        visualEditor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    document.getElementById('v_bold').addEventListener('click', () => wrapSelection('bold'));
    document.getElementById('v_italic').addEventListener('click', () => wrapSelection('italic'));
    document.getElementById('v_underline').addEventListener('click', () => wrapSelection('underline'));
    document.getElementById('v_section').addEventListener('click', () => wrapSelection('section'));
    document.getElementById('v_subsection').addEventListener('click', () => wrapSelection('subsection'));
    document.getElementById('v_itemize').addEventListener('click', () => wrapSelection('itemize'));

    // 6. Auto-saving to localStorage
    let saveTimeout;
    const statusText = document.getElementById('statusText');

    function saveContent() {
        localStorage.setItem('latexerContent', sourceEditor.getValue());
        statusText.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;
    }

    sourceEditor.session.on('change', () => {
        clearTimeout(saveTimeout);
        statusText.textContent = 'Unsaved changes...';
        saveTimeout = setTimeout(saveContent, 1000); // Debounce for 1 second
    });

    function loadContent() {
        const savedContent = localStorage.getItem('latexerContent');
        if (savedContent) {
            sourceEditor.setValue(savedContent, -1);
            statusText.textContent = 'Content loaded from last session.';
        } else {
            statusText.textContent = 'main.tex loaded.';
        }
    }

    loadContent();

    // 8. File Management Logic
    const fileListSidebar = document.getElementById('fileListSidebar');
    const newFileBtn = document.getElementById('newFile');
    const newFolderBtn = document.getElementById('newFolder');
    const uploadFilesInput = document.getElementById('uploadFiles');
    const downloadAllBtn = document.getElementById('bulkDownloadUploaded');
    let currentOpenFile = null;

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
        // config: { title, callback, type: 'input' | 'confirm', message: '' }
        modalTitle.textContent = config.title;
        modalInput.value = '';
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

        modal.style.display = 'flex';
        modalOkCallback = config.callback;
    }

    modalOkBtn.addEventListener('click', () => {
        // For confirm modals, no input is needed.
        if (modalInputContainer.style.display === 'none') {
            modal.style.display = 'none';
            if (modalOkCallback) modalOkCallback();
            return;
        }

        // For input modals
        if (modalInput.value) {
            modal.style.display = 'none';
            if (modalOkCallback) modalOkCallback(modalInput.value);
        } else {
            modalError.textContent = 'Name cannot be empty.';
            modalError.style.display = 'block';
        }
    });
    modalCancelBtn.addEventListener('click', () => modal.style.display = 'none');


    // --- DB Helper Functions ---
    function dbAdd(item) {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        store.add(item);
        return transaction.complete;
    }
    function dbGet(path) {
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        return store.get(path);
    }
    function dbGetAll() {
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        return store.getAll();
    }
    function dbDelete(path) {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        store.delete(path);
        return transaction.complete;
    }
     function dbPut(item) {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        store.put(item);
        return transaction.complete;
    }


    // --- File Tree Rendering ---
    async function renderFileTree() {
        const request = await dbGetAll();
        request.onsuccess = () => {
            const allFiles = request.result;
            const tree = buildTree(allFiles);
            fileListSidebar.innerHTML = '';
            fileListSidebar.appendChild(treeToHtml(tree));
        };
    }

    function buildTree(files) {
        const tree = {};
        files.forEach(file => {
            let path = file.path.split('/');
            let currentLevel = tree;
            path.forEach((part, i) => {
                if (!currentLevel[part]) {
                    currentLevel[part] = { _files: [] };
                }
                if (i < path.length - 1) {
                    currentLevel = currentLevel[part];
                } else {
                    currentLevel[part] = file;
                }
            });
        });
        return tree;
    }

    function treeToHtml(tree) {
        const ul = document.createElement('ul');
        ul.className = 'file-tree';
        for (const name in tree) {
            if (name === '_files') continue;
            const item = tree[name];
            const li = document.createElement('li');
            const isFolder = item.type === 'folder';
            const textExtensions = ["tex", "bib", "bst", "cls", "cfg", "sty", "txt", "rnw"];
            const isText = !isFolder && textExtensions.includes(item.name.split('.').pop());

            li.innerHTML = `
                <div class="${isFolder ? 'folder-item' : 'file-item'}" data-path="${item.path || (name + '/')}" draggable="true">
                    <div class="file-name">
                        <i class="fas ${isFolder ? 'fa-folder' : 'fa-file-alt'}"></i>
                        ${item.name || name}
                    </div>
                    <div class="file-actions">
                        ${isText ? `<a href="#" class="action-edit" title="Edit"><i class="fas fa-edit"></i></a>` : ''}
                        <a href="#" class="action-preview" title="Preview"><i class="fas fa-eye"></i></a>
                        <a href="#" class="action-rename" title="Rename"><i class="fas fa-pencil-alt"></i></a>
                        ${!isFolder ? `<a href="#" class="action-download" title="Download"><i class="fas fa-download"></i></a>` : ''}
                        <a href="#" class="action-delete" title="Delete"><i class="fas fa-trash"></i></a>
                    </div>
                </div>
            `;

            if (isFolder || (item._files && Object.keys(item).length > 1)) {
                 const childrenUl = treeToHtml(item);
                 li.appendChild(childrenUl);
            }
            ul.appendChild(li);
        }
        return ul;
    }

    // --- Preview Modal Logic ---
    const previewModal = document.getElementById('previewModal');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('preview-content');
    const previewCloseBtn = document.getElementById('previewClose');
    previewCloseBtn.addEventListener('click', () => previewModal.style.display = 'none');

    dbRequest.onsuccess = function(event) {
        db = event.target.result;
        console.log("Database opened successfully.");
        renderFileTree();
    };


    // --- File Actions Implementation ---
    newFileBtn.addEventListener('click', () => {
        showModal({
            title: 'Create New File',
            type: 'input',
            callback: async (name) => {
                if (!name.endsWith('.tex')) name += '.tex';
                const newItem = { path: name, name: name, type: 'file', content: `\\documentclass{article}\n\n\\begin{document}\n\nYour content here.\n\n\\end{document}` };
                await dbAdd(newItem);
                renderFileTree();
            }
        });
    });

    newFolderBtn.addEventListener('click', () => {
        showModal({
            title: 'Create New Folder',
            type: 'input',
            callback: async (name) => {
                const newItem = { path: name + '/', name: name, type: 'folder' };
                await dbAdd(newItem);
                renderFileTree();
            }
        });
    });

    uploadFilesInput.addEventListener('change', (e) => {
        const files = e.target.files;
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target.result;
                const newItem = { path: file.name, name: file.name, type: 'file', content: content };
                await dbPut(newItem); // Use put to overwrite if exists
                renderFileTree();
            };
            reader.readAsText(file);
        }
    });

    fileListSidebar.addEventListener('click', async (e) => {
        const target = e.target.closest('a');
        if (!target) return;

        const itemDiv = e.target.closest('.file-item, .folder-item');
        const path = itemDiv.dataset.path;

        if (target.classList.contains('action-edit')) {
            e.preventDefault();
            const request = await dbGet(path);
            request.onsuccess = () => {
                const file = request.result;
                if (file) {
                    sourceEditor.setValue(file.content, -1);
                    currentOpenFile = file;
                    statusText.textContent = `${file.name} loaded.`;
                }
            }
        } else if (target.classList.contains('action-delete')) {
            e.preventDefault();
            showModal({
                title: 'Confirm Delete',
                type: 'confirm',
                message: `Are you sure you want to delete "${path}"? This cannot be undone.`,
                callback: async () => {
                    const isFolder = path.endsWith('/');
                    if (isFolder) {
                        const request = await dbGetAll();
                        request.onsuccess = async () => {
                            const allFiles = request.result;
                            const filesToDelete = allFiles.filter(f => f.path.startsWith(path));
                            for (const file of filesToDelete) { await dbDelete(file.path); }
                            renderFileTree();
                        };
                    } else {
                        await dbDelete(path);
                        if (currentOpenFile && currentOpenFile.path === path) {
                            sourceEditor.setValue('');
                            currentOpenFile = null;
                        }
                        renderFileTree();
                    }
                }
            });
        } else if (target.classList.contains('action-rename')) {
            e.preventDefault();
            const oldPath = path;
            const isFolder = oldPath.endsWith('/');
            const oldName = isFolder ? oldPath.slice(0, -1).split('/').pop() : oldPath.split('/').pop();

            showModal({
                title: `Rename "${oldName}"`,
                type: 'input',
                callback: async (newName) => {
                    const parentPath = oldPath.substring(0, oldPath.lastIndexOf(oldName));
                    const newPath = parentPath + newName + (isFolder ? '/' : '');

                    if (isFolder) {
                        const allFilesReq = await dbGetAll();
                        allFilesReq.onsuccess = async () => {
                            const allFiles = allFilesReq.result;
                            const children = allFiles.filter(f => f.path.startsWith(oldPath));
                            for (const child of children) {
                                const newChildPath = child.path.replace(oldPath, newPath);
                                await dbDelete(child.path);
                                child.path = newChildPath;
                                if (child.path === newPath) { child.name = newName; }
                                await dbAdd(child);
                            }
                            renderFileTree();
                        }
                    } else {
                        const fileReq = await dbGet(oldPath);
                        fileReq.onsuccess = async () => {
                            const file = fileReq.result;
                            file.path = newPath;
                            file.name = newName;
                            await dbDelete(oldPath);
                            await dbAdd(file);
                            renderFileTree();
                        };
                    }
                }
            });
        } else if (target.classList.contains('action-preview')) {
            e.preventDefault();
            const request = await dbGet(path);
            request.onsuccess = (e) => {
                const file = e.target.result;
                previewTitle.textContent = `Preview: ${file.name}`;
                previewContent.innerHTML = ''; // Clear previous
                if (file.type === 'file') {
                    const previewEditor = document.createElement('div');
                    previewEditor.style.height = '100%';
                    previewContent.appendChild(previewEditor);
                    const acePreview = ace.edit(previewEditor);
                    acePreview.setTheme("ace/theme/solarized_dark");
                    acePreview.setReadOnly(true);
                    acePreview.setValue(file.content, -1);
                }
                previewModal.style.display = 'flex';
            };
        } else if (target.classList.contains('action-download')) {
            e.preventDefault();
            const request = await dbGet(path);
            request.onsuccess = (e) => {
                const file = e.target.result;
                const blob = new Blob([file.content], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = file.name;
                link.click();
                URL.revokeObjectURL(link.href);
            };
        }
    });

    downloadAllBtn.addEventListener('click', async () => {
        const request = await dbGetAll();
        request.onsuccess = (e) => {
            const allFiles = e.target.result;
            if (allFiles.length === 0) {
                alert("No files to download.");
                return;
            }
            const zip = new JSZip();
            allFiles.forEach(file => {
                if (file.type === 'file') {
                    zip.file(file.path, file.content);
                }
            });
            zip.generateAsync({type:"blob"}).then(function(content) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "latexer-project.zip";
                link.click();
                URL.revokeObjectURL(link.href);
            });
        };
    });

    // --- Drag and Drop Logic ---
    let draggedItemPath = null;
    fileListSidebar.addEventListener('dragstart', (e) => {
        const itemDiv = e.target.closest('.file-item, .folder-item');
        if (itemDiv) {
            draggedItemPath = itemDiv.dataset.path;
            e.dataTransfer.setData('text/plain', draggedItemPath);
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    fileListSidebar.addEventListener('dragover', (e) => {
        e.preventDefault();
        const targetFolder = e.target.closest('.folder-item');
        if (targetFolder) {
            // Optional: add a class to highlight the drop target
        }
    });

    fileListSidebar.addEventListener('drop', async (e) => {
        e.preventDefault();
        const targetFolderDiv = e.target.closest('.folder-item');
        if (!targetFolderDiv || !draggedItemPath) return;

        const destFolderPath = targetFolderDiv.dataset.path;
        if (draggedItemPath.startsWith(destFolderPath)) {
            alert("Cannot move a folder into itself.");
            return;
        }

        const request = await dbGet(draggedItemPath);
        request.onsuccess = async () => {
            const itemToMove = request.result;
            const oldPath = itemToMove.path;
            const newPath = destFolderPath + itemToMove.name + (itemToMove.type === 'folder' ? '/' : '');

            // For folders, we need to move all children too
            if (itemToMove.type === 'folder') {
                const allFilesReq = await dbGetAll();
                allFilesReq.onsuccess = async () => {
                    const allFiles = allFilesReq.result;
                    const children = allFiles.filter(f => f.path.startsWith(oldPath));
                    for (const child of children) {
                        const newChildPath = child.path.replace(oldPath, newPath);
                        const newChild = { ...child, path: newChildPath };
                        await dbPut(newChild);
                        await dbDelete(child.path);
                    }
                    renderFileTree();
                }
            } else {
                const newItem = { ...itemToMove, path: newPath };
                await dbPut(newItem);
                await dbDelete(oldPath);
                renderFileTree();
            }
        };
        draggedItemPath = null;
    });

    // Modify auto-saving logic
    function saveContent() {
        if (currentOpenFile) {
            currentOpenFile.content = sourceEditor.getValue();
            dbPut(currentOpenFile).then(() => {
                 statusText.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;
            });
        }
    }

    // Remove old localStorage loading
    function loadContent() {
        // This is now handled by opening a file.
        // Maybe open the first file by default?
        statusText.textContent = 'Select a file to begin.';
    }


    // 7. PDF Compilation Logic
    const compileBtn = document.getElementById('compile');
    const compileSpinner = document.getElementById('compileSpinner');
    const pdfViewUI = document.getElementById('pdfViewUI');

    compileBtn.addEventListener('click', async () => {
        compileSpinner.style.display = 'inline-block';
        dockerConsole.setValue('Compilation started...\n');

        const latexCode = sourceEditor.getValue();

        // Using a public API for compilation. A more robust solution might need a dedicated backend.
        // This is a proxy to avoid CORS issues if the target API doesn't support it.
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const apiUrl = 'https://latexonline.cc/compile';

        try {
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `text=${encodeURIComponent(latexCode)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.status === 'success' && result.log) {
                 // The API returns the log and the PDF file name.
                 // We can construct the URL to the PDF.
                const pdfFileName = result.log.replace('.log', '.pdf');
                const pdfUrl = `https://latexonline.cc/data/${pdfFileName}`;

                dockerConsole.setValue('Compilation successful.\n');
                dockerConsole.insert(result.log);

                pdfViewUI.innerHTML = `<iframe src="${pdfUrl}" style="width: 100%; height: 100%; border: none;"></iframe>`;

            } else if (result.status === 'error' && result.log) {
                dockerConsole.setValue('Compilation failed with errors:\n');
                dockerConsole.insert(result.log);
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

    // 9. Basic Syntax Linter
    function detectErrors(code) {
        const lines = code.split('\n');
        const annotations = [];
        const envStack = [];

        lines.forEach((line, i) => {
            // Check for unbalanced symbols on each line
            if ((line.match(/(?<!\\)\$/g) || []).length % 2 !== 0) {
                annotations.push({ row: i, column: 0, text: "Odd number of unescaped '$'.", type: "error" });
            }
            if ((line.match(/{/g) || []).length !== (line.match(/}/g) || []).length) {
                annotations.push({ row: i, column: 0, text: "Unbalanced curly braces {}.", type: "error" });
            }
            if ((line.match(/\(/g) || []).length !== (line.match(/\)/g) || []).length) {
                annotations.push({ row: i, column: 0, text: "Unbalanced parentheses ().", type: "warning" });
            }
            if ((line.match(/\[/g) || []).length !== (line.match(/\]/g) || []).length) {
                annotations.push({ row: i, column: 0, text: "Unbalanced square brackets [].", type: "warning" });
            }

            // Check for \begin and \end
            const begins = line.match(/\\begin\{[^\}]+\}/g) || [];
            begins.forEach(begin => {
                const env = begin.match(/\\begin\{([^\}]+)\}/)[1];
                envStack.push({ env: env, line: i });
            });

            const ends = line.match(/\\end\{[^\}]+\}/g) || [];
            ends.forEach(end => {
                const env = end.match(/\\end\{([^\}]+)\}/)[1];
                if (envStack.length > 0 && envStack[envStack.length - 1].env === env) {
                    envStack.pop();
                } else {
                    annotations.push({ row: i, column: 0, text: `Unmatched \\end{${env}}`, type: "error" });
                }
            });
        });

        // Check for unclosed environments
        envStack.forEach(item => {
            annotations.push({ row: item.line, column: 0, text: `Unclosed \\begin{${item.env}}`, type: "error" });
        });

        return annotations;
    }

    let lintTimeout;
    sourceEditor.session.on('change', () => {
        clearTimeout(lintTimeout);
        lintTimeout = setTimeout(() => {
            const code = sourceEditor.getValue();
            const annotations = detectErrors(code);
            sourceEditor.session.setAnnotations(annotations);
        }, 500); // Debounce for 500ms
    });

    // 10. Ctrl+S/Cmd+S Save Notification
    const saveNotification = document.getElementById('saveNotification');
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNotification.style.display = 'block';
            setTimeout(() => {
                saveNotification.style.display = 'none';
            }, 3000);
        }
    });
});
