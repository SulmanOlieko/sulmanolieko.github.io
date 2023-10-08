// Function to check if the "cookieConsent" cookie exists
function checkCookie() {
    return document.cookie.split('; ').some((item) => item.startsWith('cookieConsent='));
}

// Function to set a cookie with a specific expiration time
function setCookie(name, value, minutes) {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

document.addEventListener("DOMContentLoaded", function () {
    const cookieBanner = document.getElementById("cookie-banner");
    const acceptCookies = document.getElementById("accept-cookies");
    const declineCookies = document.getElementById("decline-cookies");

    // Function to display the cookie banner
    function showCookieBanner() {
        cookieBanner.style.display = "block";
    }

    acceptCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "accepted", 7 * 24 * 60); // Cookie consent accepted for 7 days
    });

    declineCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "declined", 60); // Cookie consent declined for 1 hour
    });

    // Check if the user has previously accepted or declined cookies
    if (!checkCookie()) {
        showCookieBanner();
    } else if (document.cookie.indexOf("cookieConsent=declined") !== -1) {
        // If the user previously declined cookies, and it's been more than 1 hour, show the banner again.
        const now = new Date().getTime();
        const lastDeclineTime = new Date(document.cookie.replace(/(?:(?:^|.*;\s*)lastDeclineTime\s*\=\s*([^;]*).*$)|^.*$/, "$1")).getTime();
        if (now - lastDeclineTime >= 60 * 60 * 1000) {
            showCookieBanner();
        }
    }
});
