const CACHE_NAME = "foodbrokerbase-settings1";
const APP_SHELL = ["./settings-menu.css?v=20261023-settings1","./settings-menu.js?v=20261023-settings1","./product-support.html","./product-support.js?v=20261023-support1","./product-support.css?v=20261023-support1","./workspace-preferences.js?v=20261022-workspace1","./workspace-preferences.css?v=20261022-workspace1","./visit-panels.css?v=20261022-visitpanels1","./us-foods-logo.svg","./operator-products.css?v=20261022-operatorcompact1","./product-catalog.js?v=20261022-nestle1","./event-products.css?v=20261022-eventease1", "./save-status.js?v=20261022-savestatus1", "./save-status.css?v=20261022-savestatus1", "./event-agenda.js?v=20261022-eventease1","./event-agenda.css?v=20261022-compactfilters1","./window-layout.css?v=20260930-windows1","./table-planner.js?v=20260930-planner14","./table-planner.css?v=20260930-planner14","./table-planner.html?v=20260930-planner14","./editing-stability.js?v=20260930-planner14","./foodshow-layout.js?v=20261022-productdedupe1", "./foodshow-layout.css?v=20260929-foodshow8",
  "./manager-overview.js?v=20260918-managersettings1",
  "./manager-overview.css?v=20260918-manager1",
  "./todo-drag.js?v=20260917-todopointer1",
  "./copy-email.js?v=20260917-copyemail1",
  "./time-picker.js?v=20260917-time1",
  "./time-picker.css?v=20260917-time1",
  "./vendor/lz-string.js?v=1.5.0",
  "./compact-storage.js?v=20260914-storagefast1",
  "./todo-archive.js?v=20260909-todoarchive1",
  "./todo-archive.css?v=20260909-todoarchive1",
  "./lead-products.css?v=20260909-leadcompact1",
  "./k12-stock.js?v=20260918-specialorder1",
  "./k12-stock.css?v=20260909-crossstock1",
  "./team-initials.js?v=20260909-initials1",
  "./team-work-view.css?v=20260909-activity1",
  "./action-buttons.css?v=20260909-trashicons1",
  "./action-buttons.js?v=20260911-singletrash1",
  "./contacts-layout.css?v=20260909-contacticons1",
  "./people-contacts.js?v=20260915-contactrevert1",
  "./",
  "./index.html",
  "./styles.css?v=20261014-stockcards2",
  "./market-events.js?v=20261022-workspace1",
  "./personal-visit-calendar.js?v=20260909-visitcolors1",
  "./calendar-holidays.js?v=20260909-5",
  "./market-call-editor.js?v=20261022-calendarcleanup1",
  "./team-work-view.js?v=20260918-manager1", "./app.js?v=20261022-nestle1",
  "./market-week-calendar.js?v=20260918-callaudit1",
  "./market-operator-conversion.js?v=20261022-operatorcompact1",
  "./testkitchen-layout.js?v=20261022-productdedupe1",
  "./vendor-visit-print.js?v=20261013-printlogos1",
  "./market-visit-layout.js?v=20261022-workspace1",
  "./supabase-config.js",
  "./main-workspace-loader.js?v=20261023-support1",
  "./supabase-auth.js?v=20261023-support1",
  "./manifest.webmanifest",
  "./broker-whiteboard-logo.png",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./linford-logo.svg",
  "./sysco-logo.png?v=20260917-official1",
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
  // Authenticated cloud responses must never be stored in the shared static cache.
  if (new URL(event.request.url).origin !== self.location.origin || event.request.headers.has("authorization")) return;
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

