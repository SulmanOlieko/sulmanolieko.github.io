
# Load required libraries
if (!requireNamespace("shiny", quietly = TRUE)) {
  install.packages("shiny")
}
if (!requireNamespace("tidyverse", quietly = TRUE)) {
  install.packages("tidyverse")
}
if (!requireNamespace("plotly", quietly = TRUE)) {
  install.packages("plotly")
}
if (!requireNamespace("shinyjs", quietly = TRUE)) {
  install.packages("shinyjs")
}
if (!requireNamespace("memoise", quietly = TRUE)) {
  install.packages("memoise")
}
library(shiny)
library(tidyverse)
library(plotly)
library(shinyjs)
library(memoise)

# UI
ui <- fluidPage(
  useShinyjs(), # Use shinyjs
  tags$head(
    tags$style(
      HTML(
        "
        .info-text {
          font-size: 16px;
          margin-bottom: 20px;
          text-align: justify;
          line-height: 1.6;
        }
        "
      )
    )
  ),
  titlePanel("Probability of People Sharing the Same Birthday"),
  sidebarLayout(
    sidebarPanel(
      numericInput("n_input", "Number of people in the room:", value = 100),
      numericInput("birthday_input", "Number of people with same birthday:", value = 2),
      numericInput("a_input", "Number of replications from:", value = 1),
      numericInput("b_input", "Number of replications to:", value = 1000),
      radioButtons("color_input", "Select plot color:",
                   choices = c("Blue", "Red", "Green", "Yellow", "Black"),
                   selected = "Blue"),
      selectInput("plot_type_input", "Select plot type:",
                  choices = c("Line", "Bar", "Point"),
                  selected = "Line")
    ),
    mainPanel(
      HTML("<div class='info-text'>
            In a room, there exists a group of individuals, denoted by <strong>n</strong>. 
            We make the assumption that every person's birthday is equally likely to occur on any 
            of the 365 days of the year, excluding February 29. Additionally, we consider the birthdays of 
            people to be independent, implying that there are no twins present in the room. 
            What is the probability that two or more 
            people in the group have the same birthday?
            </div>"
      ),
      plotlyOutput("birthday_plot")
    )
  )
)

# Server
server <- function(input, output) {
  
  # Reactive data for main_data
  compute_main_data <- function(n, birthday, a, b) {
    if (!is.numeric(n) || !is.numeric(birthday) || !is.numeric(a) || !is.numeric(b) ||
        n <= 0 || birthday <= 0 || a < 0 || b < 0 || a > b) {
      # Return an empty tibble if the inputs are invalid
      return(tibble(persons = numeric(0), probability = numeric(0)))
    }
    
    crossing(persons = seq(birthday, n, birthday),
             a:b) |>
      mutate(birthday = map(persons, ~ sample(365, ., replace = TRUE)),
             duplicates = map_lgl(birthday, ~ any(duplicated(.)))) |>
      group_by(persons) |>
      summarize(probability = mean(duplicates))
  }
  
  cached_main_data <- memoise(compute_main_data)
  
  reactive_data <- reactive({
    n <- input$n_input
    birthday <- input$birthday_input
    a <- input$a_input
    b <- input$b_input
    
    main_data <- cached_main_data(n, birthday, a, b)
    
    plot_color <- switch(tolower(input$color_input),
                         "blue" = "blue",
                         "red" = "red",
                         "green" = "green",
                         "yellow" = "yellow",
                         "black" = "black",
                         "blue") # Default to blue if an invalid color is selected
    
    list(data = main_data, color = plot_color, type = input$plot_type_input)
  })
  
  output$birthday_plot <- renderPlotly({
    reactive_data <- reactive_data()
    main_data <- reactive_data$data
    plot_color <- reactive_data$color
    plot_type <- reactive_data$type
    
    if (plot_type == "Line") {
      p <- plot_ly(data = main_data, x = ~persons, y = ~probability, type = 'scatter', mode = 'lines') %>%
        add_trace(line = list(color = plot_color, width = 2))
    } else if (plot_type == "Bar") {
      p <- plot_ly(data = main_data, x = ~persons, y = ~probability, type = 'bar', marker = list(color = plot_color))
    } else if (plot_type == "Point") {
      p <- plot_ly(data = main_data, x = ~persons, y = ~probability, type = 'scatter', mode = "markers", marker = list(color = plot_color, size = 10))
    }
    
    p %>%
      layout(
        xaxis = list(title = "Number of people in the room"),
        yaxis = list(title = "Probability n people have the same birthday"),
        showlegend = FALSE,
        margin = list(l = 50, r = 20, b = 50, t = 30),
        plot_bgcolor = "#f9f9f9",
        paper_bgcolor = "#f9f9f9"
      )
  })
}

# Run the Shiny app
shinyApp(ui, server)

