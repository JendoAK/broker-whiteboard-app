/* Print-only logo library. Artwork stays local; no account, product or storage access.
 * Exact brand names are matched; distributor, product title and MF numbers never infer a brand.
 * Source provenance and original-byte SHA-256 hashes are retained in the release evidence.
 */
(function (scope) {
  "use strict";
  const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const data = freeze({
  "entries": [
    {
      "id": "manufacturer-ajinomoto",
      "name": "Ajinomoto",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/ajinomoto.png",
          "alt": "Ajinomoto logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-aquastar",
      "name": "AquaStar",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/aquastar.webp",
          "alt": "AquaStar logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-backpackyogurt",
      "name": "Backpack Yogurt",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/backpack-yogurt.png",
          "alt": "Backpack Yogurt logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-bakerboy",
      "name": "Baker Boy",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/word-baker-boy.png",
          "alt": "Baker Boy logo",
          "widthPt": 81,
          "heightPt": 50.55
        }
      ]
    },
    {
      "id": "manufacturer-brakebush",
      "name": "Brakebush",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/word-brakebush.jpeg",
          "alt": "Brakebush logo",
          "widthPt": 114.85,
          "heightPt": 33.3
        }
      ]
    },
    {
      "id": "manufacturer-campbellsfoodservice",
      "name": "Campbell's Foodservice",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/campbells-foodservice.png",
          "alt": "Campbell's Foodservice logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-cjschwans",
      "name": "CJ Schwan's",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/word-cj-schwans.png",
          "alt": "CJ Schwan's logo",
          "widthPt": 109.3,
          "heightPt": 35.85
        }
      ]
    },
    {
      "id": "manufacturer-dakotagrowers",
      "name": "Dakota Growers",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/dakota-growers.png",
          "alt": "Dakota Growers logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-delizzapatisserie",
      "name": "Delizza Patisserie",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/delizza.png",
          "alt": "Delizza Patisserie logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-esfoods",
      "name": "ES Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/es-foods.png",
          "alt": "ES Foods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-fosterfarms",
      "name": "Foster Farms",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/foster-farms.png",
          "alt": "Foster Farms logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-generalmills",
      "name": "General Mills",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/general-mills.webp",
          "alt": "General Mills logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-graincraft",
      "name": "Grain Craft",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/grain-craft.png",
          "alt": "Grain Craft logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-greciandelightkronos",
      "name": "Grecian Delight / Kronos",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/grecian-delight-kronos.png",
          "alt": "Grecian Delight / Kronos logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-idahoan",
      "name": "Idahoan",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/idahoan.png",
          "alt": "Idahoan logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-kerry",
      "name": "Kerry",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/kerry.png",
          "alt": "Kerry logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-kingscommand",
      "name": "King's Command",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/kings-command.png",
          "alt": "King's Command logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-knousefoods",
      "name": "Knouse Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/knouse-foods.png",
          "alt": "Knouse Foods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-michaelfoods",
      "name": "Michael Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/michael-foods.png",
          "alt": "Michael Foods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-mountfranklinfoods",
      "name": "Mount Franklin Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/mount-franklin-foods.png",
          "alt": "Mount Franklin Foods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-nestle",
      "name": "Nestle",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/nestle.png",
          "alt": "Nestle logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-pacificcoastproducers",
      "name": "Pacific Coast Producers",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/pacific-coast-producers.png",
          "alt": "Pacific Coast Producers logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-piercecartwright",
      "name": "Pierce Cartwright",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/pierce-cartwright.png",
          "alt": "Pierce Cartwright logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-saputo",
      "name": "Saputo",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/saputo.png",
          "alt": "Saputo logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-simplot",
      "name": "Simplot",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/simplot.png",
          "alt": "Simplot logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-smithfield",
      "name": "Smithfield",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/smithfield.png",
          "alt": "Smithfield logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-soulesfoods",
      "name": "Soules Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/soules-foods.png",
          "alt": "Soules Foods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-superbakery",
      "name": "Super Bakery",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/super-bakery.png",
          "alt": "Super Bakery logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-thecheesecakefactorybakery",
      "name": "The Cheesecake Factory Bakery",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/the-cheesecake-factory.png",
          "alt": "The Cheesecake Factory Bakery logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-tridentseafoods",
      "name": "Trident Seafoods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/trident-seafoods.png",
          "alt": "Trident Seafoods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-venturafoods",
      "name": "Ventura Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/ventura-foods.jpg",
          "alt": "Ventura Foods logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-westminstercrackers",
      "name": "Westminster Crackers",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/westminster-bakers.png",
          "alt": "Westminster Crackers logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "manufacturer-wheatmontanastonegroundbakery",
      "name": "Wheat Montana / Stone Ground Bakery",
      "family": "manufacturer",
      "logos": [
        {
          "src": "vendor-logos/wheat-montana-stone-ground.png",
          "alt": "Wheat Montana / Stone Ground Bakery logo",
          "widthPt": 120,
          "heightPt": 45
        }
      ]
    },
    {
      "id": "papettis",
      "name": "Papetti's",
      "family": "brand",
      "logos": [
        {
          "src": "print-logos/word-papettis.png",
          "alt": "Papetti's logo",
          "widthPt": 127.85,
          "heightPt": 52.5,
          "cropTop": 0.2035064697265625,
          "cropBottom": 0.2210540771484375
        }
      ]
    },
    {
      "id": "roastworks",
      "name": "Simplot RoastWorks",
      "family": "brand",
      "logos": [
        {
          "src": "print-logos/word-simplot.png",
          "alt": "Simplot logo",
          "widthPt": 103.45,
          "heightPt": 40.6,
          "cropTop": 0.2524261474609375,
          "cropBottom": 0.2330169677734375
        },
        {
          "src": "print-logos/word-roastworks.jpeg",
          "alt": "RoastWorks logo",
          "widthPt": 135.85,
          "heightPt": 38.25,
          "cropTop": 0.1832122802734375,
          "cropBottom": 0.2442779541015625
        }
      ]
    },
    {
      "id": "usf-cattlemans-selection",
      "name": "Cattleman's Selection",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-cattlemans-selection.webp",
          "alt": "Cattleman's Selection logo",
          "widthPt": 45.302,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.006666666666666667
        }
      ]
    },
    {
      "id": "usf-chefs-line",
      "name": "Chef's Line",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-chefs-line.webp",
          "alt": "Chef's Line logo",
          "widthPt": 45,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "usf-cross-valley-farms",
      "name": "Cross Valley Farms",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-cross-valley-farms.webp",
          "alt": "Cross Valley Farms logo",
          "widthPt": 45.302,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.006666666666666667
        }
      ]
    },
    {
      "id": "usf-del-pasado",
      "name": "Del Pasado",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-del-pasado.webp",
          "alt": "Del Pasado logo",
          "widthPt": 42.6,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0.05333333333333334,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "usf-devonshire-bake-shop",
      "name": "Devonshire Bake Shop",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-devonshire-bake-shop.webp",
          "alt": "Devonshire Bake Shop logo",
          "widthPt": 45,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "usf-glenview-farms",
      "name": "Glenview Farms",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-glenview-farms.webp",
          "alt": "Glenview Farms logo",
          "widthPt": 55.102,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.18333333333333332
        }
      ]
    },
    {
      "id": "usf-harbor-banks-seafood",
      "name": "Harbor Banks Seafood",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-harbor-banks-seafood.webp",
          "alt": "Harbor Banks Seafood logo",
          "widthPt": 45.302,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.006666666666666667
        }
      ]
    },
    {
      "id": "usf-harvest-value",
      "name": "Harvest Value",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-harvest-value.webp",
          "alt": "Harvest Value logo",
          "widthPt": 62.791,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.2833333333333333
        }
      ]
    },
    {
      "id": "usf-hilltop-hearth",
      "name": "Hilltop Hearth",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-hilltop-hearth.webp",
          "alt": "Hilltop Hearth logo",
          "widthPt": 52.734,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.14666666666666667
        }
      ]
    },
    {
      "id": "usf-metro-deli",
      "name": "Metro Deli",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-metro-deli.webp",
          "alt": "Metro Deli logo",
          "widthPt": 45,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "usf-mollys-kitchen",
      "name": "Molly's Kitchen",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/word-mollys-kitchen.jpeg",
          "alt": "Molly's Kitchen logo",
          "widthPt": 75.8,
          "heightPt": 55.5
        }
      ]
    },
    {
      "id": "usf-mollys-kitchen-current",
      "name": "Molly's Kitchen (current website artwork)",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-mollys-kitchen.webp",
          "alt": "Molly's Kitchen logo",
          "widthPt": 45.302,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.006666666666666667
        }
      ]
    },
    {
      "id": "usf-monarch",
      "name": "Monarch",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-monarch.webp",
          "alt": "Monarch logo",
          "widthPt": 50,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.1
        }
      ]
    },
    {
      "id": "usf-monogram",
      "name": "Monogram",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-monogram.webp",
          "alt": "Monogram logo",
          "widthPt": 69.588,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.35333333333333333
        }
      ]
    },
    {
      "id": "usf-monogram_clean_force_logo",
      "name": "Monogram Clean Force",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-monogram_clean_force_logo.webp",
          "alt": "Monogram Clean Force logo",
          "widthPt": 45.302,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.006666666666666667
        }
      ]
    },
    {
      "id": "usf-pacific-jade",
      "name": "Pacific Jade",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-pacific-jade.webp",
          "alt": "Pacific Jade logo",
          "widthPt": 45.302,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.006666666666666667
        }
      ]
    },
    {
      "id": "usf-patuxent-farms",
      "name": "Patuxent Farms",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-patuxent-farms.png",
          "alt": "Patuxent Farms logo",
          "widthPt": 45.608,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.013333333333333334
        }
      ]
    },
    {
      "id": "usf-rituals",
      "name": "Rituals",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-rituals.webp",
          "alt": "Rituals logo",
          "widthPt": 50.186,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.10333333333333333
        }
      ]
    },
    {
      "id": "usf-roseli",
      "name": "Roseli",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-roseli.png",
          "alt": "Roseli logo",
          "widthPt": 43.908,
          "heightPt": 45,
          "cropLeft": 0.19333333333333333,
          "cropRight": 0.13666666666666666,
          "cropTop": 0.15666666666666668,
          "cropBottom": 0.15666666666666668
        }
      ]
    },
    {
      "id": "usf-rykoff-sexton",
      "name": "Rykoff Sexton",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-rykoff-sexton.webp",
          "alt": "Rykoff Sexton logo",
          "widthPt": 45,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "usf-stock-yards",
      "name": "Stock Yards",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-stock-yards.webp",
          "alt": "Stock Yards logo",
          "widthPt": 45,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "usf-superior",
      "name": "Superior",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-superior.webp",
          "alt": "Superior logo",
          "widthPt": 57.447,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.21666666666666667
        }
      ]
    },
    {
      "id": "usf-thirster",
      "name": "Thirster",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-thirster.webp",
          "alt": "Thirster logo",
          "widthPt": 72.973,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.38333333333333336
        }
      ]
    },
    {
      "id": "usf-valu-plus",
      "name": "Valu+Plus",
      "family": "usFoodsEb",
      "logos": [
        {
          "src": "print-logos/usf-valu-plus.webp",
          "alt": "Valu+Plus logo",
          "widthPt": 61.086,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0.2633333333333333
        }
      ]
    },
    {
      "id": "sysco-arrezzio",
      "name": "Arrezzio",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-arrezzio.png",
          "alt": "Arrezzio logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-bakers-source",
      "name": "Baker's Source",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-bakers-source.png",
          "alt": "Baker's Source logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-block-and-barrel",
      "name": "Block & Barrel",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-block-and-barrel.png",
          "alt": "Block & Barrel logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-buckhead-newport-pride",
      "name": "Buckhead Newport Pride",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-buckhead-newport-pride.jpg",
          "alt": "Buckhead Newport Pride logo",
          "widthPt": 86.554,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0.2357142857142857,
          "cropBottom": 0.2357142857142857
        }
      ]
    },
    {
      "id": "sysco-butchers-block",
      "name": "Butcher's Block",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-butchers-block.png",
          "alt": "Butcher's Block logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-casa-solana",
      "name": "Casa Solana",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-casa-solana.png",
          "alt": "Casa Solana logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-citavo",
      "name": "Citavo",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-citavo.png",
          "alt": "Citavo logo",
          "widthPt": 52.618,
          "heightPt": 45,
          "cropLeft": 0.1756440281030445,
          "cropRight": 0.1288056206088993,
          "cropTop": 0.20476190476190476,
          "cropBottom": 0.19047619047619047
        }
      ]
    },
    {
      "id": "sysco-fire-river-farms",
      "name": "Fire River Farms",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-fire-river-farms.png",
          "alt": "Fire River Farms logo",
          "widthPt": 57.273,
          "heightPt": 45,
          "cropLeft": 0.17008797653958943,
          "cropRight": 0.17302052785923755,
          "cropTop": 0.23809523809523808,
          "cropBottom": 0.23809523809523808
        }
      ]
    },
    {
      "id": "sysco-house-recipe",
      "name": "House Recipe",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-house-recipe.jpg",
          "alt": "House Recipe logo",
          "widthPt": 63,
          "heightPt": 45,
          "cropLeft": 0.1436950146627566,
          "cropRight": 0.17888563049853373,
          "cropTop": 0.25297619047619047,
          "cropBottom": 0.25595238095238093
        }
      ]
    },
    {
      "id": "sysco-jade-mountain",
      "name": "Jade Mountain",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-jade-mountain.png",
          "alt": "Jade Mountain logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-keystone",
      "name": "Keystone",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-keystone.jpg",
          "alt": "Keystone logo",
          "widthPt": 128,
          "heightPt": 28.178,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0.3880952380952381,
          "cropBottom": 0.3880952380952381
        }
      ]
    },
    {
      "id": "sysco-pasta-la-bella",
      "name": "Pasta La Bella",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-pasta-la-bella.jpg",
          "alt": "Pasta La Bella logo",
          "widthPt": 68.138,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0.16428571428571428,
          "cropBottom": 0.16428571428571428
        }
      ]
    },
    {
      "id": "sysco-portico",
      "name": "Portico Seafood",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-portico.png",
          "alt": "Portico Seafood logo",
          "widthPt": 45.668,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-ranch-grill",
      "name": "Ranch & Grill",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-ranch-grill.jpg",
          "alt": "Ranch & Grill logo",
          "widthPt": 53.726,
          "heightPt": 45,
          "cropLeft": 0.13348946135831383,
          "cropRight": 0.13114754098360656,
          "cropTop": 0.1880952380952381,
          "cropBottom": 0.18571428571428572
        }
      ]
    },
    {
      "id": "sysco-riserva",
      "name": "Riserva",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-riserva.png",
          "alt": "Riserva logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-sysco-classic",
      "name": "Sysco Classic",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-classic.png",
          "alt": "Sysco Classic logo",
          "widthPt": 128,
          "heightPt": 42.923,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-sysco-earth-plus",
      "name": "Sysco Earth Plus",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-earth-plus.png",
          "alt": "Sysco Earth Plus logo",
          "widthPt": 51.516,
          "heightPt": 45,
          "cropLeft": 0.12903225806451613,
          "cropRight": 0.12903225806451613,
          "cropTop": 0.17261904761904762,
          "cropBottom": 0.16964285714285715
        }
      ]
    },
    {
      "id": "sysco-sysco-freshpoint",
      "name": "Sysco Freshpoint Natural",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-freshpoint.png",
          "alt": "Sysco Freshpoint Natural logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-sysco-premium",
      "name": "Sysco Premium",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-premium.png",
          "alt": "Sysco Premium logo",
          "widthPt": 128,
          "heightPt": 42.752,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "sysco-sysco-reliance",
      "name": "Sysco Reliance",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-reliance.png",
          "alt": "Sysco Reliance logo",
          "widthPt": 109.184,
          "heightPt": 45,
          "cropLeft": 0.19333333333333333,
          "cropRight": 0.192,
          "cropTop": 0.1610337972166998,
          "cropBottom": 0.08349900596421471
        }
      ]
    },
    {
      "id": "sysco-sysco-reliance-fresh",
      "name": "Sysco Reliance Fresh",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-reliance-fresh.jpg",
          "alt": "Sysco Reliance Fresh logo",
          "widthPt": 73.477,
          "heightPt": 45,
          "cropLeft": 0.00936768149882904,
          "cropRight": 0.0117096018735363,
          "cropTop": 0.19523809523809524,
          "cropBottom": 0.19523809523809524
        }
      ]
    },
    {
      "id": "sysco-sysco-simply-plant-based",
      "name": "Sysco Simply Plant Based",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-simply-plant-based.jpg",
          "alt": "Sysco Simply Plant Based logo",
          "widthPt": 114.375,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0.3047619047619048,
          "cropBottom": 0.29523809523809524
        }
      ]
    },
    {
      "id": "sysco-sysco-supplies",
      "name": "Sysco Supplies",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-sysco-supplies.jpg",
          "alt": "Sysco Supplies logo",
          "widthPt": 42.843,
          "heightPt": 45,
          "cropLeft": 0.1288056206088993,
          "cropRight": 0.17330210772833723,
          "cropTop": 0.14523809523809525,
          "cropBottom": 0.10952380952380952
        }
      ]
    },
    {
      "id": "sysco-white-marble-farms",
      "name": "White Marble Farms",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-white-marble-farms.jpg",
          "alt": "White Marble Farms logo",
          "widthPt": 63.626,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0.14047619047619048,
          "cropBottom": 0.14047619047619048
        }
      ]
    },
    {
      "id": "sysco-wholesome-farms",
      "name": "Wholesome Farms",
      "family": "syscoEb",
      "logos": [
        {
          "src": "print-logos/sysco-wholesome-farms.png",
          "alt": "Wholesome Farms logo",
          "widthPt": 45.67,
          "heightPt": 45,
          "cropLeft": 0,
          "cropRight": 0,
          "cropTop": 0,
          "cropBottom": 0
        }
      ]
    },
    {
      "id": "manufacturer-alaskachipcompany",
      "name": "Alaska Chip Company",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/alaska-chip-company.png",
          "alt": "Alaska Chip Company logo",
          "widthPt": 80.319,
          "heightPt": 50.4,
          "cropLeft": 0,
          "cropTop": 0.1975,
          "cropRight": 0,
          "cropBottom": 0.175
        }
      ]
    },
    {
      "id": "manufacturer-avieta",
      "name": "Avieta",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/avieta.png",
          "alt": "Avieta logo",
          "widthPt": 47.235,
          "heightPt": 50.4
        }
      ]
    },
    {
      "id": "manufacturer-dawnfoods",
      "name": "Dawn Foods",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/dawn-foods.png",
          "alt": "Dawn Foods logo",
          "widthPt": 120,
          "heightPt": 46.957
        }
      ]
    },
    {
      "id": "manufacturer-dymabrands",
      "name": "DYMA Brands",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/dyma-brands.webp",
          "alt": "DYMA Brands logo",
          "widthPt": 97.395,
          "heightPt": 50.4
        }
      ]
    },
    {
      "id": "manufacturer-longhornbbq",
      "name": "Longhorn BBQ",
      "family": "manufacturer",
      "logos": [
        {
          "src": "print-logos/longhorn-bbq.png",
          "alt": "Longhorn BBQ logo",
          "widthPt": 79.936,
          "heightPt": 50.4,
          "cropLeft": 0.179375,
          "cropTop": 0.1826086956521739,
          "cropRight": 0.21,
          "cropBottom": 0.2222222222222222
        }
      ]
    }
  ],
  "manufacturerAliases": {
    "ajinomoto": "manufacturer-ajinomoto",
    "aquastar": "manufacturer-aquastar",
    "aquastarfoods": "manufacturer-aquastar",
    "backpackyogurt": "manufacturer-backpackyogurt",
    "bakerboy": "manufacturer-bakerboy",
    "brakebush": "manufacturer-brakebush",
    "campbellsfoodservice": "manufacturer-campbellsfoodservice",
    "campbell": "manufacturer-campbellsfoodservice",
    "campbells": "manufacturer-campbellsfoodservice",
    "cjschwans": "manufacturer-cjschwans",
    "schwans": "manufacturer-cjschwans",
    "schwansfoodservice": "manufacturer-cjschwans",
    "cjschwansfoodservice": "manufacturer-cjschwans",
    "dakotagrowers": "manufacturer-dakotagrowers",
    "dakotagrowerspasta": "manufacturer-dakotagrowers",
    "delizzapatisserie": "manufacturer-delizzapatisserie",
    "delizza": "manufacturer-delizzapatisserie",
    "esfoods": "manufacturer-esfoods",
    "fosterfarms": "manufacturer-fosterfarms",
    "generalmills": "manufacturer-generalmills",
    "generalmillsfoodservice": "manufacturer-generalmills",
    "graincraft": "manufacturer-graincraft",
    "greciandelightkronos": "manufacturer-greciandelightkronos",
    "greciandelight": "manufacturer-greciandelightkronos",
    "kronos": "manufacturer-greciandelightkronos",
    "idahoan": "manufacturer-idahoan",
    "kerry": "manufacturer-kerry",
    "kingscommand": "manufacturer-kingscommand",
    "kingscommandfoods": "manufacturer-kingscommand",
    "knousefoods": "manufacturer-knousefoods",
    "knouse": "manufacturer-knousefoods",
    "michaelfoods": "manufacturer-michaelfoods",
    "mountfranklinfoods": "manufacturer-mountfranklinfoods",
    "mountfranklin": "manufacturer-mountfranklinfoods",
    "nestle": "manufacturer-nestle",
    "nestleprofessional": "manufacturer-nestle",
    "pacificcoastproducers": "manufacturer-pacificcoastproducers",
    "piercecartwright": "manufacturer-piercecartwright",
    "saputo": "manufacturer-saputo",
    "simplot": "manufacturer-simplot",
    "smithfield": "manufacturer-smithfield",
    "soulesfoods": "manufacturer-soulesfoods",
    "soules": "manufacturer-soulesfoods",
    "johnsoules": "manufacturer-soulesfoods",
    "johnsoulesfoods": "manufacturer-soulesfoods",
    "superbakery": "manufacturer-superbakery",
    "thecheesecakefactorybakery": "manufacturer-thecheesecakefactorybakery",
    "thecheesecakefactory": "manufacturer-thecheesecakefactorybakery",
    "cheesecakefactory": "manufacturer-thecheesecakefactorybakery",
    "tridentseafoods": "manufacturer-tridentseafoods",
    "trident": "manufacturer-tridentseafoods",
    "venturafoods": "manufacturer-venturafoods",
    "ventura": "manufacturer-venturafoods",
    "westminstercrackers": "manufacturer-westminstercrackers",
    "westminsterbakers": "manufacturer-westminstercrackers",
    "westminsterbakersco": "manufacturer-westminstercrackers",
    "westminster": "manufacturer-westminstercrackers",
    "wheatmontanastonegroundbakery": "manufacturer-wheatmontanastonegroundbakery",
    "wheatmontana": "manufacturer-wheatmontanastonegroundbakery",
    "stonegroundbakery": "manufacturer-wheatmontanastonegroundbakery",
    "nestlevitality": "manufacturer-nestle",
    "idahoanfoods": "manufacturer-idahoan",
    "campbellsreserve": "manufacturer-campbellsfoodservice",
    "campbellsculinaryreserve": "manufacturer-campbellsfoodservice",
    "culinaryreserve": "manufacturer-campbellsfoodservice",
    "alaskachipcompany": "manufacturer-alaskachipcompany",
    "alaskachip": "manufacturer-alaskachipcompany",
    "alaskachipco": "manufacturer-alaskachipcompany",
    "avieta": "manufacturer-avieta",
    "dawnfoods": "manufacturer-dawnfoods",
    "dawn": "manufacturer-dawnfoods",
    "dymabrands": "manufacturer-dymabrands",
    "dyma": "manufacturer-dymabrands",
    "longhornbbq": "manufacturer-longhornbbq",
    "longhornbarbecue": "manufacturer-longhornbbq"
  },
  "brandAliases": {
    "papettis": "papettis",
    "papetti": "papettis",
    "roastworks": "roastworks",
    "simplotroastworks": "roastworks",
    "cattlemansselection": "usf-cattlemans-selection",
    "chefsline": "usf-chefs-line",
    "crossvalleyfarms": "usf-cross-valley-farms",
    "delpasado": "usf-del-pasado",
    "devonshirebakeshop": "usf-devonshire-bake-shop",
    "glenviewfarms": "usf-glenview-farms",
    "harborbanksseafood": "usf-harbor-banks-seafood",
    "harvestvalue": "usf-harvest-value",
    "hilltophearth": "usf-hilltop-hearth",
    "metrodeli": "usf-metro-deli",
    "mollyskitchen": "usf-mollys-kitchen",
    "monarch": "usf-monarch",
    "monogram": "usf-monogram",
    "monogramcleanforce": "usf-monogram_clean_force_logo",
    "pacificjade": "usf-pacific-jade",
    "patuxentfarms": "usf-patuxent-farms",
    "rituals": "usf-rituals",
    "roseli": "usf-roseli",
    "rykoffsexton": "usf-rykoff-sexton",
    "stockyards": "usf-stock-yards",
    "superior": "usf-superior",
    "thirster": "usf-thirster",
    "valuplus": "usf-valu-plus",
    "arrezzio": "sysco-arrezzio",
    "bakerssource": "sysco-bakers-source",
    "blockandbarrel": "sysco-block-and-barrel",
    "buckheadnewportpride": "sysco-buckhead-newport-pride",
    "butchersblock": "sysco-butchers-block",
    "casasolana": "sysco-casa-solana",
    "citavo": "sysco-citavo",
    "syscoearthplus": "sysco-sysco-earth-plus",
    "fireriverfarms": "sysco-fire-river-farms",
    "houserecipe": "sysco-house-recipe",
    "jademountain": "sysco-jade-mountain",
    "keystone": "sysco-keystone",
    "pastalabella": "sysco-pasta-la-bella",
    "ranchandgrill": "sysco-ranch-grill",
    "porticoseafood": "sysco-portico",
    "riserva": "sysco-riserva",
    "syscofreshpointnatural": "sysco-sysco-freshpoint",
    "syscosupplies": "sysco-sysco-supplies",
    "syscosimplyplantbased": "sysco-sysco-simply-plant-based",
    "syscoreliancefresh": "sysco-sysco-reliance-fresh",
    "whitemarblefarms": "sysco-white-marble-farms",
    "wholesomefarms": "sysco-wholesome-farms",
    "syscopremium": "sysco-sysco-premium",
    "syscoclassic": "sysco-sysco-classic",
    "syscoreliance": "sysco-sysco-reliance",
    "cattlemanselection": "usf-cattlemans-selection",
    "harborbanks": "usf-harbor-banks-seafood",
    "devonshire": "usf-devonshire-bake-shop",
    "portico": "sysco-portico",
    "syscosimply": "sysco-sysco-simply-plant-based",
    "earthplus": "sysco-sysco-earth-plus",
    "syscofreshpoint": "sysco-sysco-freshpoint",
    "freshpointnatural": "sysco-sysco-freshpoint",
    "jademountainclassic": "sysco-jade-mountain",
    "jademountainimperial": "sysco-jade-mountain",
    "arrezzioclassic": "sysco-arrezzio",
    "arrezzioimperial": "sysco-arrezzio",
    "arrezzioriserva": "sysco-riserva",
    "bakerssourceclassic": "sysco-bakers-source",
    "blockandbarrelclassic": "sysco-block-and-barrel",
    "blockandbarrelimperial": "sysco-block-and-barrel",
    "blockandbarrelreliance": "sysco-block-and-barrel",
    "casasolanaclassic": "sysco-casa-solana",
    "casasolanaimperial": "sysco-casa-solana",
    "citavoclassic": "sysco-citavo",
    "houserecipeclassic": "sysco-house-recipe",
    "porticoclassic": "sysco-portico",
    "porticoimperial": "sysco-portico",
    "porticosimply": "sysco-portico",
    "wholesomefarmsclassic": "sysco-wholesome-farms",
    "wholesomefarmsimperial": "sysco-wholesome-farms"
  },
  "brandAliasNotices": {
    "jademountainclassic": "Showing the Jade Mountain family logo for “Jade Mountain Classic”.",
    "jademountainimperial": "Showing the Jade Mountain family logo for “Jade Mountain Imperial”.",
    "arrezzioclassic": "Showing the Arrezzio family logo for “Arrezzio Classic”.",
    "arrezzioimperial": "Showing the Arrezzio family logo for “Arrezzio Imperial”.",
    "arrezzioriserva": "Showing the Riserva from Arrezzio logo for “Arrezzio Riserva”.",
    "bakerssourceclassic": "Showing the Baker's Source family logo for “Baker's Source Classic”.",
    "blockandbarrelclassic": "Showing the Block & Barrel family logo for “Block & Barrel Classic”.",
    "blockandbarrelimperial": "Showing the Block & Barrel family logo for “Block & Barrel Imperial”.",
    "blockandbarrelreliance": "Showing the Block & Barrel family logo for “Block & Barrel Reliance”.",
    "casasolanaclassic": "Showing the Casa Solana family logo for “Casa Solana Classic”.",
    "casasolanaimperial": "Showing the Casa Solana family logo for “Casa Solana Imperial”.",
    "citavoclassic": "Showing the Citavo family logo for “Citavo Classic”.",
    "houserecipeclassic": "Showing the House Recipe family logo for “House Recipe Classic”.",
    "porticoclassic": "Showing the Portico Seafood family logo for “Portico Classic”.",
    "porticoimperial": "Showing the Portico Seafood family logo for “Portico Imperial”.",
    "porticosimply": "Showing the Portico Seafood family logo for “Portico Simply”.",
    "wholesomefarmsclassic": "Showing the Wholesome Farms family logo for “Wholesome Farms Classic”.",
    "wholesomefarmsimperial": "Showing the Wholesome Farms family logo for “Wholesome Farms Imperial”."
  }
} );
  const byId = new Map(data.entries.map(entry => [entry.id, entry]));
  const key = value => String(value == null ? "" : value).replace(/[®™]/g, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
  const modes = new Set(["automatic", "brand", "manufacturer", "usFoodsEb", "syscoEb", "none"]);
  const brandFamilies = new Set(["brand", "usFoodsEb", "syscoEb"]);
  function visible(entry, mode) { return mode === "automatic" || mode === "brand" && brandFamilies.has(entry.family) || entry.family === mode; }
  function missing(mode, reason) { return freeze({id:"", name:"", family:mode, src:"", alt:"", logos:[], missing:true, reason, notice:reason}); }
  function result(entry, notice) { return freeze({...entry, src:entry.logos[0]?.src || "", alt:entry.logos.map(logo => logo.alt).join(" + "), missing:false, reason:"", notice:notice || ""}); }
  function options(mode) {
    if (!modes.has(mode) || mode === "none") return Object.freeze([]);
    return Object.freeze(data.entries.filter(entry => visible(entry, mode)).slice().sort((a,b) => a.name.localeCompare(b.name)).map(entry => result(entry)));
  }
  function resolve(product, mode, choiceId) {
    product = product && typeof product === "object" ? product : {};
    mode = mode || "automatic";
    if (!modes.has(mode)) return missing(mode, "Choose a supported label logo option.");
    if (mode === "none") return freeze({id:"none",name:"No logo",family:"none",src:"",alt:"",logos:[],missing:false,reason:"",notice:""});
    if (choiceId) {
      const chosen = byId.get(String(choiceId));
      return chosen && visible(chosen, mode) ? result(chosen, "Logo chosen for this label only.") : missing(mode, "That logo is unavailable in the selected logo group.");
    }
    const brand = String(product.brandName || "").trim();
    const branded = byId.get(data.brandAliases[key(brand)]);
    if (mode !== "manufacturer" && branded && visible(branded, mode)) return result(branded, data.brandAliasNotices[key(brand)]);
    if (mode === "brand" || mode === "usFoodsEb" || mode === "syscoEb") {
      const familyName = mode === "usFoodsEb" ? "US Foods Exclusive Brand" : mode === "syscoEb" ? "Sysco Exclusive Brand" : "product brand";
      return missing(mode, brand ? "No matching " + familyName + " logo for “" + brand + "”. Choose a logo or upload your own." : "No product brand is recorded. Choose a " + familyName + " logo or upload your own.");
    }
    const manufacturer = String(product.vendor || product.manufacturer || product.vendorName || "").trim();
    const maker = byId.get(data.manufacturerAliases[key(manufacturer)]);
    if (maker) return result(maker, mode === "automatic" && brand ? "No logo is available for “" + brand + "”; showing the " + maker.name + " manufacturer logo." : mode === "automatic" && key(product.brandType) === "eb" ? "No Exclusive Brand name is recorded; showing the " + maker.name + " manufacturer logo." : "");
    return missing(mode, manufacturer ? "No manufacturer logo is available for “" + manufacturer + "”. Choose a logo or upload your own." : "No manufacturer logo is available. Choose a logo or upload your own.");
  }
  scope.foodBrokerPrintLogos = Object.freeze({version:"20261029-logocoverage1",resolve,options});
})(typeof window !== "undefined" ? window : globalThis);
