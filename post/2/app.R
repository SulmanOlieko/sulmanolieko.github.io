
# Load required libraries and install if not available
required_packages <- c("shiny", "tidyverse", "plotly", "shinydashboard", "shinyjs", "memoise")
install_missing_packages <- function(packages) {
  for (package in packages) {
    if (!requireNamespace(package, quietly = TRUE)) {
      install.packages(package)
    }
  }
}
install_missing_packages(required_packages)
library(shiny)
library(tidyverse)
library(plotly)
library(shinydashboard)
library(shinyjs)
library(memoise)

# UI
ui <- dashboardPage(
  dashboardHeader(
    title = div(
      img(src = "logo.png", height = "30px", style = "margin-right: 10px;"),
      "Sulman Olieko"
    )
  ),
  dashboardSidebar(
    sidebarMenu(
      menuItem("Homepage", tabName = "homepage", icon = icon("home", lib = "font-awesome")),
      menuItem("About Me", tabName = "aboutme", icon = icon("user", lib = "font-awesome")),
      menuItem("Publications", tabName = "publications", icon = icon("book", lib = "font-awesome")),
      menuItem("Contact Me", tabName = "contactme", icon = icon("envelope", lib = "font-awesome")),
      menuItem("Gallery", tabName = "gallery", icon = icon("image", lib = "font-awesome")),
      menuItem("Blog", tabName = "blog", icon = icon("blog", lib = "font-awesome")),
      menuItem("Events", tabName = "events", icon = icon("calendar-alt", lib = "font-awesome")),
      menuItem("Resources", tabName = "resources", icon = icon("file-alt", lib = "font-awesome")),
      
      # Icons for social media handles on the menu bar
      tags$li(
        class = "treeview",
        tags$a(
          href = "https://twitter.com/olieko_sulman",
          target = "_blank",
          class = "sidebar-icon",
          icon("twitter", lib = "font-awesome", class = "fa-lg")
        )
      ),
      tags$li(
        class = "treeview",
        tags$a(
          href = "https://www.linkedin.com/in/olieko-sulman",
          target = "_blank",
          class = "sidebar-icon",
          icon("linkedin", lib = "font-awesome", class = "fa-lg")
        )
      ),
      tags$li(
        class = "treeview",
        tags$a(
          href = "https://github.com/session",
          target = "_blank",
          class = "sidebar-icon",
          icon("github", lib = "font-awesome", class = "fa-lg")
        )
      )
    )
  ),
  dashboardBody(
    useShinyjs(), # Use shinyjs
    tags$head(
      tags$style(
        HTML(
          "
          .info-text {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            text-align: justify;
            line-height: 1.6;
            color: #333333; /* Text color: dark gray */
          }
          .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            height: 50px;
            line-height: 50px;
            text-align: center;
            background-color: #4d4d4d; /* New color: dark gray */
            color: white; /* Text color: white */
          }
          .footer-text {
            font-size: 1.2rem;
          }
          body {
            background-color: #1a1a1a; /* Dark background color */
          }
          
          /* Active and hover state styles for sidebar menu items */
          .sidebar-menu li.active > a {
            background-color: #007bff; /* Slightly blue color for active state */
            color: white;
          }
          .sidebar-menu li:hover > a {
            background-color: #1a1a1a; /* Dark gray color for hover state */
            color: white;
          }
          
          /* Two-column layout */
          .two-column-container {
            display: flex;
            flex-wrap: wrap;
          }
          .left-column {
            flex: 2;
            padding: 20px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .right-column {
            flex: 1;
            padding: 20px;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .hero-image {
            width: 100%;
            max-height: 350px;
            object-fit: cover;
          }
          .cta-button {
            display: block;
            width: 100%;
            max-width: 200px;
            margin: 0 auto;
            margin-bottom: 10px; /* Add space below the button */
            padding: 10px 15px;
            text-align: center;
            background-color: #007bff; /* Change button color to bluish */
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .featured-section {
            margin-top: 40px;
          }
          .featured-content {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .twitter-timeline {
            display: block;
            width: 100%;
            max-width: 500px;
            margin: 10px auto; /* Add space between Twitter feed and button */
          }
          .linkedin-profile {
            display: block;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }
          
          /* Mobile view styles */
          @media screen and (max-width: 767px) {
            .two-column-container {
              flex-direction: column;
            }
          }
          "
        )
      ),
      tags$link(href = "https://use.fontawesome.com/releases/v5.15.3/css/all.css", rel = "stylesheet")
    ),
    tabItems(
      tabItem(
        tabName = "homepage",
        h2("Welcome to the Homepage!"),
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            img(src = "https://drive.google.com/file/d/11w1Z3ZSYa5tRMA4qfBQCx446yiM3uCcY/view?usp=sharing", class = "hero-image", alt = "Hero Image"),
            a("Explore More", href = "#", class = "cta-button"),
            tags$div(style = "height: 30px;"), # Add space between button and featured content
            div(
              class = "featured-section",
              h3("Featured Content"),
              div(
                class = "featured-content",
                HTML("<div class='info-text'>
                      This is the homepage of the Probability of People Sharing the Same Birthday Shiny app.
                      Use the sidebar menu to navigate to different pages.
                      </div>"
                )
              )
            )
          ),
          div(
            class = "right-column",
            tags$a(
              class = "twitter-timeline",
              href = "https://twitter.com/olieko_sulman?ref_src=twsrc%5Etfw",
              "Tweets by olieko_sulman"
            ),
            tags$script(
              async = "TRUE",
              src = "https://platform.twitter.com/widgets.js",
              charset = "utf-8"
            )
          )
        )
      ),
      tabItem(
        tabName = "aboutme",
        h2("About Me"),
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            HTML("<div class='info-text'>
                  Sulman is an upcoming agricultural and environmental economist committed to 
                  leveraging data techniques and research to shape policies and drive the sustainable 
                  transformation of the agri-food sector. He is particularly interested in addressing global 
                  food security challenges by ensuring that no child goes to bed hungry, and that the most 
                  vulnerable populations have physical, economic and social access to safe, quality and nutritious food.
                  Through this passion, he was nominated to lecture a course unit in Food Economics and Policy, 
                  to mentor final-year undergraduates on issues food security, and contemporary issues in the agri-food sector. 
                  Sulman's key expertise lie in the areas of Production economics, Econometrics, Statistics, and Quantitative 
                  methods in agricultural and environmental policy evaluation. He applies diverse skills from these fields in 
                  analyzing food security, agricultural and environmental productivity, efficiency, sustainability, gender 
                  differentials, climate change effects, contingent valuation, and impact evaluation, to derive vital 
                  insights that can inform sound policies in the agri-food sector.
                  </div>"
            )
          ),
          div(
            class = "right-column",
            tags$script(
              src = "https://platform.linkedin.com/badges/js/profile.js",
              async = "TRUE",
              defer = "TRUE",
              type = "text/javascript"
            ),
            div(
              class = "badge-base LI-profile-badge",
              "data-locale" = "en_US",
              "data-size" = "large",
              "data-theme" = "light",
              "data-type" = "VERTICAL",
              "data-vanity" = "olieko-sulman",
              "data-version" = "v1",
              tags$a(
                class = "badge-base__link LI-simple-link",
                href = "https://ke.linkedin.com/in/olieko-sulman?trk=profile-badge",
                "Olieko Sulman"
              )
            )
          )
        )
      ),
      tabItem(
        tabName = "publications",
        h2("Publications"),
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            HTML("<div class='info-text'>
                  Here are some of my recent publications related to data science and statistics:
                  <ul>
                    <li>Publication 1</li>
                    <li>Publication 2</li>
                    <li>Publication 3</li>
                  </ul>
                  </div>"
            )
          ),
          div(
            class = "right-column"
            # Add any additional content for the right column here
          )
        )
      ),
      tabItem(
        tabName = "contactme",
        h2("Contact Me"),
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            HTML("<div class='info-text'>
                  If you have any questions or would like to get in touch, please feel free to contact me at:
                  <br>
                  Email: <a href='mailto:contact@example.com'>contact@example.com</a>
                  <br>
                  Phone: (123) 456-7890
                  </div>"
            )
          ),
          div(
            class = "right-column"
            # Add any additional content for the right column here
          )
        )
      ),
      tabItem(
        tabName = "gallery",
        h2("Gallery"),
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            plotlyOutput("gallery_plot")
          ),
          div(
            class = "right-column"
            # Add any additional content for the right column here
          )
        )
      ),
      tabItem(
        tabName = "blog",
        h2("Blog"),
        # Sample blog posts
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            div(
              class = "blog-post",
              h3("Blog Post 1"),
              HTML("<div class='info-text'>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ac nunc vitae urna vehicula elementum.
                    </div>"
              )
            ),
            div(
              class = "blog-post",
              h3("Blog Post 2"),
              HTML("<div class='info-text'>
                    Fusce ac urna quis ex faucibus hendrerit non nec felis. Ut feugiat, justo sit amet tincidunt
                    bibendum, quam lacus ultrices arcu, a fringilla tellus orci non orci.
                    </div>"
              )
            )
          ),
          div(
            class = "right-column"
            # Add any additional content for the right column here
          )
        )
      ),
      tabItem(
        tabName = "events",
        h2("Events"),
        # Add content for the Events page here
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            # Event Calendar (Example: Date range input)
            dateRangeInput("event_date_range", "Select Event Date Range:", start = Sys.Date(), end = Sys.Date() + 30),
            
            # Event Registration Form (Example: Name, Email, Occupation, City, Country)
            textInput("name_input", "Name:", placeholder = "Enter your name"),
            textInput("email_input", "Email:", placeholder = "Enter your email"),
            textInput("occupation_input", "Occupation:", placeholder = "Enter your occupation"),
            textInput("city_input", "City:", placeholder = "Enter your city"),
            textInput("country_input", "Country:", placeholder = "Enter your country"),
            actionButton("register_button", "Register"),
            
            # Event Details
            h3("Upcoming Events"),
            HTML("<div class='info-text'>
                 <strong>Event 1</strong><br>
                 Date: July 30, 2023 (Editable by admin)<br>
                 Time: 3:00 PM - 5:00 PM<br>
                 Location: Virtual (Zoom)<br>
                 Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                 </div>"),
            
            HTML("<hr>"), # Add a horizontal line to separate events
            
            HTML("<div class='info-text'>
                 <strong>Event 2</strong><br>
                 Date: August 10, 2023 (Editable by admin)<br>
                 Time: 6:00 PM - 8:00 PM<br>
                 Location: Conference Center<br>
                 Description: Fusce ac urna quis ex faucibus hendrerit non nec felis.
                 </div>")
          ),
          div(
            class = "right-column",
            # Event Booking Status
            h3("Event Booking Status"),
            HTML("<div class='info-text'>
                 <strong>Event 1</strong><br>
                 Status: Fully Booked<br>
                 Registered Participants: 50/50<br>
                 </div>"),
            
            HTML("<hr>"), # Add a horizontal line to separate events
            
            HTML("<div class='info-text'>
                 <strong>Event 2</strong><br>
                 Status: Open for Registration<br>
                 Registered Participants: 25/50<br>
                 </div>")
          )
        )
      ),
      tabItem(
        tabName = "resources",
        h2("Resources"),
        # Add content for the Resources page here
        div(
          class = "two-column-container",
          div(
            class = "left-column",
            HTML("<div class='info-text'>
                  Welcome to the Resources page! Here you can find helpful resources and materials.
                  </div>"
            )
          ),
          div(
            class = "right-column"
            # Add any additional content for the right column here
          )
        )
      )
    ),
    div(
      class = "footer",
      div(class = "footer-text", "© 2023 Sulman Olieko")
    )
  )
)

# Server
server <- function(input, output) {
  # Event Registration Functionality
  registered_participants <- reactiveVal(0)
  total_capacity <- 50 # Set the total capacity of the event
  
  observeEvent(input$register_button, {
    if (!is.null(input$name_input) && !is.null(input$email_input) && !is.null(input$occupation_input) &&
        !is.null(input$city_input) && !is.null(input$country_input) && validateEmail(input$email_input)) {
      registered_participants(registered_participants() + 1)
      showModal(
        modalDialog(
          title = "Registration Successful",
          paste("Dear", input$name_input, ", you have successfully registered for the event."),
          footer = modalButton("Close")
        )
      )
      
      if (registered_participants() >= total_capacity) {
        updateInfoText("event_booking_status", "Status: Fully Booked")
        updateInfoText("event_booking_participants", paste("Registered Participants:", total_capacity, "/", total_capacity))
      } else {
        updateInfoText("event_booking_participants", paste("Registered Participants:", registered_participants(), "/", total_capacity))
      }
    } else if (is.null(input$name_input) || is.null(input$email_input) || is.null(input$occupation_input) ||
               is.null(input$city_input) || is.null(input$country_input)) {
      showModal(
        modalDialog(
          title = "Registration Error",
          "Please fill in all the required fields in the registration form.",
          footer = modalButton("Close")
        )
      )
    } else if (!validateEmail(input$email_input)) {
      showModal(
        modalDialog(
          title = "Invalid Email",
          "Please provide a valid email address.",
          footer = modalButton("Close")
        )
      )
    }
  })
  
  # Update Event Booking Status Text
  updateInfoText <- function(element_id, text) {
    jsCode <- sprintf("document.getElementsByClassName('%s')[0].innerText = '%s'", element_id, text)
    runjs(jsCode)
  }
  
  # Gallery Plot
  output$gallery_plot <- renderPlotly({
    # Add code to create the gallery plot here
    # For example, use plot_ly() or ggplot2 functions to create the plot
    # Replace the example plot with your actual gallery plot
    plot_ly(data = iris, x = ~Sepal.Length, y = ~Sepal.Width, color = ~Species, type = "scatter", mode = "markers")
  })
  
  # Function to validate email
  validateEmail <- function(email) {
    # Basic email validation regex pattern
    pattern <- "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    grepl(pattern, email)
  }
}

# Run the Shiny app
shinyApp(ui, server)

