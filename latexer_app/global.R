# ==============================================================================
#                      LaTeXeR - Global Configuration
# ==============================================================================
# This file is loaded once when the application starts. It contains all the
# libraries, global variables, and helper functions that are shared between
# the ui.R and server.R files.
# ==============================================================================

# ----------------------------------
#         LIBRARY IMPORTS
# ----------------------------------
# Load all necessary libraries for the application to run.
library(shiny)
library(shinyAce)
library(processx)
library(later)
library(jsonlite)

# ----------------------------------
#        GLOBAL OPTIONS
# ----------------------------------
# Set global options for the Shiny application, such as the maximum file
# upload size.
options(shiny.maxRequestSize = 100 * 1024^2) # 100MB max upload size

# ----------------------------------
#       DIRECTORY PATHS
# ----------------------------------
# Define the directory paths for storing user-uploaded project files and
# the compiled output files.
uploadDir <- "uploads"
compiledDir <- "compiled"

# Create directories if they don't exist to avoid errors on startup.
for (d in c(uploadDir, compiledDir)) {
  if (!dir.exists(d)) {
    dir.create(d, recursive = TRUE)
  }
}

# ----------------------------------
#        FILE EXTENSIONS
# ----------------------------------
# A vector of file extensions that are considered editable text files. This
# determines which files can be opened in the Ace editor.
text_extensions <- c("tex", "bib", "bst", "cls", "cfg", "sty", "txt", "rnw")

# ----------------------------------
#        HELPER FUNCTIONS
# ----------------------------------
# getFileIcon(): Returns an appropriate Font Awesome icon based on the file
# extension. This function is used in the UI to visually represent different
# file types.
#
# detectErrors(): A function to perform basic real-time error checking on LaTeX
# code. It looks for common issues like unbalanced delimiters and environments.
# ==============================================================================

getFileIcon <- function(filename) {
  ext <- tolower(tools::file_ext(filename))
  if (ext == "tex") return(icon("file-code"))
  if (ext == "bib") return(icon("book"))
  if (ext %in% c("png", "jpg", "jpeg", "gif", "svg")) return(icon("file-image"))
  if (ext == "pdf") return(icon("file-pdf"))
  if (ext %in% c("zip", "rar", "7z")) return(icon("file-archive"))
  return(icon("file"))
}

detectErrors <- function(code) {
  lines <- unlist(strsplit(code, "\n"))
  annotations <- list()

  # Check for unbalanced curly braces
  for (i in seq_along(lines)) {
    line <- lines[i]
    open_count <- length(gregexpr("\\{", line)[[1]])
    close_count <- length(gregexpr("\\}", line)[[1]])
    if (open_count != close_count) {
      annotations[[length(annotations) + 1]] <- list(
        row = i - 1, column = 0,
        text = paste("Unbalanced curly braces: { =", open_count, ", } =", close_count),
        type = "error"
      )
    }
  }

  # Check for unmatched LaTeX environments
  env_stack <- list()
  for (i in seq_along(lines)) {
    line <- lines[i]
    # Find all \begin{...}
    begins <- gregexpr("\\\\begin\\{([^}]+)\\}", line, perl = TRUE)
    if (begins[[1]][1] != -1) {
      matches <- regmatches(line, begins)[[1]]
      for (match in matches) {
        env <- sub("\\\\begin\\{([^}]+)\\}", "\\1", match)
        env_stack[[length(env_stack) + 1]] <- list(env = env, line = i)
      }
    }
    # Find all \end{...}
    ends <- gregexpr("\\\\end\\{([^}]+)\\}", line, perl = TRUE)
    if (ends[[1]][1] != -1) {
      matches <- regmatches(line, ends)[[1]]
      for (match in matches) {
        env <- sub("\\\\end\\{([^}]+)\\}", "\\1", match)
        if (length(env_stack) > 0 && env_stack[[length(env_stack)]]$env == env) {
          env_stack <- env_stack[-length(env_stack)]
        } else {
          annotations[[length(annotations) + 1]] <- list(
            row = i - 1, column = 0,
            text = paste("Unmatched \\end{", env, "}"),
            type = "error"
          )
        }
      }
    }
  }

  # Annotate any unclosed environments
  for (e in env_stack) {
    annotations[[length(annotations) + 1]] <- list(
      row = e$line - 1, column = 0,
      text = paste("Unclosed environment:", e$env),
      type = "error"
    )
  }

  return(annotations)
}