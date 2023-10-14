const cookieBox = document.querySelector(".wrapper"),
  buttons = document.querySelectorAll(".button");

const executeCodes = () => {
  // Check if the user has already accepted the cookie
  if (document.cookie.includes("cookieBy=codinglab")) {
    cookieBox.style.display = "none"; // Hide the cookie box
    return;
  }

  cookieBox.style.display = "block"; // Display the cookie box if it wasn't accepted

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Hide the cookie box when the user accepts the cookie
      cookieBox.style.display = "none";

      //if button has acceptBtn id
      if (button.id == "acceptBtn") {
        // Set cookies for 1 month. 60 = 1 min, 60 = 1 hour, 24 = 1 day, 30 = 30 days
        document.cookie = "cookieBy=codinglab; max-age=" + 60 * 60 * 24 * 30;
      }
    });
  });
};

// Execute the code when the page is loaded
window.addEventListener("load", executeCodes);
