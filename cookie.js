// Function to set a cookie with a specific expiration time
function setCookie(name, value, minutes) {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to check if the "cookieConsent" cookie exists and has expired
function isCookieExpired() {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith('cookieConsent='));
    if (cookie) {
        const expirationTime = new Date(cookie.replace(/(?:(?:^|.*;\s*)cookieConsent\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
        return expirationTime < new Date();
    }
    return false;
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

    // Check if the user has previously accepted or declined cookies and if the consent has expired
    if (!isCookieExpired() && (document.cookie.indexOf("cookieConsent=accepted") !== -1 || document.cookie.indexOf("cookieConsent=declined") !== -1)) {
        cookieBanner.style.display = "none";
    } else {
        showCookieBanner();
    }
});
