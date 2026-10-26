const CACHE_NAME = "foodbrokerbase-nooutlines1";
const APP_SHELL = ["./team-print-center.css?v=20261026-labelpolish1","./team-print-center-template.js?v=20261026-nooutlines1","./team-print-center.js?v=20261026-currentprints1","./product-bag-labels.js?v=20261026-nooutlines1","./product-print-logos.js?v=20261023-baglabels1","./product-support-labels.js?v=20261026-nooutlines1","./vendor-logos/ajinomoto.png","./vendor-logos/aquastar.webp","./print-logos/sysco-arrezzio.png","./vendor-logos/backpack-yogurt.png","./print-logos/word-baker-boy.png","./print-logos/sysco-bakers-source.png","./print-logos/sysco-block-and-barrel.png","./print-logos/word-brakebush.jpeg","./print-logos/sysco-buckhead-newport-pride.jpg","./print-logos/sysco-butchers-block.png","./vendor-logos/campbells-foodservice.png","./print-logos/sysco-casa-solana.png","./print-logos/usf-cattlemans-selection.webp","./print-logos/usf-chefs-line.webp","./print-logos/sysco-citavo.png","./print-logos/word-cj-schwans.png","./print-logos/usf-cross-valley-farms.webp","./vendor-logos/dakota-growers.png","./print-logos/usf-del-pasado.webp","./vendor-logos/delizza.png","./print-logos/usf-devonshire-bake-shop.webp","./vendor-logos/es-foods.png","./print-logos/sysco-fire-river-farms.png","./vendor-logos/foster-farms.png","./vendor-logos/general-mills.webp","./print-logos/usf-glenview-farms.webp","./vendor-logos/grain-craft.png","./vendor-logos/grecian-delight-kronos.png","./print-logos/usf-harbor-banks-seafood.webp","./print-logos/usf-harvest-value.webp","./print-logos/usf-hilltop-hearth.webp","./print-logos/sysco-house-recipe.jpg","./vendor-logos/idahoan.png","./print-logos/sysco-jade-mountain.png","./vendor-logos/kerry.png","./print-logos/sysco-keystone.jpg","./vendor-logos/kings-command.png","./vendor-logos/knouse-foods.png","./print-logos/usf-metro-deli.webp","./vendor-logos/michael-foods.png","./print-logos/word-mollys-kitchen.jpeg","./print-logos/usf-mollys-kitchen.webp","./print-logos/usf-monarch.webp","./print-logos/usf-monogram.webp","./print-logos/usf-monogram_clean_force_logo.webp","./vendor-logos/mount-franklin-foods.png","./vendor-logos/nestle.png","./vendor-logos/pacific-coast-producers.png","./print-logos/usf-pacific-jade.webp","./print-logos/word-papettis.png","./print-logos/sysco-pasta-la-bella.jpg","./print-logos/usf-patuxent-farms.png","./print-logos/sysco-portico.png","./print-logos/sysco-ranch-grill.jpg","./print-logos/sysco-riserva.png","./print-logos/usf-rituals.webp","./print-logos/usf-roseli.png","./print-logos/usf-rykoff-sexton.webp","./vendor-logos/saputo.png","./vendor-logos/simplot.png","./print-logos/word-simplot.png","./print-logos/word-roastworks.jpeg","./vendor-logos/smithfield.png","./vendor-logos/soules-foods.png","./print-logos/usf-stock-yards.webp","./vendor-logos/super-bakery.png","./print-logos/usf-superior.webp","./print-logos/sysco-sysco-classic.png","./print-logos/sysco-sysco-earth-plus.png","./print-logos/sysco-sysco-freshpoint.png","./print-logos/sysco-sysco-premium.png","./print-logos/sysco-sysco-reliance.png","./print-logos/sysco-sysco-reliance-fresh.jpg","./print-logos/sysco-sysco-simply-plant-based.jpg","./print-logos/sysco-sysco-supplies.jpg","./vendor-logos/the-cheesecake-factory.png","./print-logos/usf-thirster.webp","./vendor-logos/trident-seafoods.png","./print-logos/usf-valu-plus.webp","./vendor-logos/ventura-foods.jpg","./vendor-logos/westminster-bakers.png","./print-logos/sysco-white-marble-farms.jpg","./print-logos/sysco-wholesome-farms.png","./stock-list-upload-template.xlsx","./vendor-directory.css?v=20261023-vendors1","./vendor-directory.js?v=20261023-vendors1","./vendor-logos/wheat-montana-stone-ground.png","./mobile-layout.css?v=20261023-mobile1", "./mobile-layout.js?v=20261023-mobile1","./quality-sales-logo.png","./quality-sales.css?v=20261023-qualitysales1","./account-settings.css?v=20261023-account1","./settings-menu.css?v=20261023-account1","./settings-menu.js?v=20261023-account1","./product-support.html","./product-support.js?v=20261026-currentprints1","./product-support.css?v=20261026-labelpolish1","./workspace-preferences.js?v=20261023-qualitysales1","./workspace-preferences.css?v=20261023-qualitysales1","./visit-panels.css?v=20261022-visitpanels1","./us-foods-logo.svg","./operator-products.css?v=20261022-operatorcompact1","./product-catalog.js?v=20261023-vendors1","./event-products.css?v=20261022-eventease1", "./save-status.js?v=20261022-savestatus1", "./save-status.css?v=20261022-savestatus1", "./event-agenda.js?v=20261022-eventease1","./event-agenda.css?v=20261022-compactfilters1","./window-layout.css?v=20260930-windows1","./table-planner.js?v=20260930-planner14","./table-planner.css?v=20260930-planner14","./table-planner.html?v=20260930-planner14","./editing-stability.js?v=20260930-planner14","./foodshow-layout.js?v=20261023-qualitysales1", "./foodshow-layout.css?v=20260929-foodshow8",
  "./manager-overview.js?v=20260918-managersettings1",
  "./manager-overview.css?v=20260918-manager1",
  "./todo-drag.js?v=20260917-todopointer1",
  "./copy-email.js?v=20261023-qualitysales1",
  "./time-picker.js?v=20260917-time1",
  "./time-picker.css?v=20260917-time1",
  "./vendor/lz-string.js?v=1.5.0",
  "./compact-storage.js?v=20260914-storagefast1",
  "./todo-archive.js?v=20260909-todoarchive1",
  "./todo-archive.css?v=20260909-todoarchive1",
  "./lead-products.css?v=20260909-leadcompact1",
  "./k12-stock.js?v=20261023-qualitysales1",
  "./k12-stock.css?v=20260909-crossstock1",
  "./team-initials.js?v=20260909-initials1",
  "./team-work-view.css?v=20260909-activity1",
  "./action-buttons.css?v=20260909-trashicons1",
  "./action-buttons.js?v=20260911-singletrash1",
  "./contacts-layout.css?v=20261023-contacts1",
  "./people-contacts.js?v=20261023-contacts1",
  "./",
  "./index.html",
  "./styles.css?v=20261014-stockcards2",
  "./market-events.js?v=20261023-qualitysales1",
  "./personal-visit-calendar.js?v=20260909-visitcolors1",
  "./calendar-holidays.js?v=20260909-5",
  "./market-call-editor.js?v=20261022-calendarcleanup1",
  "./team-work-view.js?v=20260918-manager1", "./app.js?v=20261023-vendors1",
  "./market-week-calendar.js?v=20260918-callaudit1",
  "./market-operator-conversion.js?v=20261022-operatorcompact1",
  "./testkitchen-layout.js?v=20261022-productdedupe1",
  "./vendor-visit-print.js?v=20261023-qualitysales1",
  "./market-visit-layout.js?v=20261023-qualitysales1",
  "./supabase-config.js",
  "./main-workspace-loader.js?v=20261026-teamprint1",
  "./supabase-auth.js?v=20261023-qualitysales1",
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
  const requestUrl = new URL(event.request.url);
  if (!["http:", "https:"].includes(requestUrl.protocol) || requestUrl.origin !== self.location.origin || event.request.headers.has("authorization")) return;
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


