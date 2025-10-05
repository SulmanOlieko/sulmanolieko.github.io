// ==============================================================================
//                        LaTeXeR - Theme Manager
// ==============================================================================
// This script handles the logic for toggling between light and dark themes
// and persisting the user's choice using localStorage.
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme_toggle');
  const body = document.body;
  const themeIcon = themeToggleBtn.querySelector('i'); // Get the icon element

  // Function to apply the saved theme on load
  const applySavedTheme = () => {
    const savedTheme = localStorage.getItem('latexer-theme');
    if (savedTheme === 'dark') {
      body.classList.add('dark');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      body.classList.remove('dark');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  };

  // Function to toggle the theme
  const toggleTheme = () => {
    body.classList.toggle('dark');
    // Save the new theme preference to localStorage
    if (body.classList.contains('dark')) {
      localStorage.setItem('latexer-theme', 'dark');
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      localStorage.setItem('latexer-theme', 'light');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  };

  // Apply the theme when the page loads
  applySavedTheme();

  // Add click event listener to the toggle button
  themeToggleBtn.addEventListener('click', toggleTheme);
});