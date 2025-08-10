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
    const pdfContainer = document.getElementById('pdfContainer');
    const htmlPreview = document.getElementById('htmlPreview');
    const pdfHeader = document.querySelector('#pdfPreview .pdf-header');

    let isSyncing = false;

    function convertLatexToHtml(code) {
        if (!code) return "";
        let html = code;
        // Basic replacements for bold, italic, underline
        html = html.replace(/\\textbf\{([^{}]+)\}/g, "<strong>$1</strong>");
        html = html.replace(/\\textit\{([^{}]+)\}/g, "<em>$1</em>");
        html = html.replace(/\\underline\{([^{}]+)\}/g, "<u>$1</u>");
        // Section and subsection headings
        html = html.replace(/\\section\{([^{}]+)\}/g, "<h2>$1</h2>");
        html = html.replace(/\\subsection\{([^{}]+)\}/g, "<h3>$1</h3>");
        // Itemize environment
        html = html.replace(/\\begin\{itemize\}/g, "<ul>");
        html = html.replace(/\\end\{itemize\}/g, "</ul>");
        html = html.replace(/\\item/g, "<li>");
        // Handle newlines for preview
        html = html.replace(/\n/g, "<br>");
        return html;
    }

    function updateHtmlPreview() {
        const code = sourceEditor.getValue();
        htmlPreview.innerHTML = convertLatexToHtml(code);
    }

    viewModeSwitch.addEventListener('change', () => {
        if (viewModeSwitch.checked) { // Switched to Visual Mode
            isSyncing = true;
            visualEditor.innerText = sourceEditor.getValue();
            isSyncing = false;

            codeEditorContainer.style.display = 'none';
            visualEditorContainer.style.display = 'block';

            pdfContainer.style.display = 'none';
            pdfHeader.style.display = 'none';
            htmlPreview.style.display = 'block';
            updateHtmlPreview();
        } else { // Switched to Code Mode
            isSyncing = true;
            sourceEditor.setValue(visualEditor.innerText, -1);
            isSyncing = false;

            visualEditorContainer.style.display = 'none';
            codeEditorContainer.style.display = 'block';

            htmlPreview.style.display = 'none';
            if (showPdfSwitch.checked) {
                pdfContainer.style.display = 'block';
                pdfHeader.style.display = 'block';
            }
        }
    });

    sourceEditor.session.on('change', () => {
        if (!isSyncing && viewModeSwitch.checked) {
            isSyncing = true;
            visualEditor.innerText = sourceEditor.getValue();
            updateHtmlPreview();
            isSyncing = false;
        }
    });

    visualEditor.addEventListener('input', () => {
        if (!isSyncing) {
            isSyncing = true;
            sourceEditor.setValue(visualEditor.innerText, -1);
            updateHtmlPreview();
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
});
