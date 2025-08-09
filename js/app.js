if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered!');
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

window.dataLayer = window.dataLayer || [];
function gtag() {
    dataLayer.push(arguments);
}
function trackOutboundLink(url) {
  gtag('event', 'click', {
       'event_category': 'outbound',
       'event_label': url,
       'transport_type': 'beacon',
       'event_callback': function () {
         document.location = url;
       }
  });
  console.debug("Outbound link clicked: " + url);
}
function onClickCallback(event) {
  if ((event.target.tagName !== 'A') || (event.target.host === window.location.host)) {
    return;
  }
  trackOutboundLink(event.target);
}
gtag('js', new Date());
gtag('config', 'GTM-MDK8S5X2', {});
document.addEventListener('click', onClickCallback, false);

document.addEventListener("DOMContentLoaded", function() {
    const searchForm = document.getElementById("search-box");
    const searchInput = document.getElementById("search-query");
    const searchHits = document.getElementById("search-hits");
    const searchSection = document.getElementById("search");
    const closeSearchBtn = document.querySelector(".js-search");

    // Function to perform search
    function performSearch(query) {
        const results = [
            { title: "Search Result 1", url: "result1.html" },
            { title: "Search Result 2", url: "result2.html" },
            { title: "Search Result 3", url: "result3.html" }
        ];

        displaySearchResults(results);
    }

    // Function to display search results
    function displaySearchResults(results) {
        searchHits.innerHTML = "";
        if (results.length === 0) {
            searchHits.innerHTML = "<p>No results found.</p>";
        } else {
            results.forEach(function(result) {
                const resultItem = document.createElement("div");
                resultItem.innerHTML = `<a href="${result.url}">${result.title}</a>`;
                searchHits.appendChild(resultItem);
            });
        }
    }

    // Event listener for search form submission
    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (query !== "") {
            performSearch(query);
        }
    });

    // Event listener to close search section
    closeSearchBtn.addEventListener("click", function(event) {
        event.preventDefault();
        searchSection.classList.remove("open");
    });
});

const config = {
  documentId: 'ad5db8cf-cccc-4826-b382-849c2bab3c02',
  darkMode: false,
  themeColor:"#795548",
  appBarColored:true,
  disableToolbar:false,
  disableElements:[]
};
CloudPDF(config, document.getElementById('viewer')).then((instance) => {

});

window.__plumX.widgets.init();

window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  event.preventDefault();
  // Stash the event so it can be triggered later
  window.deferredPrompt = event;
  // Show the install popup
  document.getElementById('installPopup').classList.add('show');
});

// Handle the install button click
document.getElementById('installButton').addEventListener('click', () => {
  const deferredPrompt = window.deferredPrompt;
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          // Reset the deferred prompt variable
          window.deferredPrompt = null;
          // Hide the install popup
          document.getElementById('installPopup').classList.remove('show');
        } else {
          console.log('User dismissed the install prompt');
        }
      });
  }
});

(function(d, t) {
        var g = d.createElement(t),
        s = d.getElementsByTagName(t)[0];
        g.src = "https://cdn.pushalert.co/integrate_90d37d1c064f80a89c562983e6ab05eb.js";
        s.parentNode.insertBefore(g, s);
}(document, "script"));

const code_highlighting = true;
const search_config = {"indexURI":"/index.json","minLength":1,"threshold":0.3};
const i18n = {"no_results":"No results found","placeholder":"Search...","results":"results found"};
const content_type = {
  'post': "Posts",
  'project': "Projects",
  'publication' : "Publications",
  'talk' : "Talks"
  };

// Import Firebase app and auth modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCmsR_JUmxQkUDU0qStBhFr5-AkuuNfoI8",
  authDomain: "sulmanolieko-35fd6.firebaseapp.com",
  projectId: "sulmanolieko-35fd6",
  storageBucket: "sulmanolieko-35fd6.firebasestorage.app",
  messagingSenderId: "765226130762",
  appId: "1:765226130762:web:f6e87c0ab5f4e27631b5b3"
};

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

// Listen for auth state changes
onAuthStateChanged(auth, user => {
  const accountSection = document.getElementById('account-section');
  if (user) {
    // Use displayName if available; otherwise, fallback to email
    const displayName = user.displayName || user.email;
    // Get the first two letters in uppercase
    const initials = displayName.substring(0, 2).toUpperCase();
    accountSection.innerHTML = `
    <a href="#" id="logout-btn" style="color: #FFF; text-decoration: none;">
      <span class="account-initials" style="
        display: inline-block;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: #fff;
        text-align: center;
        font-weight: bold;
      ">
      <i class="fas fa-sign-out-alt"></i>
      </span>
      </a>
      <i class="fas fa-user" style="color:#FFF"></i>
    `;
    document.getElementById('logout-btn').addEventListener('click', e => {
      e.preventDefault();
      signOut(auth).then(() => {
        // Redirect to login page after sign out
        window.location.href = '/login/index.html';
      }).catch(error => {
        console.error("Sign out error:", error);
      });
    });
  } else {
    // If no user is signed in, show a user icon linking to the login page
    accountSection.innerHTML = `
      <a class="nav-item nav-link" href="/login/index.html" style="color: #FFF; text-decoration: none;">
        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
      </a>
    `;
  }
});

// Scroll to top behavior
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Dynamic year
document.getElementById('dynamicYear').textContent = new Date().getFullYear();

// Newsletter subscription with better validation
function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  const errorMsg = document.getElementById('newsletterError');
  const email = emailInput.value.trim();

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errorMsg.textContent = 'Please enter your email address.';
    errorMsg.style.display = 'block';
    return;
  } else if (!emailRegex.test(email)) {
    errorMsg.textContent = 'Please enter a valid email address.';
    errorMsg.style.display = 'block';
    return;
  }

  // No errors => proceed
  errorMsg.style.display = 'none';
  alert(`Thanks for subscribing, ${email}!`);

  // Reset the input (optional)
  emailInput.value = '';
}

// Toggle the navigation drawer on button click
const toggleButton = document.getElementById('nav-toggle');
const navDrawer = document.getElementById('nav-drawer');

toggleButton.addEventListener('click', () => {
  navDrawer.classList.toggle('open');
  // Update ARIA state for accessibility
  const isOpen = navDrawer.classList.contains('open');
  navDrawer.setAttribute('aria-hidden', !isOpen);
});

// Close the drawer when a navigation link is clicked
document.querySelectorAll('#nav-drawer .nav-link').forEach(link => {
  link.addEventListener('click', (event) => {
    navDrawer.classList.remove('open');
    navDrawer.setAttribute('aria-hidden', 'true');
    // Smooth scrolling to section
    event.preventDefault();
    document.querySelector(link.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.read-more-container').forEach(container => {
    const toggle = container.previousElementSibling;
    const label = container.querySelector('.read-more-trigger');
    // sync aria and toggle
    toggle.addEventListener('change', () => {
      label.setAttribute('aria-expanded', toggle.checked);
      offcanvas.setAttribute('aria-hidden', !toggle.checked);
    });
    closeBtn.addEventListener('click', () => {
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change'));
    });
  });
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmsR_JUmxQkUDU0qStBhFr5-AkuuNfoI8",
  authDomain: "sulmanolieko-35fd6.firebaseapp.com",
  projectId: "sulmanolieko-35fd6",
  storageBucket: "sulmanolieko-35fd6.firebasestorage.app",
  messagingSenderId: "765226130762",
  appId: "1:765226130762:web:f6e87c0ab5f4e27631b5b3"
};

const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateLogin() {
  let isValid = true;
  const emailField = document.getElementById('login-username');
  const passwordField = document.getElementById('login-password');
  if (!emailField.value.trim()) {
    document.getElementById('login-username-error').style.display = 'block';
    isValid = false;
  } else {
    document.getElementById('login-username-error').style.display = 'none';
  }
  if (!passwordField.value.trim()) {
    document.getElementById('login-password-error').style.display = 'block';
    isValid = false;
  } else {
    document.getElementById('login-password-error').style.display = 'none';
  }
  return isValid;
}

function validateSignup() {
  let isValid = true;
  const usernameField = document.getElementById('signup-username');
  const emailField = document.getElementById('signup-email');
  const passwordField = document.getElementById('signup-password');
  if (!usernameField.value.trim()) {
    document.getElementById('signup-username-error').style.display = 'block';
    isValid = false;
  } else {
    document.getElementById('signup-username-error').style.display = 'none';
  }
  if (!emailField.value.trim() || !validateEmail(emailField.value.trim())) {
    document.getElementById('signup-email-error').style.display = 'block';
    isValid = false;
  } else {
    document.getElementById('signup-email-error').style.display = 'none';
  }
  if (!passwordField.value.trim()) {
    document.getElementById('signup-password-error').style.display = 'block';
    isValid = false;
  } else {
    document.getElementById('signup-password-error').style.display = 'none';
  }
  return isValid;
}

document.querySelectorAll('.toggle-password').forEach(toggle => {
  toggle.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    const passwordInput = document.getElementById(targetId);
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      this.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = 'password';
      this.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });
});

function toggleForm() {
  const loginContainer = document.getElementById('login-container');
  const signupContainer = document.getElementById('signup-container');
  if (window.getComputedStyle(loginContainer).display !== 'none') {
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'block';
  } else {
    loginContainer.style.display = 'block';
    signupContainer.style.display = 'none';
  }
}
window.toggleForm = toggleForm;

window.addEventListener('DOMContentLoaded', () => {
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    document.getElementById('login-username').value = rememberedEmail;
    document.getElementById('remember-me').checked = true;
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (validateLogin()) {
    const email = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
      if (document.getElementById('remember-me').checked) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      window.location.href = "https://sulmanolieko.github.io/index.html";
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (validateSignup()) {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signup successful!');
      window.location.href = "https://sulmanolieko.github.io/login/index.html";
    } catch (error) {
      alert('Signup failed: ' + error.message);
    }
  }
});

document.querySelectorAll('.google-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert('Google login successful!');
      window.location.href = "https://sulmanolieko.github.io/index.html";
    } catch (error) {
      alert('Google login failed: ' + error.message);
    }
  });
});

document.querySelectorAll('.github-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert('GitHub login successful!');
      window.location.href = "https://sulmanolieko.github.io/index.html";
    } catch (error) {
      alert('GitHub login failed: ' + error.message);
    }
  });
});

document.getElementById('forgot-password').addEventListener('click', async () => {
  const email = prompt('Please enter your email for password reset:');
  if (email) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
    } catch (error) {
      alert('Password reset failed: ' + error.message);
    }
  }
});

document.getElementById('login-username').addEventListener('input', () => {
  document.getElementById('login-username-error').style.display = 'none';
});
document.getElementById('login-password').addEventListener('input', () => {
  document.getElementById('login-password-error').style.display = 'none';
});
document.getElementById('signup-username').addEventListener('input', () => {
  document.getElementById('signup-username-error').style.display = 'none';
});
document.getElementById('signup-email').addEventListener('input', () => {
  document.getElementById('signup-email-error').style.display = 'none';
});
document.getElementById('signup-password').addEventListener('input', () => {
  document.getElementById('signup-password-error').style.display = 'none';
});

(function () {
  'use strict';

  const copyButtonTimeout = 2000;

  document.querySelectorAll('pre:has(code)').forEach(codeBlock => {
    if (!navigator.clipboard) return;

    const container = codeBlock.closest('pre');
    if (!container || container.querySelector('.copy-button')) return;

    container.classList.add('code-container');

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.type = 'button';
    // Use an inline SVG for the copy icon and include a screen-reader only label.
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,21H8C6.9,21,6,20.1,6,19V7H8V19H19V21ZM16,3H5C3.9,3,3,3.9,3,5V17H5V5H16V3Z"/>
      </svg>
      <span class="sr-only">Copy code to clipboard</span>
    `;

    button.addEventListener('click', async () => {
      try {
        const code = container.querySelector('code').textContent;
        await navigator.clipboard.writeText(code);

        button.classList.add('copy-button--success');
        // Optionally update the sr-only text for confirmation.
        button.querySelector('.sr-only').textContent = 'Copied!';

        setTimeout(() => {
          button.classList.remove('copy-button--success');
          button.querySelector('.sr-only').textContent = 'Copy code to clipboard';
        }, copyButtonTimeout);
      } catch (err) {
        button.querySelector('.sr-only').textContent = 'Error copying';
        console.error('Failed to copy!', err);
      }
    });

    container.prepend(button);
    container.setAttribute('tabindex', '0');
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  // 1. Gather publication data from the container
  const pubContainer = document.getElementById('container-publications');
  const publicationElements = pubContainer.querySelectorAll('.isotope-item');

  // Mapping of publication type classes to human-readable names
  const typeMapping = {
    'pubtype-1': 'Journal article',
    'pubtype-2': 'Conference paper',
    'pubtype-3': 'Preprint',
    'pubtype-4': 'Working paper',
    'pubtype-5': 'Report',
    'pubtype-6': 'Poster',
    'pubtype-7': 'Others'
  };

  // Object to store counts per year and type, e.g. { "2024": { "Journal article": 2, "Poster": 1 } }
  const dataByYear = {};

  publicationElements.forEach(el => {
    // Get the classes from the element
    const classes = el.className.split(' ');
    // Extract all classes that begin with "year-"
    const years = classes.filter(cls => cls.startsWith('year-'))
                         .map(cls => cls.replace('year-', ''));
    // Extract all classes that begin with "pubtype-"
    const types = classes.filter(cls => cls.startsWith('pubtype-'));
    // For each year the publication belongs to...
    years.forEach(year => {
      if (!dataByYear[year]) {
        dataByYear[year] = {};
      }
      // For each type this publication belongs to...
      types.forEach(typeCls => {
        const typeName = typeMapping[typeCls] || typeCls;
        if (!dataByYear[year][typeName]) {
          dataByYear[year][typeName] = 0;
        }
        dataByYear[year][typeName] += 1;
      });
    });
  });

  // 2. Sort years (x-axis labels)
  const yearsSorted = Object.keys(dataByYear).sort();

  // 3. Determine all publication types used across years
  const allTypes = new Set();
  yearsSorted.forEach(year => {
    Object.keys(dataByYear[year]).forEach(typeName => {
      allTypes.add(typeName);
    });
  });
  const allTypesArr = Array.from(allTypes);

  // 4. Prepare Chart.js datasets. For each type, create an array of counts per year.
  const colors = {
    'Journal article': 'rgba(75, 192, 192, 0.7)',
    'Conference paper': 'rgba(54, 162, 235, 0.7)',
    'Preprint': 'rgba(255, 206, 86, 0.7)',
    'Working paper': 'rgba(153, 102, 255, 0.7)',
    'Report': 'rgba(255, 159, 64, 0.7)',
    'Poster': 'rgba(255, 99, 132, 0.7)',
    'Others': 'rgba(201, 203, 207, 0.7)'
  };

  const datasets = allTypesArr.map(typeName => {
    const counts = yearsSorted.map(year => dataByYear[year][typeName] || 0);
    return {
      label: typeName,
      data: counts,
      backgroundColor: colors[typeName] || 'rgba(0,0,0,0.7)',
      borderColor: (colors[typeName] || 'rgba(0,0,0,0.7)').replace('0.7', '1'),
      borderWidth: 1
    };
  });

  // 5. Create a stacked bar chart using Chart.js with responsive and interactive options
  const ctx = document.getElementById('economicsChart').getContext('2d');
  const publicationsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: yearsSorted,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          position: 'top',
        }
      },
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Year'
          },
          ticks: {
            // Optionally reduce font size on mobile devices
            font: {
              size: window.innerWidth < 600 ? 10 : 12
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Publications'
          },
          ticks: {
            font: {
              size: window.innerWidth < 600 ? 10 : 12
            }
          }
        }
      },
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const firstPoint = elements[0];
          const clickedYear = publicationsChart.data.labels[firstPoint.index];
          const clickedType = publicationsChart.data.datasets[firstPoint.datasetIndex].label;
          console.log(`Clicked on ${clickedType} for the year ${clickedYear}`);
          // Additional interactivity (e.g., filtering the publication list) can be added here.
        }
      }
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  // Select all publication elements from the container.
  const pubContainer = document.getElementById('container-publications');
  const publicationElements = pubContainer.querySelectorAll('.isotope-item');

  // Objects to store totals per year.
  // publicationCounts: { "2023": 3, "2024": 5, ... }
  // citationCounts: { "2023": 0, "2024": 0, "2025": 1, ... }
  const publicationCounts = {};
  const citationCounts = {};

  publicationElements.forEach(el => {
    // Extract all classes that start with "year-"
    const classes = el.className.split(' ');
    const yearClasses = classes.filter(cls => cls.startsWith('year-'));

    // Get citation count from the element's data attribute (default to 0 if missing)
    const citations = parseInt(el.getAttribute('data-citations')) || 0;

    yearClasses.forEach(cls => {
      const year = cls.replace('year-', '');
      // Increase publication count for this year
      if (!publicationCounts[year]) {
        publicationCounts[year] = 0;
      }
      publicationCounts[year] += 1;

      // Add citations for this year
      if (!citationCounts[year]) {
        citationCounts[year] = 0;
      }
      citationCounts[year] += citations;
    });
  });

  // Get a sorted array of years (x-axis labels).
  const yearsSorted = Object.keys(publicationCounts).sort();

  // Create arrays for total publications and total citations per year.
  const pubData = yearsSorted.map(year => publicationCounts[year] || 0);
  const citData = yearsSorted.map(year => citationCounts[year] || 0);

  // Create a mixed chart using Chart.js.
  const ctx = document.getElementById('combinedChart').getContext('2d');
  const combinedChart = new Chart(ctx, {
    data: {
      labels: yearsSorted,
      datasets: [
        {
          type: 'line',
          label: 'Total Publications',
          data: pubData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.4,  // Smooth the line
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Total Citations',
          data: citData,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          position: 'top',
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Year'
          },
          ticks: {
            font: {
              size: window.innerWidth < 600 ? 10 : 12
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Publications'
          },
          ticks: {
            font: {
              size: window.innerWidth < 600 ? 10 : 12
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Total Citations'
          },
          grid: {
            drawOnChartArea: false  // Prevent duplicate grid lines
          },
          ticks: {
            font: {
              size: window.innerWidth < 600 ? 10 : 12
            }
          }
        }
      },
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const firstPoint = elements[0];
          const clickedYear = combinedChart.data.labels[firstPoint.index];
          let clickedType = '';
          // Check which dataset was clicked.
          if (combinedChart.data.datasets[firstPoint.datasetIndex].type === 'line') {
            clickedType = 'Publications';
          } else {
            clickedType = 'Citations';
          }
          console.log(`Clicked on ${clickedType} for the year ${clickedYear}`);
          // Additional interactivity (e.g., filtering the publication list) can be implemented here.
        }
      }
    }
  });
});
