var CACHE_NAME = "latexer-cache-v1";
var urlsToCache = [
  "/latexer/",
  "/latexer/index.html",
  "/latexer/style.css",
  "/latexer/script.js",
  "/latexer/manifest.json",
  "https://unpkg.com/split.js/dist/split.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js",
  "https://raw.githubusercontent.com/SulmanOlieko/sulmanolieko.github.io/main/img/ekonly-logo.svg"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
    })
  );
});
