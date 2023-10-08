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
        cookieBanner.style display = "none";
        setCookie("cookieConsent", "accepted", 30 * 24 * 60); // Cookie consent accepted for 30 days
    });

    declineCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "declined", 24 * 60); // Cookie consent declined for 24 hours
    });

    // Check if the user has previously accepted or declined cookies and if the consent has expired
    if (!checkCookie()) {
        showCookieBanner();
    } else if (document.cookie.indexOf("cookieConsent=declined") !== -1) {
        // If the user previously declined cookies, and it's been more than 24 hours, show the banner again.
        const now = new Date().getTime();
        const lastDeclineTime = new Date(document.cookie.replace(/(?:(?:^|.*;\s*)lastDeclineTime\s*\=\s*([^;]*).*$)|^.*$/, "$1")).getTime();
        if (now - lastDeclineTime >= 24 * 60 * 60 * 1000) {
            showCookieBanner();
        }
    }
});
