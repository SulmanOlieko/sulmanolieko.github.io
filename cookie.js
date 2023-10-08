// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

document.addEventListener("DOMContentLoaded", function () {
    const cookieBanner = document.getElementById("cookie-banner10");
    const acceptCookies = document.getElementById("accept-cookies");
    const declineCookies = document.getElementById("decline-cookies");

    acceptCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "accepted", 365); // Cookie consent accepted for 1 year
    });

    declineCookies.addEventListener("click", function () {
        cookieBanner.style.display = "none";
        setCookie("cookieConsent", "declined", 365); // Cookie consent declined for 1 year
    });

    // Check if the user has previously accepted or declined cookies
    if (document.cookie.indexOf("cookieConsent") === -1) {
        cookieBanner.style.display = "block";
    }
});
