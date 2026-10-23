/* Shared main-vendor names. Product brands remain separate from manufacturers. */
(function () {
  "use strict";
  const key = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]/g, "");
  const mainNames = ["Ajinomoto","Alaska Chip Company","AquaStar","Avieta","Backpack Yogurt","Baker Boy","Brakebush","Campbell's Foodservice","CJ Schwan's","Dakota Growers","Dawn Foods","Delizza Patisserie","DYMA Brands","ES Foods","Foster Farms","General Mills","Grain Craft","Grecian Delight / Kronos","Idahoan","Kerry","King's Command","Knouse Foods","Longhorn BBQ","Michael Foods","Mount Franklin Foods","Nestle","Pacific Coast Producers","Saputo","Simplot","Smithfield","Soules Foods","Super Bakery","The Cheesecake Factory Bakery","Trident Seafoods","Ventura Foods","Westminster Crackers","Wheat Montana / Stone Ground Bakery"];
  const aliases = new Map(mainNames.map(name => [key(name),name]));
  const add = (main, names) => names.forEach(name => aliases.set(key(name),main));
  add("", ["Alaska Bread"]);
  add("Alaska Chip Company", ["Alaska Chip"]);
  add("AquaStar", ["Aqua Star","AquaStar Foods"]);
  add("Campbell's Foodservice", ["Campbell","Campbells","Campbell's","Campbell's Reserve","Campbells Culinary Reserve","Culinary Reserve"]);
  add("CJ Schwan's", ["Schwans","Schwan's Foodservice","CJ Schwans Foodservice"]);
  add("Delizza Patisserie", ["Delizza"]);
  add("General Mills", ["General Mills Foodservice"]);
  add("Grecian Delight / Kronos", ["Grecian Delight | Kronos","Grecian Delight","Kronos"]);
  add("Idahoan", ["Idahoan Foods"]);
  add("King's Command", ["King's Command Foods","Kings Command"]);
  add("Longhorn BBQ", ["Longhorn"]);
  add("Mount Franklin Foods", ["Mount Franklin"]);
  add("Nestle", ["Nestlé","Nestle Professional","Nestle Vitality"]);
  add("Soules Foods", ["Soules","John Soules","John Soules Foods"]);
  add("The Cheesecake Factory Bakery", ["The Cheesecake Factory","Cheesecake Factory"]);
  add("Trident Seafoods", ["Trident"]);
  add("Ventura Foods", ["Ventura"]);
  add("Westminster Crackers", ["Westminster","Westminster Bakers","Westminster Bakers Co"]);
  add("Wheat Montana / Stone Ground Bakery", ["Wheat Montana","Stone Ground Bakery"]);
  const canonical = value => aliases.has(key(value)) ? aliases.get(key(value)) : String(value || "").trim();
  const known = new Set(mainNames);
  const options = values => [...new Set(values.map(canonical).filter(name => known.has(name)))].sort((a,b) => a.localeCompare(b,undefined,{sensitivity:"base"}));
  const brands = new Map([
    ["coffemate","Coffee-Mate"],["coffeemate","Coffee-Mate"],["chefmate","Chef-Mate"],
    ["fernandos","Fernando's"],["nescafe","Nescafé"],["v8","V8"]
  ]);
  const brand = value => brands.get(key(value)) || String(value || "").trim();
  const inferredBrands = new Map([
    ["campbellsculinaryreserve","Culinary Reserve"],["campbellsreserve","Campbell's Reserve"],
    ["culinaryreserve","Culinary Reserve"],["nestlevitality","Vitality"],
    ["alaskachip","Alaska Chip"],["stonegroundbakery","Stone Ground Bakery"]
  ]);
  const product = p => {
    const inferred = inferredBrands.get(key(p.vendor));
    return {...p,vendor:canonical(p.vendor),brandName:brand(p.brandName || inferred || ""),
      ...(inferred && !p.brandType ? {brandType:"MB"} : {})};
  };
  window.foodBrokerVendors = Object.freeze({canonical,brand,product,options,names:()=>[...mainNames].sort((a,b)=>a.localeCompare(b)),
    logo:name=>canonical(name)==="Wheat Montana / Stone Ground Bakery" ? "vendor-logos/wheat-montana-stone-ground.png" : ""});
})();
