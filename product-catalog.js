/* Shared identity rules for event product lists and product suggestions. */
(function () {
  "use strict";
  const cached = normalize => {
    const cache = new Map();
    return value => {
      const input = String(value ?? "");
      if (cache.has(input)) return cache.get(input);
      if (cache.size > 12000) cache.clear();
      const result = normalize(input);
      cache.set(input, result);
      return result;
    };
  };
  const text = cached(value => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " "));
  const code = cached(value => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    return ["na", "none", "unknown", "optional", "tbd", "notavailable"].includes(normalized) ? "" : normalized;
  });
  const pack = cached(value => value.toLowerCase().replace(/\bpounds?\b|\blbs\b/g, "lb").replace(/\bounces?\b|\bozs\b/g, "oz").replace(/[\s,]+/g, "").replace(/(lb|oz)\./g, "$1").trim());
  const storage = value => {
    const normalized = text(value);
    if (/^(frozen|freezer|freeze)$/.test(normalized)) return "frozen";
    if (/^(refrigerated|refrigeration|chilled|chill|refrigerate)$/.test(normalized)) return "refrigerated";
    if (/^(dry|ambient|shelf stable)$/.test(normalized)) return "dry";
    return normalized;
  };
  const defaults = () => typeof stockProducts !== "undefined" && Array.isArray(stockProducts) ? stockProducts : [];
  const ids = product => [...new Set([product?.id, product?.linkedStockId, product?.canonicalStockId, ...(product?.aliasProductIds || [])].filter(Boolean))];
  const hasConflict = (a, b, property, normalize = code) => Boolean(normalize(a?.[property]) && normalize(b?.[property]) && normalize(a[property]) !== normalize(b[property]));
  const distributorCodeConflict = (a, b) => text(a.distributor) && text(a.distributor) === text(b.distributor) && hasConflict(a, b, "distributorNumber");
  const compatible = (a, b) => !hasConflict(a, b, "packaging", pack) && !hasConflict(a, b, "storage", storage) && !distributorCodeConflict(a, b) && !["manufacturerNumber", "apn", "supc", "gtin"].some(property => hasConflict(a, b, property));
  const tokens = product => {
    const result = ids(product).map(id => `id|${id}`);
    for (const property of ["apn", "supc", "gtin"]) if (code(product[property])) result.push(`${property}|${code(product[property])}`);
    if (text(product.distributor) && code(product.distributorNumber)) result.push(`distributor|${text(product.distributor)}|${code(product.distributorNumber)}`);
    const vendor = text(product.vendor);
    if (vendor && code(product.manufacturerNumber)) result.push(`mf|${vendor}|${code(product.manufacturerNumber)}`);
    if (vendor && text(product.description) && pack(product.packaging)) result.push(`name|${vendor}|${text(product.description)}|${pack(product.packaging)}`);
    return result;
  };
  const indexCache = new WeakMap();
  const indexedFields = ["id", "vendor", "description", "packaging", "storage", "manufacturerNumber", "apn", "supc", "gtin", "distributor", "distributorNumber"];
  const stockIndex = stocks => {
    const cachedIndex = indexCache.get(stocks);
    if (cachedIndex && cachedIndex.records.length === stocks.length && stocks.every((product, position) => cachedIndex.records[position].product === product && indexedFields.every((field, fieldIndex) => cachedIndex.records[position].values[fieldIndex] === product[field]))) return cachedIndex.index;
    const byId = new Map(), byToken = new Map();
    for (const product of stocks) {
      if (product.id) byId.set(product.id, product);
      for (const token of tokens(product)) {
        if (!byToken.has(token)) byToken.set(token, new Set());
        byToken.get(token).add(product);
      }
    }
    const index = { byId, byToken };
    indexCache.set(stocks, { index, records: stocks.map(product => ({ product, values: indexedFields.map(field => product[field]) })) });
    return index;
  };
  const complementaryCodes = (preferred, members) => {
    const result = {};
    for (const property of ["apn", "supc", "gtin"]) {
      if (code(preferred[property])) continue;
      const values = new Map();
      for (const member of members) if (compatible(preferred, member) && code(member[property])) values.set(code(member[property]), member[property]);
      if (values.size === 1) result[property] = [...values.values()][0];
    }
    return result;
  };
  const compareLabels = new Intl.Collator(undefined, { sensitivity: "base", numeric: true }).compare;

  function same(a, b) {
    if (!a || !b) return false;
    if (ids(a).some(id => ids(b).includes(id))) return true;
    // A deliberate link has priority over an inferred family match, including
    // after its stock record has been removed.
    const explicitA = a.explicitLinkedStockId || (a.linkedStockId && !a.canonicalStockId ? a.linkedStockId : "");
    const explicitB = b.explicitLinkedStockId || (b.linkedStockId && !b.canonicalStockId ? b.linkedStockId : "");
    if (explicitA && !ids(b).includes(explicitA) || explicitB && !ids(a).includes(explicitB)) return false;
    if (!compatible(a, b)) return false;
    if (["apn", "supc", "gtin"].some(property => code(a[property]) && code(a[property]) === code(b[property]))) return true;
    if (text(a.distributor) && text(a.distributor) === text(b.distributor) && code(a.distributorNumber) && code(a.distributorNumber) === code(b.distributorNumber)) return true;
    if (!text(a.vendor) || text(a.vendor) !== text(b.vendor)) return false;
    if (code(a.manufacturerNumber) && code(a.manufacturerNumber) === code(b.manufacturerNumber)) return true;
    // Name alone cannot distinguish pack sizes. Require a stated, identical pack.
    return Boolean(text(a.description) && text(a.description) === text(b.description) && pack(a.packaging) && pack(a.packaging) === pack(b.packaging));
  }

  function compare(a, b) {
    const rank = product => window.foodBrokerWorkspace?.rankProduct ? window.foodBrokerWorkspace.rankProduct(product) : code(product?.apn) ? 0 : /^us\s*foods\b/i.test(String(product?.distributor || "")) && product?.distributor !== "Not stocked" ? 1 : 2;
    return rank(a) - rank(b) || compareLabels(String(a?.description || ""), String(b?.description || "")) || compareLabels(String(a?.vendor || ""), String(b?.vendor || "")) || compareLabels(String(a?.id || ""), String(b?.id || ""));
  }

  function stockMatch(product, stocks = defaults(), index = null) {
    if (!product) return null;
    index ||= stockIndex(stocks);
    if (product.linkedStockId) return index.byId.get(product.linkedStockId) || null;
    if (product.canonicalStockId) return index.byId.get(product.canonicalStockId) || null;
    const byId = index.byId.get(product.id);
    if (byId) return byId;
    const candidates = new Set(tokens(product).flatMap(token => [...(index.byToken.get(token) || [])]));
    const matches = [...candidates].filter(stock => same(product, stock));
    if (!matches.length) return null;
    // An incomplete historical item must never choose arbitrarily between sizes
    // or conflicting distributor codes that happen to share a manufacturer code.
    if (!matches.every((a, index) => matches.slice(index + 1).every(b => same(a, b) && compatible(a, b)))) return null;
    return [...matches].sort(compare)[0];
  }

  function key(product) {
    if (!product) return "";
    const manufacturer = code(product.manufacturerNumber);
    const vendor = text(product.vendor);
    const variant = [pack(product.packaging), storage(product.storage)].join("|");
    if (vendor && manufacturer) return `mf|${vendor}|${manufacturer}|${variant}`;
    for (const property of ["apn", "supc", "gtin"]) if (code(product[property])) return `${property}|${code(product[property])}|${variant}`;
    if (text(product.distributor) && code(product.distributorNumber)) return `distributor|${text(product.distributor)}|${code(product.distributorNumber)}|${variant}`;
    if (vendor && text(product.description) && pack(product.packaging)) return `name|${vendor}|${text(product.description)}|${variant}`;
    return `id|${product.id || [vendor, text(product.description), variant].join("|")}`;
  }

  const primarySearch = product => [product?.description, product?.vendor, product?.brandName, product?.storage, product?.packaging, product?.manufacturerNumber, product?.apn, product?.supc, product?.gtin, product?.distributor, product?.distributorNumber].filter(Boolean).join(" ");
  function searchable(product) { return [primarySearch(product), ...(product?.searchAliases || [])].filter(Boolean).join(" "); }

  function resolve(product, stocks = defaults(), index = null) {
    if (!product) return null;
    index ||= stockIndex(stocks);
    const stock = stockMatch(product, stocks, index);
    const locked = Boolean(stock || product.linkedStockId || product.stockLockedAt || product.canonicalStockId);
    const explicitLinkedStockId = product.explicitLinkedStockId || (!product.canonicalStockId && product.linkedStockId) || "";
    if (!stock) return { ...product, explicitLinkedStockId, aliasProductIds: ids(product), isNewEventProduct: locked ? false : product.isNewEventProduct !== false, stockLockedAt: product.stockLockedAt || (locked ? "linked" : "") };
    const aliases = [...new Set([...ids(product), ...ids(stock)])];
    const related = [...new Set(tokens(stock).flatMap(token => [...(index.byToken.get(token) || [])]))].filter(member => same(stock, member) && compatible(stock, member));
    const unambiguousFamily = related.every((a, position) => related.slice(position + 1).every(b => compatible(a, b)));
    const codes = complementaryCodes(stock, [product, ...(unambiguousFamily ? related : [])]);
    return { ...product, ...stock, ...codes, id: product.id || stock.id, notes: product.notes || "", linkedStockId: stock.id, canonicalStockId: stock.id, explicitLinkedStockId, stockLockedAt: product.stockLockedAt || "matched", isNewEventProduct: false, aliasProductIds: aliases, searchAliases: [...new Set([...(product.searchAliases || []), ...(stock.searchAliases || []), primarySearch(product), primarySearch(stock), ...(unambiguousFamily ? related.map(primarySearch) : [])])] };
  }

  function choices(products, stocks = defaults()) {
    const stockIds = new Set(stocks.map(product => product.id));
    const index = stockIndex(stocks);
    const candidates = products.filter(Boolean).map(product => resolve(product, stocks, index));
    const preference = (a, b) => Number(!stockIds.has(a.id)) - Number(!stockIds.has(b.id)) || Number(Boolean(a.isNewEventProduct)) - Number(Boolean(b.isNewEventProduct)) || compare(a, b);
    // More complete records go first, keeping incomplete records from bridging
    // two genuinely different items into one suggestion.
    const completeness = product => ["manufacturerNumber", "apn", "supc", "gtin", "packaging", "storage"].filter(property => product[property]).length;
    candidates.sort((a, b) => completeness(b) - completeness(a) || preference(a, b));
    const groups = [], groupsByToken = new Map(), canonicalIdByGroup = new Map();
    for (const product of candidates) {
      const productTokens = tokens(product);
      const possible = new Set(productTokens.flatMap(token => [...(groupsByToken.get(token) || [])]));
      // A shared resolved stock ID is already authoritative in same(). Avoid
      // rescanning thousands of historical copies of that identical stock item.
      const matching = [...possible].filter(group => product.canonicalStockId && canonicalIdByGroup.get(group) === product.canonicalStockId || group.every(member => same(member, product)));
      const group = matching.length === 1 ? matching[0] : [];
      if (!group.length) {
        groups.push(group);
        canonicalIdByGroup.set(group, product.canonicalStockId || "");
      } else if (canonicalIdByGroup.get(group) !== product.canonicalStockId) canonicalIdByGroup.set(group, "");
      group.push(product);
      for (const token of productTokens) {
        if (!groupsByToken.has(token)) groupsByToken.set(token, new Set());
        groupsByToken.get(token).add(group);
      }
    }
    return groups.map(group => {
      const preferred = [...group].sort(preference)[0];
      return { ...preferred, ...complementaryCodes(preferred, group), notes: [...new Set(group.map(product => String(product.notes || "").trim()).filter(Boolean))].join("\n\n"), aliasProductIds: [...new Set(group.flatMap(ids))], searchAliases: [...new Set(group.flatMap(product => [primarySearch(product), ...(product.searchAliases || [])]))] };
    }).sort(compare);
  }

  window.foodBrokerProducts = Object.freeze({ same, stockMatch, choices, key, compare, resolve, searchable });
})();
