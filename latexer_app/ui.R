# ==============================================================================
#                        LaTeXeR - User Interface
# ==============================================================================
# This file defines the user interface for the LaTeXeR application. It uses a
# fluidPage layout with custom HTML and CSS to create a modern and responsive
# design. The UI is structured into a header, a main content area with
# resizable panels, and a settings panel.
# ==============================================================================

ui <- fluidPage(
  # ----------------------------------
  #        HTML HEAD CONTENT
  # ----------------------------------
  # Includes custom CSS for styling, JavaScript for theme management, and other
  # essential meta tags and libraries like Font Awesome and Split.js.
  tags$head(
    tags$meta(charset = "UTF-8"),
    tags$meta(name = "viewport", content = "width=device-width, initial-scale=1.0"),
    tags$title("LaTeXeR - Modern LaTeX Editor"),

    # CSS Stylesheet
    tags$link(rel = "stylesheet", href = "styles.css"),

    # JavaScript Files
    tags$script(src = "https://unpkg.com/split.js/dist/split.min.js"), # For resizable panels
    tags$script(src = "theme.js", defer = TRUE), # For dark/light mode toggle

    # Font Awesome for icons
    tags$link(rel = "stylesheet", href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css")
  ),

  # ----------------------------------
  #        APPLICATION LAYOUT
  # ----------------------------------
  div(id = "app-container",
      # -- Header --
      tags$header(
        div(class = "logo-container",
            tags$img(src = "https://raw.githubusercontent.com/SulmanOlieko/sulmanolieko.github.io/main/img/ekonly-logo.svg", class = "logo"),
            tags$h1("LaTeXeR")
        ),
        div(class = "header-actions",
            actionButton("compile", "Compile", icon = icon("cogs"), class = "btn-compile"),
            actionButton("openSettings", icon("cog"), class = "btn-icon", title = "Settings"),
            actionButton("theme_toggle", icon("moon"), class = "btn-icon", title = "Toggle Theme")
        )
      ),

      # -- Main Content Area --
      # This area is split into three resizable panels: File Sidebar, Editor, and PDF Preview.
      div(id = "main-content",
          # 1. File Sidebar
          div(id = "file-sidebar", class = "split",
              div(class = "sidebar-section",
                  uiOutput("mainFileSelect")
              ),
              div(class = "sidebar-section",
                  h4("Project Files"),
                  div(class = "bulk-actions",
                    downloadButton("bulkDownloadUploaded", "Download All", class="btn-sm"),
                    actionButton("bulkDeleteUploaded", "Delete All", class="btn-sm btn-danger")
                  ),
                  div(class = "file-actions-buttons",
                      actionLink("newFile", "New File", icon = icon("file-alt")),
                      actionLink("newFolder", "New Folder", icon = icon("folder-plus")),
                      fileInput("uploadFiles", NULL, multiple = TRUE, buttonLabel = icon("upload"), placeholder = "Upload")
                  ),
                  uiOutput("fileListSidebar")
              ),
              div(class = "sidebar-section",
                  h4("Compiled Files"),
                  div(class = "bulk-actions",
                    downloadButton("bulkDownloadCompiled", "Download All", class="btn-sm"),
                    actionButton("bulkDeleteCompiled", "Delete All", class="btn-sm btn-danger")
                  ),
                  uiOutput("compiledFileList")
              )
          ),

          # 2. Editor Area
          div(id = "editor-area", class = "split",
              div(id = "status-bar", "Ready"),
              aceEditor("sourceEditor", value = "", mode = "latex", height = "calc(100% - 30px)")
          ),

          # 3. PDF Preview & Docker Console
          div(id = "preview-area", class = "split",
              div(id = "preview-split",
                  # PDF Viewer
                  div(id = "pdf-container", class = "split-vertical",
                      tags$h4("PDF Preview"),
                      uiOutput("pdfViewUI")
                  ),
                  # Docker/Compile Log Console
                  div(id = "docker-console-container", class = "split-vertical",
                      tags$h4("Logs"),
                      aceEditor("dockerConsole", value = "", mode = "text", readOnly = TRUE, height = "100%")
                  )
              )
          )
      ),

      # -- Settings Panel (Initially Hidden) --
      div(id = "settings-panel",
          h3("Settings"),
          selectInput("editorThemePanel", "Editor Theme",
                      choices = c("tomorrow", "monokai", "github", "solarized_dark", "solarized_light"),
                      selected = "solarized_dark"),
          sliderInput("editorFontSizePanel", "Font Size", min = 8, max = 32, value = 12),
          checkboxInput("showDockerConsole", "Docker Console", value = FALSE),
          checkboxInput("showPdfPreview", "PDF Preview", value = TRUE),
          checkboxInput("editorWordWrap", "Word Wrap", value = TRUE),
          checkboxInput("editorLineNumbers", "Line Numbers", value = TRUE),
          checkboxInput("showPrintMargin", "Print Margin", value = TRUE),
          checkboxInput("enableAutocomplete", "Autocomplete", value = TRUE),
          actionButton("closeSettings", "Close", class = "btn-secondary")
      )
  ),

  # ----------------------------------
  #      CUSTOM JAVASCRIPT
  # ----------------------------------
  # Initializes the resizable panels using Split.js and handles other UI interactions.
  tags$script(HTML("
    document.addEventListener('DOMContentLoaded', function() {
      // Horizontal Splitter
      Split(['#file-sidebar', '#editor-area', '#preview-area'], {
        sizes: [20, 45, 35],
        minSize: [200, 300, 300],
        gutterSize: 8,
        cursor: 'col-resize'
      });

      // Vertical Splitter
      Split(['#pdf-container', '#docker-console-container'], {
        direction: 'vertical',
        sizes: [75, 25],
        minSize: [100, 50],
        gutterSize: 8,
        cursor: 'row-resize'
      });

      // Settings Panel Toggle
      const settingsPanel = document.getElementById('settings-panel');
      document.getElementById('openSettings').addEventListener('click', () => {
        settingsPanel.style.display = 'block';
      });
      document.getElementById('closeSettings').addEventListener('click', () => {
        settingsPanel.style.display = 'none';
      });

      // File Tree Folder Toggle
      $(document).on('click', '.folder-name', function(e) {
        var childTree = $(this).closest('li').find('ul.child-tree').first();
        childTree.slideToggle(150); // A bit smoother
        $(this).find('.toggle-icon').toggleClass('fa-caret-right fa-caret-down');
        e.stopPropagation();
      });

      // --- Settings Management ---
      function saveSettings() {
        var settings = {
          editorTheme: $('#editorThemePanel').val(),
          fontSize: $('#editorFontSizePanel').val(),
          showDocker: $('#showDockerConsole').prop('checked'),
          showPdf: $('#showPdfPreview').prop('checked'),
          wordWrap: $('#editorWordWrap').prop('checked'),
          lineNumbers: $('#editorLineNumbers').prop('checked'),
          printMargin: $('#showPrintMargin').prop('checked'),
          autocomplete: $('#enableAutocomplete').prop('checked')
        };
        Shiny.setInputValue('saveSettings', settings, {priority: 'event'});
      }

      // Persist settings changes to the server
      $(document).on('change', '#editorThemePanel, #editorFontSizePanel, #showDockerConsole, #showPdfPreview, #editorWordWrap, #editorLineNumbers, #showPrintMargin, #enableAutocomplete', function() {
        saveSettings();
      });

      // Save settings to localStorage when instructed by the server
      Shiny.addCustomMessageHandler('saveSettingsToLocal', function(settings) {
        localStorage.setItem('latexerSettings', JSON.stringify(settings));
      });

      // Custom message handlers from server
      Shiny.addCustomMessageHandler('updateStatus', function(message) {
        document.getElementById('status-bar').innerText = message;
      });

      Shiny.addCustomMessageHandler('scrollDockerConsole', function(message) {
        var editor = ace.edit('dockerConsole');
        if (editor) {
          editor.scrollToLine(editor.getSession().getLength(), true, true);
        }
      });

      Shiny.addCustomMessageHandler('setAnnotations', function(annotations) {
          var editor = ace.edit('sourceEditor');
          editor.getSession().setAnnotations(annotations);
      });

      Shiny.addCustomMessageHandler('toggleCompileSpinner', function(show) {
          const spinner = document.querySelector('.btn-compile .fa-cogs');
          if (show) {
              spinner.classList.add('fa-spin');
          } else {
              spinner.classList.remove('fa-spin');
          }
      });

      Shiny.addCustomMessageHandler('applyUISettings', function(data) {
          if (data.dockerConsoleVisible === false) {
            document.getElementById('docker-console-container').style.display = 'none';
          } else {
            document.getElementById('docker-console-container').style.display = 'block';
          }
          if (typeof data.pdfPreviewVisible !== 'undefined') {
            if (data.pdfPreviewVisible === false) {
              document.getElementById('pdf-container').style.display = 'none';
            } else {
              document.getElementById('pdf-container').style.display = 'block';
            }
          }
          // The split needs to be re-initialized if visibility changes.
          // This is a simplification; a more robust solution might be needed.
      });

    });
  "))
)