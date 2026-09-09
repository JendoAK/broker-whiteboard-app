const CACHE_NAME = "foodbrokerbase-contactdelete1";
const APP_SHELL = [
  "./contacts-layout.css?v=20260909-contactdelete1",
  "./people-contacts.js?v=20260909-contactdelete1",
  "./",
  "./index.html",
  "./styles.css?v=20260909-kitchencolors1",
  "./market-events.js?v=20260909-visitcolors1",
  "./personal-visit-calendar.js?v=20260909-visitcolors1",
  "./calendar-holidays.js?v=20260909-5",
  "./market-call-editor.js?v=20260909-visitcolors1",
  "./team-work-view.js?v=20260909-roles1", "./app.js?v=20260909-contactdelete1",
  "./market-week-calendar.js?v=20260909-visitcolors1",
  "./market-operator-conversion.js?v=20260909-visitcolors1",
  "./testkitchen-layout.js?v=20260909-kitchencolors1",
  "./vendor-visit-print.js?v=20260909-visitcolors1",
  "./market-visit-layout.js?v=20260909-visitcolors1",
  "./supabase-config.js",
  "./supabase-auth.js?v=20260909-access1",
  "./manifest.webmanifest",
  "./broker-whiteboard-logo.png",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./linford-logo.svg",
  "./sysco-logo.svg",
  "./vendor-logos/pierce-cartwright.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
