# This file sources the global, UI, and server components of the application
# and runs the Shiny app.

source("global.R")
source("ui.R")
source("server.R")

shinyApp(ui = ui, server = server)