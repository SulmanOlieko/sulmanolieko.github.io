server <- function(input, output, session) {
    # Helper function: choose an icon based on file extension
    getFileIcon <- function(filename) {
      ext <- tolower(tools::file_ext(filename))
      if (ext == "tex") return(icon("file-code"))
      else if (ext == "bib") return(icon("file-text"))
      else if (ext %in% c("txt", "rnw")) return(icon("file-alt"))
      else if (ext == "pdf") return(icon("file-pdf"))
      else if (ext %in% c("png", "jpg", "jpeg", "gif")) return(icon("file-image"))
      else if (ext %in% c("doc", "docx")) return(icon("file-word"))
      else if (ext %in% c("xls", "xlsx")) return(icon("file-excel"))
      else if (ext %in% c("ppt", "pptx")) return(icon("file-powerpoint"))
      else if (ext %in% c("zip", "tar", "gz", "7z")) return(icon("file-archive"))
      else if (ext %in% c("html", "htm", "js", "css", "xml", "json")) return(icon("file-code"))
      else if (ext %in% c("c", "cpp", "java", "py", "sh")) return(icon("file-code"))
      else if (ext %in% c("mp3", "wav")) return(icon("file-audio"))
      else if (ext %in% c("mp4", "mov", "avi", "mkv")) return(icon("file-video"))
      else return(icon("file"))
    }

    # Reactive values to track files
    rv_files <- reactiveVal(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
    currentFile <- reactiveVal("")
    compileLog <- reactiveVal("")
    rv_compiled <- reactiveVal(list.files(compiledDir))
    dockerLog <- reactiveVal("")

    # Reactive value to store linter annotations from ChkTeX
    lintAnnotations <- reactiveVal(list())

    # ------------------------- PERSISTENT CACHING SETUP -------------------------
    cacheDir <- "cache"
    if (!dir.exists(cacheDir)) dir.create(cacheDir)
    compileLogFile <- file.path(cacheDir, "compileLog.txt")
    dockerLogFile <- file.path(cacheDir, "dockerLog.txt")
    themeFile     <- file.path(cacheDir, "theme.txt")
    lastFileFile  <- file.path(cacheDir, "lastFile.txt")
    uiSettingsFile<- file.path(cacheDir, "uiSettings.json")

    # Load cached compile and docker logs, combining them into the Docker console. The first
    # console has been removed, so compile logs are now shown in the Docker console.
    cachedCompileLog <- ""
    cachedDockerLog  <- ""
    if (file.exists(compileLogFile)) {
      cachedCompileLog <- paste(readLines(compileLogFile, warn = FALSE), collapse = "\n")
      compileLog(cachedCompileLog)
    }
    if (file.exists(dockerLogFile)) {
      cachedDockerLog <- paste(readLines(dockerLogFile, warn = FALSE), collapse = "\n")
    }
    if (nchar(cachedCompileLog) > 0 || nchar(cachedDockerLog) > 0) {
      combinedLog <- paste(c(cachedCompileLog, cachedDockerLog), collapse = ifelse(nzchar(cachedCompileLog) && nzchar(cachedDockerLog), "\n", ""))
      dockerLog(combinedLog)
      session$onFlushed(function(){ updateAceEditor(session, "dockerConsole", value = combinedLog) })
    }
    if (file.exists(themeFile)) {
      savedTheme <- readLines(themeFile, warn = FALSE)
      session$onFlushed(function(){ updateSelectInput(session, "editorTheme", selected = savedTheme) })
    }
    if (file.exists(lastFileFile)) {
      lastF <- readLines(lastFileFile, warn = FALSE)
      currentFile(lastF)
    }

    uiSettings <- reactiveValues(
      dockerConsoleVisible = TRUE,
      pdfPreviewSizes  = c(80, 20),
      pdfPreviewVisible = TRUE
    )
    if (file.exists(uiSettingsFile)) {
      savedUI <- fromJSON(readLines(uiSettingsFile, warn = FALSE))
      uiSettings$dockerConsoleVisible  <- savedUI$dockerConsoleVisible
      uiSettings$pdfPreviewSizes       <- savedUI$pdfPreviewSizes
      if (!is.null(savedUI$pdfPreviewVisible)) uiSettings$pdfPreviewVisible <- savedUI$pdfPreviewVisible
      session$onFlushed(function(){
        session$sendCustomMessage("applyUISettings", list(
          dockerConsoleVisible = isolate(uiSettings$dockerConsoleVisible),
          pdfPreviewSizes  = c(0, isolate(uiSettings$pdfPreviewSizes)),
          pdfPreviewVisible = isolate(uiSettings$pdfPreviewVisible)
        ))
        # Initialize the settings panel controls to reflect the persisted values
        updateCheckboxInput(session, "showDockerConsole", value = isolate(uiSettings$dockerConsoleVisible))
        updateCheckboxInput(session, "showPdfPreview", value = isolate(uiSettings$pdfPreviewVisible))
      })
    }

    saveUISettings <- function() {
      settings <- list(
        dockerConsoleVisible = uiSettings$dockerConsoleVisible,
        pdfPreviewSizes  = uiSettings$pdfPreviewSizes,
        pdfPreviewVisible = uiSettings$pdfPreviewVisible
      )
      writeLines(toJSON(settings, auto_unbox = TRUE, pretty = TRUE), uiSettingsFile)
    }

    # Removed observer for input$dockerConsoleVisible. Visibility of the docker console is
    # now controlled by the settings panel (showDockerConsole) and persisted via uiSettings.
    observeEvent(input$pdfPreviewSizes, { uiSettings$pdfPreviewSizes <- input$pdfPreviewSizes; saveUISettings() })

    # Observe changes to show/hide Docker console from settings panel. When toggled,
    # update the reactive UI setting, persist the change and instruct the client
    # to hide or show the Docker console via a custom message.
    observeEvent(input$showDockerConsole, {
      req(input$showDockerConsole)
      uiSettings$dockerConsoleVisible <- input$showDockerConsole
      saveUISettings()
      session$sendCustomMessage('applyUISettings', list(dockerConsoleVisible = input$showDockerConsole))
    })

    # Observe changes to show/hide PDF preview from the settings panel. When toggled,
    # update the reactive UI setting, persist the change and instruct the client
    # to hide or show the PDF container via a custom message.
    observeEvent(input$showPdfPreview, {
      req(input$showPdfPreview)
      uiSettings$pdfPreviewVisible <- input$showPdfPreview
      saveUISettings()
      session$sendCustomMessage('applyUISettings', list(pdfPreviewVisible = input$showPdfPreview))
    })

    # Handle drag-and-drop movement of files into folders. The client sends
    # `dragDropMove` with file and folder paths (relative to uploadDir). Move the file
    # to the new folder and update the file list.
    observeEvent(input$dragDropMove, {
      req(input$dragDropMove$file)
      req(input$dragDropMove$folder)
      # Determine source and destination paths
      oldRelPath <- input$dragDropMove$file
      newFolderRel <- input$dragDropMove$folder
      oldPath <- file.path(uploadDir, oldRelPath)
      # If dropped onto root (empty folder path), move to uploads root
      if (newFolderRel == "" || newFolderRel == ".") {
        newPath <- file.path(uploadDir, basename(oldRelPath))
      } else {
        newPath <- file.path(uploadDir, newFolderRel, basename(oldRelPath))
      }
      # Ensure destination directory exists
      if (!dir.exists(dirname(newPath))) dir.create(dirname(newPath), recursive = TRUE)
      # Move the file
      if (file.exists(oldPath)) {
        file.rename(oldPath, newPath)
        # Refresh file listing
        rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
      }
    }, ignoreNULL = TRUE)

    # Persist user settings coming from the settings panel. When saveSettings is
    # triggered (via the JS function saveSettings), update themes, font sizes,
    # and visibility toggles on the server, persist them to disk and instruct
    # the client to store them in localStorage.
    observeEvent(input$saveSettings, {
      settings <- input$saveSettings
      # Update theme if provided
      if (!is.null(settings$editorTheme) && settings$editorTheme != "") {
        updateAceEditor(session, "sourceEditor", theme = settings$editorTheme)
        updateAceEditor(session, "dockerConsole", theme = settings$editorTheme)
        writeLines(settings$editorTheme, themeFile)
      }
      # Update font size if provided
      if (!is.null(settings$fontSize) && !is.na(as.numeric(settings$fontSize))) {
        fs <- as.numeric(settings$fontSize)
        updateAceEditor(session, "sourceEditor", fontSize = fs)
        updateAceEditor(session, "dockerConsole", fontSize = fs)
      }
      # Update visibility toggles
      if (!is.null(settings$showDocker)) {
        uiSettings$dockerConsoleVisible <- as.logical(settings$showDocker)
        session$sendCustomMessage('applyUISettings', list(dockerConsoleVisible = uiSettings$dockerConsoleVisible))
      }
      if (!is.null(settings$showPdf)) {
        uiSettings$pdfPreviewVisible <- as.logical(settings$showPdf)
        session$sendCustomMessage('applyUISettings', list(pdfPreviewVisible = uiSettings$pdfPreviewVisible))
      }

      # Update print margin visibility if provided
      if (!is.null(settings$printMargin)) {
        updateAceEditor(session, "sourceEditor", showPrintMargin = as.logical(settings$printMargin))
      }
      # Update autocomplete setting if provided. When true, use 'live' auto-complete;
      # otherwise disable it. See shinyAce documentation for options.
      if (!is.null(settings$autocomplete)) {
        if (isTRUE(as.logical(settings$autocomplete))) {
          updateAceEditor(session, "sourceEditor", autoComplete = "live")
        } else {
          updateAceEditor(session, "sourceEditor", autoComplete = "disabled")
        }
      }
      # Update tab size if provided
      if (!is.null(settings$tabSize) && !is.na(as.numeric(settings$tabSize))) {
        ts <- as.numeric(settings$tabSize)
        updateAceEditor(session, "sourceEditor", tabSize = ts)
      }

      # Update editor word wrap if provided
      if (!is.null(settings$wordWrap)) {
        # Ace expects a logical value for wordWrap option
        updateAceEditor(session, "sourceEditor", wordWrap = as.logical(settings$wordWrap))
      }
      # Update line number visibility if provided. The shinyAce update API uses
      # showLineNumbers instead of showGutter.
      if (!is.null(settings$lineNumbers)) {
        updateAceEditor(session, "sourceEditor", showLineNumbers = as.logical(settings$lineNumbers))
      }
      saveUISettings()
      # Save combined settings to localStorage on the client
      session$sendCustomMessage('saveSettingsToLocal', settings)
    }, ignoreNULL = TRUE)

    observeEvent(currentFile(), { writeLines(currentFile(), lastFileFile) })

    updateStatus <- function(txt) { session$sendCustomMessage("updateStatus", txt) }
    appendLog <- function(msg) {
      newLog <- paste0(compileLog(), msg, "\n")
      compileLog(newLog)
      # Append the same message to the Docker log so that compile logs are visible in the single console
      appendDockerLog(msg)
    }
    appendDockerLog <- function(msg) {
      newLog <- paste0(dockerLog(), msg, "\n")
      dockerLog(newLog)
      updateAceEditor(session, "dockerConsole", value = newLog)
      session$sendCustomMessage("scrollDockerConsole", "")
    }
    refreshCompiled <- function() { rv_compiled(list.files(compiledDir)) }

    # Run ChkTeX linter inside Docker using assignuser/chktex-alpine.
    # This function writes the current source code to a temporary .tex file,
    # invokes ChkTeX in a Docker container with -v0 output format, parses
    # the output into Ace-compatible annotations, appends linter messages to
    # the docker console, and updates the Ace editor annotations.
    runChktexLint <- function(code) {
      # Create temporary tex file in the compiled directory to be accessible to Docker
      tmpFile <- tempfile(pattern = "lint_", tmpdir = compiledDir, fileext = ".tex")
      writeLines(code, tmpFile)
      tmpDir <- dirname(tmpFile)
      # Notify in log that linter is running
      appendDockerLog(paste0("ChkTeX lint started on ", basename(tmpFile)))
      # Launch docker process for ChkTeX. We avoid the -v option which is unsupported
      # in some builds and instead specify an explicit output format using -f. The
      # chosen format prints line, column, warning number and message separated
      # by colons so that we can easily parse each warning.
      proc <- processx::process$new(
        "docker",
        args = c(
          "run", "--rm",
          "-v", paste0(normalizePath(tmpDir, winslash = "/"), ":/data"),
          "assignuser/chktex-alpine",
          "chktex", "-q",
          "-f", "%l:%c:%n:%m",
          paste0("/data/", basename(tmpFile))
        ),
        stdout = "|",
        stderr = "|"
      )
      # Prepare container for annotations
      chktexAnn <- list()
      # Read output and error streams while process is alive
      while (proc$is_alive()) {
        out_lines <- proc$read_output_lines()
        if (length(out_lines) > 0) {
          for (line in out_lines) {
            # Filter out non-informational warnings about missing resource files
            if (!grepl("Could not find global resource file", line, fixed = TRUE) &&
                !grepl("Illegal verbosity level", line, fixed = TRUE)) {
              appendDockerLog(line)
            }
            # Split the line on colons and trim whitespace from each field
            parts <- strsplit(line, ":", fixed = TRUE)[[1]]
            parts <- trimws(parts)
            # Expect at least 4 parts: line, column, warning number, message
            if (length(parts) >= 4) {
              line_num <- suppressWarnings(as.numeric(parts[1]))
              col_num  <- suppressWarnings(as.numeric(parts[2]))
              # Reconstruct the message from all remaining parts (in case message includes colons)
              msg <- paste(parts[4:length(parts)], collapse = ":")
              msg <- trimws(msg)
              if (!is.na(line_num) && !is.na(col_num)) {
                chktexAnn[[length(chktexAnn) + 1]] <- list(
                  row = line_num - 1,
                  column = max(col_num - 1, 0),
                  text = paste0("ChkTeX: ", msg),
                  type = "warning"
                )
              }
            }
          }
        }
        err_lines <- proc$read_error_lines()
        if (length(err_lines) > 0) {
          for (line in err_lines) {
            if (!grepl("Could not find global resource file", line, fixed = TRUE) &&
                !grepl("Illegal verbosity level", line, fixed = TRUE)) {
              appendDockerLog(line)
            }
          }
        }
        Sys.sleep(0.1)
      }
      # Capture any remaining output and error after process ends
      out_lines <- proc$read_all_output_lines()
      if (length(out_lines) > 0) {
        for (line in out_lines) {
          if (!grepl("Could not find global resource file", line, fixed = TRUE) &&
              !grepl("Illegal verbosity level", line, fixed = TRUE)) {
            appendDockerLog(line)
          }
          # Split the line on colons and trim whitespace
          parts <- strsplit(line, ":", fixed = TRUE)[[1]]
          parts <- trimws(parts)
          if (length(parts) >= 4) {
            line_num <- suppressWarnings(as.numeric(parts[1]))
            col_num  <- suppressWarnings(as.numeric(parts[2]))
            msg <- paste(parts[4:length(parts)], collapse = ":")
            msg <- trimws(msg)
            if (!is.na(line_num) && !is.na(col_num)) {
              chktexAnn[[length(chktexAnn) + 1]] <- list(
                row = line_num - 1,
                column = max(col_num - 1, 0),
                text = paste0("ChkTeX: ", msg),
                type = "warning"
              )
            }
          }
        }
      }
      err_lines <- proc$read_all_error_lines()
      if (length(err_lines) > 0) {
        for (line in err_lines) {
          if (!grepl("Could not find global resource file", line, fixed = TRUE) &&
              !grepl("Illegal verbosity level", line, fixed = TRUE)) {
            appendDockerLog(line)
          }
        }
      }
      # Remove the temporary file
      if (file.exists(tmpFile)) file.remove(tmpFile)
      # Store lint annotations
      lintAnnotations(chktexAnn)
      # Combine with basic detectErrors results and update Ace editor annotations
      baseAnn <- detectErrors(code)
      combined <- c(baseAnn, chktexAnn)
      session$sendCustomMessage("setAnnotations", combined)
    }

    ### FILE LISTS (unchanged) ###
    buildFileTree <- function(dirPath = "") {
      fullDirPath <- file.path(uploadDir, dirPath)
      items <- list.files(fullDirPath, full.names = FALSE, include.dirs = TRUE, recursive = FALSE)
      if (length(items) == 0) return(NULL)

      li_elements <- lapply(items, function(item) {
        itemPath <- if (dirPath == "") item else file.path(dirPath, item)
        fullItemPath <- file.path(uploadDir, itemPath)
        isDir <- file.info(fullItemPath)$isdir
        safeId <- gsub("[^A-Za-z0-9]", "_", itemPath)

        if (isDir) {
          folderNode <- tags$div(
            class = "folder-item", `data-path` = itemPath,
            tags$div(class = "folder-name",
                     tags$i(class = "fas fa-caret-right toggle-icon"),
                     icon("folder"), " ", item
            ),
            tags$div(class = "folder-actions",
                     actionLink(paste0("delete_folder_", safeId), icon("trash"), title = "Delete Folder")
            )
          )
          childTree <- buildFileTree(itemPath)
          tags$li(folderNode, if (!is.null(childTree)) tags$ul(class = "child-tree", style = "display:none;", childTree))
        } else {
        fileNode <- tags$div(
          class = "file-item",
          `draggable` = "true",
          `data-path` = itemPath,
          tags$div(class = "file-name", getFileIcon(item), " ", item),
          tags$div(class = "file-actions",
                   if (tolower(tools::file_ext(item)) %in% text_extensions)
                     actionLink(paste0("edit_", safeId), icon("edit"), title = "Edit"),
                   actionLink(paste0("preview_", safeId), icon("eye"), title = "Preview"),
                   actionLink(paste0("download_", safeId), icon("download"), title = "Download"),
                   actionLink(paste0("delete_", safeId), icon("trash"), title = "Delete"),
                   actionLink(paste0("move_", safeId), icon("arrows-alt"), title = "Move"),
                   actionLink(paste0("rename_", safeId), icon("pencil"), title = "Rename")
          )
        )
          tags$li(fileNode)
        }
      })
      return(li_elements)
    }

    output$fileListSidebar <- renderUI({
      dummy <- rv_files()
      fileTree <- buildFileTree()
      if (is.null(fileTree)) {
        p("No files in project.")
      } else {
        tags$div(
          tags$ul(class = "file-tree", fileTree)
        )
      }
    })

    output$compiledFileList <- renderUI({
      files <- rv_compiled()
      allowed_compiled <- c("output.pdf", "output.aux", "output.bbl", "output.log", "output.out", "output.blg", "output.synctex.gz")
      files_to_show <- intersect(files, allowed_compiled)
      if (length(files_to_show) == 0) {
        p("No compiled files.")
      } else {
        tagList(
          lapply(files_to_show, function(fileName) {
            fileId <- gsub("[^A-Za-z0-9]", "_", fileName)
            div(class = "file-list-item",
                div(class = "file-name", fileName),
                div(class = "file-actions",
                    actionLink(paste0("preview_compiled_", fileId), icon("eye"), title = "Preview"),
                    actionLink(paste0("download_compiled_", fileId), icon("download"), title = "Download"),
                    actionLink(paste0("delete_compiled_", fileId), icon("trash"), title = "Delete")
                )
            )
          })
        )
      }
    })

    observe({
      files <- rv_compiled()
      lapply(files, function(fileName) {
        local({
          fileId <- gsub("[^A-Za-z0-9]", "_", fileName)
          observeEvent(input[[paste0("preview_compiled_", fileId)]], {
            showModal(modalDialog(
              title = paste("Preview", fileName),
              tags$iframe(style = "width:100%; height:400px;", src = file.path("compiled", fileName)),
              easyClose = TRUE,
              footer = modalButton("Close")
            ))
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("download_compiled_", fileId)]], {
            showModal(modalDialog(
              title = paste("Download", fileName),
              p("Click the link below to download the file:"),
              tags$a(href = file.path("compiled", fileName), fileName, download = fileName, target = "_blank"),
              easyClose = TRUE,
              footer = modalButton("Close")
            ))
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("delete_compiled_", fileId)]], {
            showModal(modalDialog(
              title = "Confirm Delete",
              paste("Are you sure you want to delete", fileName, "?"),
              footer = tagList(
                modalButton("Cancel"),
                actionButton(paste0("confirmDelete_compiled_", fileId), "Delete", class = "btn btn-danger")
              )
            ))
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("confirmDelete_compiled_", fileId)]], {
            fpath <- file.path(compiledDir, fileName)
            if (file.exists(fpath)) {
              file.remove(fpath)
              refreshCompiled()
            }
            removeModal()
          }, ignoreInit = TRUE)
        })
      })
    })

    output$mainFileSelect <- renderUI({
      texFiles <- list.files(uploadDir, pattern = "\\.tex$", ignore.case = TRUE, recursive = TRUE)
      if (length(texFiles) > 0) {
        selectInput("compileMainFile", "Select Main .tex File", choices = texFiles,
                    selected = if (currentFile() %in% texFiles) currentFile() else texFiles[1])
      } else {
        p("No .tex files available")
      }
    })

    observeEvent(input$compileMainFile, {
      req(input$compileMainFile)
      filePath <- file.path(uploadDir, input$compileMainFile)
      if (file.exists(filePath)) {
        content <- paste(readLines(filePath, warn = FALSE), collapse = "\n")
        updateAceEditor(session, "sourceEditor", value = content)
        currentFile(input$compileMainFile)
        updateStatus(paste0(input$compileMainFile, " loaded."))
      }
    }, ignoreNULL = FALSE)

    observeEvent(input$uploadFiles, {
      req(input$uploadFiles)
      for (i in seq_len(nrow(input$uploadFiles))) {
        destPath <- file.path(uploadDir, input$uploadFiles$name[i])
        file.copy(input$uploadFiles$datapath[i], destPath, overwrite = TRUE)
      }
      rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
    })

    observeEvent(input$newFile, {
      showModal(modalDialog(
        title = "Create New File",
        textInput("newFileName", "File Name (without extension)"),
        selectInput("newFileType", "File Type",
                    choices = c("LaTeX (.tex)" = ".tex", "BibTeX (.bib)" = ".bib", "Text (.txt)" = ".txt")),
        footer = tagList(
          modalButton("Cancel"),
          actionButton("createNewFile", "Create", class = "btn btn-primary")
        )
      ))
    })

    observeEvent(input$createNewFile, {
      req(input$newFileName, input$newFileType)
      new_name <- paste0(input$newFileName, input$newFileType)
      new_path <- file.path(uploadDir, new_name)
      if (file.exists(new_path)) {
        showModal(modalDialog(
          title = "Error",
          paste("File", new_name, "already exists."),
          easyClose = TRUE,
          footer = modalButton("Close")
        ))
      } else {
        writeLines("", new_path)
        rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
        updateAceEditor(session, "sourceEditor", value = "")
        currentFile(new_name)
        updateStatus(paste0(new_name, " (saved)"))
        removeModal()
      }
    })

    observeEvent(input$newFolder, {
      showModal(modalDialog(
        title = "Create New Folder",
        textInput("newFolderName", "Folder Name"),
        footer = tagList(
          modalButton("Cancel"),
          actionButton("createNewFolder", "Create", class = "btn btn-primary")
        )
      ))
    })

    observeEvent(input$createNewFolder, {
      req(input$newFolderName)
      new_folder_path <- file.path(uploadDir, input$newFolderName)
      if (dir.exists(new_folder_path) || file.exists(new_folder_path)) {
        showModal(modalDialog(
          title = "Error",
          paste("Folder", input$newFolderName, "already exists."),
          easyClose = TRUE,
          footer = modalButton("Close")
        ))
      } else {
        dir.create(new_folder_path)
        rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
        removeModal()
      }
    })

    # Observers for file and folder actions (unchanged)
    observe({
      items <- rv_files()
      lapply(items, function(item) {
        local({
          safeId <- gsub("[^A-Za-z0-9]", "_", item)
          fullPath <- file.path(uploadDir, item)
          isDir <- file.info(fullPath)$isdir
          if (!isDir && tolower(tools::file_ext(item)) %in% text_extensions) {
            observeEvent(input[[paste0("edit_", safeId)]], {
              content <- paste(readLines(fullPath, warn = FALSE), collapse = "\n")
              updateAceEditor(session, "sourceEditor", value = content)
              currentFile(item)
              updateStatus(paste0(item, " (loaded)"))
            }, ignoreInit = TRUE)
          }
          if (!isDir) {
            observeEvent(input[[paste0("preview_", safeId)]], {
              if (tolower(tools::file_ext(item)) %in% text_extensions) {
                content <- paste(readLines(fullPath, warn = FALSE), collapse = "\n")
                showModal(modalDialog(
                  title = paste("Preview", item),
                  aceEditor("previewEditor", value = content, mode = "plain_text",
                            readOnly = TRUE, height = "400px", wordWrap = TRUE),
                  easyClose = TRUE,
                  footer = modalButton("Close")
                ))
              } else if (tolower(tools::file_ext(item)) %in% c("png", "jpg", "jpeg", "gif")) {
                showModal(modalDialog(
                  title = paste("Preview", item),
                  tags$img(src = file.path("uploads", item), style = "max-width:100%; height:auto;"),
                  easyClose = TRUE,
                  footer = modalButton("Close")
                ))
              } else if (tolower(tools::file_ext(item)) == "pdf") {
                showModal(modalDialog(
                  title = paste("Preview", item),
                  tags$object(data = file.path("uploads", item), type = "application/pdf", style = "width:100%; height:400px;"),
                  easyClose = TRUE,
                  footer = modalButton("Close")
                ))
              } else {
                showModal(modalDialog(
                  title = paste("Preview", item),
                  tags$a(href = file.path("uploads", item), "Download File", target = "_blank"),
                  easyClose = TRUE,
                  footer = modalButton("Close")
                ))
              }
            }, ignoreInit = TRUE)
            observeEvent(input[[paste0("download_", safeId)]], {
              showModal(modalDialog(
                title = paste("Download", item),
                p("Click the link below to download the file:"),
                tags$a(href = file.path("uploads", item), item, download = item, target = "_blank"),
                easyClose = TRUE,
                footer = modalButton("Close")
              ))
            }, ignoreInit = TRUE)
          }
          if (isDir) {
            observeEvent(input[[paste0("download_", safeId)]], {
              folderPath <- file.path(uploadDir, item)
              zipFile <- file.path(uploadDir, paste0("folder_", safeId, ".zip"))
              if (file.exists(zipFile)) file.remove(zipFile)
              zip(zipfile = zipFile, files = list.files(folderPath, full.names = TRUE))
              showModal(modalDialog(
                title = paste("Download Folder", item),
                p("Click the link below to download the folder as a zip file:"),
                tags$a(href = file.path("uploads", basename(zipFile)), "Download Folder", target = "_blank"),
                easyClose = TRUE,
                footer = modalButton("Close")
              ))
            }, ignoreInit = TRUE)
          }
          observeEvent(input[[paste0("delete_", safeId)]], {
            if (isDir) {
              folderContents <- list.files(fullPath)
              contentTag <- if (length(folderContents) > 0) {
                tags$div(
                  tags$p("This folder contains:"),
                  tags$ul(lapply(folderContents, function(x) { tags$li(x) }))
                )
              } else {
                tags$p("This folder is empty.")
              }
              showModal(modalDialog(
                title = paste("Confirm Delete", item),
                tagList(p(paste("Are you sure you want to delete the folder", item, "and all its contents?")), contentTag),
                footer = tagList(
                  modalButton("Cancel"),
                  actionButton(paste0("confirmDelete_", safeId), "Delete", class = "btn btn-danger")
                )
              ))
            } else {
              showModal(modalDialog(
                title = "Confirm Delete",
                paste("Are you sure you want to delete", item, "?"),
                footer = tagList(
                  modalButton("Cancel"),
                  actionButton(paste0("confirmDelete_", safeId), "Delete", class = "btn btn-danger")
                )
              ))
            }
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("confirmDelete_", safeId)]], {
            if (file.exists(fullPath)) {
              if (isDir) {
                unlink(fullPath, recursive = TRUE)
              } else {
                file.remove(fullPath)
              }
              rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
            }
            removeModal()
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("move_", safeId)]], {
            showModal(modalDialog(
              title = paste("Move", item),
              selectInput("destinationFolder", "Select Destination Folder",
                          choices = {
                            folders <- list.dirs(uploadDir, recursive = FALSE, full.names = FALSE)
                            c("Root" = "ROOT", folders)
                          },
                          selected = "ROOT"
              ),
              footer = tagList(
                modalButton("Cancel"),
                actionButton(paste0("confirmMove_", safeId), "Move", class = "btn btn-primary")
              )
            ))
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("confirmMove_", safeId)]], {
            dest <- input$destinationFolder
            oldPath <- fullPath
            newPath <- if (dest == "ROOT") file.path(uploadDir, basename(item))
            else file.path(uploadDir, dest, basename(item))
            if (dest != "ROOT" && !dir.exists(file.path(uploadDir, dest))) {
              showModal(modalDialog(
                title = "Error",
                paste("Destination folder", dest, "does not exist."),
                easyClose = TRUE,
                footer = modalButton("Close")
              ))
            } else {
              file.rename(oldPath, newPath)
              rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
              removeModal()
            }
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("rename_", safeId)]], {
            showModal(modalDialog(
              title = paste("Rename", item),
              textInput("newName", "New Name (include extension if file)", value = basename(item)),
              footer = tagList(
                modalButton("Cancel"),
                actionButton(paste0("confirmRename_", safeId), "Rename", class = "btn btn-primary")
              )
            ))
          }, ignoreInit = TRUE)
          observeEvent(input[[paste0("confirmRename_", safeId)]], {
            newName <- input$newName
            if (newName == "") {
              showModal(modalDialog(
                title = "Error",
                "New name cannot be empty.",
                easyClose = TRUE,
                footer = modalButton("Close")
              ))
            } else {
              dirPart <- dirname(item)
              newPath <- if (dirPart == ".") file.path(uploadDir, newName) else file.path(uploadDir, dirPart, newName)
              if (file.exists(newPath)) {
                showModal(modalDialog(
                  title = "Error",
                  paste("A file/folder with name", newName, "already exists."),
                  easyClose = TRUE,
                  footer = modalButton("Close")
                ))
              } else {
                file.rename(fullPath, newPath)
                rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
                removeModal()
              }
            }
          }, ignoreInit = TRUE)
        })
      })
    })

    output$bulkDownloadUploaded <- downloadHandler(
      filename = function() { paste("uploads-", Sys.Date(), ".zip", sep = "") },
      content = function(file) {
        files <- list.files(uploadDir, full.names = TRUE)
        if (length(files) > 0) { zip(file, files = files, flags = "-j") }
      },
      contentType = "application/zip"
    )

    output$bulkDownloadCompiled <- downloadHandler(
      filename = function() { paste("compiled-", Sys.Date(), ".zip", sep = "") },
      content = function(file) {
        files <- list.files(compiledDir, full.names = TRUE)
        if (length(files) > 0) { zip(file, files = files, flags = "-j") }
      },
      contentType = "application/zip"
    )

    observeEvent(input$bulkDeleteUploaded, {
      showModal(modalDialog(
        title = "Confirm Bulk Delete",
        "Are you sure you want to delete all uploaded files?",
        footer = tagList(
          modalButton("Cancel"),
          actionButton("confirmBulkDeleteUploaded", "Delete All", class = "btn btn-danger")
        )
      ))
    })
    observeEvent(input$confirmBulkDeleteUploaded, {
      files <- list.files(uploadDir, full.names = TRUE)
      if (length(files) > 0) unlink(files, recursive = TRUE)
      rv_files(list.files(uploadDir, recursive = TRUE, include.dirs = TRUE))
      removeModal()
    })

    observeEvent(input$bulkDeleteCompiled, {
      showModal(modalDialog(
        title = "Confirm Bulk Delete",
        "Are you sure you want to delete all compiled files?",
        footer = tagList(
          modalButton("Cancel"),
          actionButton("confirmBulkDeleteCompiled", "Delete All", class = "btn btn-danger")
        )
      ))
    })
    observeEvent(input$confirmBulkDeleteCompiled, {
      files <- list.files(compiledDir, full.names = TRUE)
      if (length(files) > 0) file.remove(files)
      rv_compiled(list.files(compiledDir))
      removeModal()
    })

    compileFunction <- function() {
      if (is.null(input$compileMainFile) || input$compileMainFile == "") {
        appendLog("No main .tex file selected.")
        return(NULL)
      }
      compileLog("")
      dockerLog("")
      updateAceEditor(session, "dockerConsole", value = "")

      compiled_files <- list.files(compiledDir, full.names = TRUE)
      if (length(compiled_files) > 0) {
        unlink(compiled_files, recursive = TRUE)
      }

      session$sendCustomMessage("toggleCompileSpinner", TRUE)

      main_tex <- input$compileMainFile
      appendLog("Compilation started.")

      syncUploadsToCompiled <- function() {
        appendLog("Syncing project files to compiled folder...")
        files_to_copy <- list.files(uploadDir, full.names = TRUE)
        if (length(files_to_copy) > 0) {
          file.copy(files_to_copy, compiledDir, overwrite = TRUE, recursive = FALSE)
        }
        appendLog("Sync complete.")
      }
      syncUploadsToCompiled()

      docker_run_pdflatex <- function(texfile) {
        appendLog(paste("Running pdflatex on", texfile, "..."))
        proc <- processx::process$new("docker",
                                      args = c(
                                        "run", "--rm",
                                        "-v", paste0(normalizePath(compiledDir, winslash = "/"), ":/compiled"),
                                        "-w", "/compiled",
                                        "texlive/texlive",
                                        "pdflatex", "-interaction=nonstopmode", "-jobname=output", texfile
                                      ),
                                      stdout = "|", stderr = "|"
        )
        while(proc$is_alive()){
          new_output <- proc$read_output_lines()
          if (length(new_output) > 0) { for(line in new_output) { appendDockerLog(line) } }
          new_error <- proc$read_error_lines()
          if (length(new_error) > 0) { for(line in new_error) { appendDockerLog(line) } }
          Sys.sleep(0.1)
        }
        final_output <- proc$read_all_output_lines()
        final_error <- proc$read_all_error_lines()
        for(line in final_output) { appendDockerLog(line) }
        for(line in final_error) { appendDockerLog(line) }
        appendLog("pdflatex run complete.")
      }

      docker_run_bibtex <- function() {
        appendLog("Running bibtex on output...")
        proc <- processx::process$new("docker",
                                      args = c(
                                        "run", "--rm",
                                        "-v", paste0(normalizePath(compiledDir, winslash = "/"), ":/compiled"),
                                        "-w", "/compiled",
                                        "texlive/texlive",
                                        "bibtex", "output"
                                      ),
                                      stdout = "|", stderr = "|"
        )
        while(proc$is_alive()){
          new_output <- proc$read_output_lines()
          if (length(new_output) > 0) { for(line in new_output) { appendDockerLog(line) } }
          new_error <- proc$read_error_lines()
          if (length(new_error) > 0) { for(line in new_error) { appendDockerLog(line) } }
          Sys.sleep(0.1)
        }
        final_output <- proc$read_all_output_lines()
        final_error <- proc$read_all_error_lines()
        for(line in final_output) { appendDockerLog(line) }
        for(line in final_error) { appendDockerLog(line) }
        appendLog("bibtex run complete.")
      }

      docker_run_pdflatex(main_tex)
      docker_run_bibtex()
      docker_run_pdflatex(main_tex)
      docker_run_pdflatex(main_tex)

      pdfPath <- file.path(compiledDir, "output.pdf")
      if (!file.exists(pdfPath)) {
        appendLog("Compilation error: output.pdf not found.")
        session$sendCustomMessage("toggleCompileSpinner", FALSE)
        return(NULL)
      }

      appendLog("Compilation finished successfully.")
      refreshCompiled()

      updatePdfViewer <- function() {
        ts <- as.numeric(Sys.time())
        pdf_url <- paste0("compiled/output.pdf?t=", ts)
        output$pdfViewUI <- renderUI({
          tags$object(data = pdf_url, type = "application/pdf", style = "width:100%; height:75vh;")
        })
      }

      updatePdfViewer()
      later(updatePdfViewer, 5.0)

      session$sendCustomMessage("toggleCompileSpinner", FALSE)
    }

    observeEvent(input$compile, { compileFunction() })

    observe({
      pdfPath <- file.path(compiledDir, "output.pdf")
      if (file.exists(pdfPath)) {
        output$pdfViewUI <- renderUI({
          tags$object(data = "compiled/output.pdf", type = "application/pdf", style = "width:100%; height:75vh;")
        })
      }
    })

    # Update Ace editor themes when the user changes the theme in the settings panel
    observeEvent(input$editorThemePanel, {
      req(input$editorThemePanel)
      updateAceEditor(session, "sourceEditor", theme = input$editorThemePanel)
      updateAceEditor(session, "dockerConsole", theme = input$editorThemePanel)
      # Persist selected theme to file
      writeLines(input$editorThemePanel, themeFile)
    })

    # Update Ace editors' font size when the user adjusts the font size control in the settings panel
    observeEvent(input$editorFontSizePanel, {
      req(input$editorFontSizePanel)
      updateAceEditor(session, "sourceEditor", fontSize = input$editorFontSizePanel)
      updateAceEditor(session, "dockerConsole", fontSize = input$editorFontSizePanel)
    })

    autoSaveSource <- debounce(reactive(input$sourceEditor), 1000)

    observeEvent(autoSaveSource(), {
      req(currentFile())
      filePath <- file.path(uploadDir, currentFile())
      writeLines(autoSaveSource(), filePath)
      updateStatus(paste0(currentFile(), " auto-saved at ", format(Sys.time(), "%H:%M:%S")))
      showNotification("Changes saved", duration = 1, type = "message")
    }, ignoreInit = TRUE)

    # Enhanced error detection: run detectErrors() on sourceEditor content
    # and merge with any linter (ChkTeX) annotations if available
    observe({
      req(input$sourceEditor)
      baseAnn <- detectErrors(input$sourceEditor)
      chkAnn <- lintAnnotations()
      # Combine base annotations with any existing ChkTeX annotations
      combined <- c(baseAnn, if (!is.null(chkAnn)) chkAnn else list())
      session$sendCustomMessage("setAnnotations", combined)
    })

    # Debounced reactive to trigger ChkTeX linter after user pauses typing
    lintSource <- debounce(reactive(input$sourceEditor), 1000)

    # When lintSource fires, run ChkTeX linter asynchronously
    observeEvent(lintSource(), {
      req(lintSource())
      # Run linter on current code
      runChktexLint(lintSource())
    }, ignoreInit = TRUE)

    observeEvent(compileLog(), { writeLines(compileLog(), compileLogFile) })
    observeEvent(dockerLog(), { writeLines(dockerLog(), dockerLogFile) })
    observeEvent(input$editorTheme, { writeLines(input$editorTheme, themeFile) })
  }