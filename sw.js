const CACHE_NAME = "karting-app-cache-v1";
const ASSETS_TO_CACHE = [
  "SKart/index.html",
  "SKart/style.css",
  "SKart/script.js",
  "SKart/site.webmanifest",
  "SKart/web-app-manifest-192x192.png",
  "SKart/web-app-manifest-512x512.png"
];

// Événement d'installation
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installation en cours...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Mise en cache des fichiers");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Événement d'activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activation...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Suppression de l'ancien cache", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Interception de", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
