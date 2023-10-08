// Function to check if the "cookieConsent" cookie exists
function checkCookie() {
    return document.cookie.split('; ').some((item) => item.startsWith('cookieConsent='));
}

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

document.addEventListener("DOMContentLoaded", function () {
    const cookieBanner = document.getElementById("cookie-banner");
    const acceptCookies = document.getElementById("accept-cookies");
    const declineCookies = document.getElementById("decline-cookies");

    acceptCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "accepted", 7); // Cookie consent accepted for 7 days
    });

    declineCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "declined", 7); // Cookie consent declined for 7 days
    });

    // Check if the user has previously accepted or declined cookies or if they have cleared their cookies
    if (!checkCookie()) {
        cookieBanner.style.display = "block";
    }
});
