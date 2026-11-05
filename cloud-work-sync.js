"use strict";

// App records are stored as collections. Apply only the changes made
// since this browser's last confirmed copy, then compare the cloud version.
(() => {
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  function equal(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, index) => equal(value, b[index]));
    if (!object(a) || !object(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => own(b, key) && equal(a[key], b[key]));
  }

  function merge(base, local, remote) {
    if (equal(local, base)) return copy(remote);
    if (equal(remote, base) || equal(local, remote)) return copy(local);
    if (Array.isArray(local) && Array.isArray(remote)) {
      const before = Array.isArray(base) ? base : [];
      const values = [...before, ...local, ...remote];
      const records = values.every(item => object(item) && typeof item.id === "string" && item.id);
      const primitives = values.every(item => item === null || ["string", "number", "boolean"].includes(typeof item));
      if (!records && !primitives) return copy(local);
      const key = item => records ? item.id : JSON.stringify(item);
      const old = new Map(before.map(item => [key(item), item]));
      const here = new Map(local.map(item => [key(item), item]));
      const there = new Map(remote.map(item => [key(item), item]));
      const result = [];
      for (const id of new Set([...there.keys(), ...here.keys()])) {
        // Absence is a deletion only when the item was in the known base.
        if (!here.has(id)) { if (!old.has(id)) result.push(copy(there.get(id))); continue; }
        if (!there.has(id)) {
          if (!old.has(id) || !equal(here.get(id), old.get(id))) result.push(copy(here.get(id)));
          continue;
        }
        result.push(records ? merge(old.get(id), here.get(id), there.get(id)) : copy(here.get(id)));
      }
      return result;
    }
    if (object(local) && object(remote)) {
      const before = object(base) ? base : {};
      const result = {};
      for (const key of new Set([...Object.keys(remote), ...Object.keys(local)])) {
        if (!own(local, key)) { if (!own(before, key)) result[key] = copy(remote[key]); continue; }
        if (!own(remote, key)) {
          if (!own(before, key) || !equal(local[key], before[key])) result[key] = copy(local[key]);
          continue;
        }
        // An audit stamp belongs to one author and must stay together.
        result[key] = ["_audit", "_createdAudit"].includes(key)
          ? copy(equal(local[key], before[key]) ? remote[key] : local[key])
          : merge(before[key], local[key], remote[key]);
      }
      return result;
    }
    return copy(local);
  }

  function createBases(storage) {
    const memory = new Map();
    const storageKey = (userId, sectionKey) => `broker-whiteboard-work-base:${userId}:${sectionKey}`;
    return {
      get(userId, sectionKey) {
        const key = storageKey(userId, sectionKey);
        if (!memory.has(key)) {
          let saved;
          try {
            const value = JSON.parse(storage.getItem(key) || "null");
            if (value && own(value, "value") && (typeof value.version === "string" || value.version === null)) saved = value;
          } catch (_) { /* An unknown base uses a conservative merge. */ }
          memory.set(key, saved);
        }
        return memory.get(key);
      },
      remember(userId, sectionKey, snapshot) {
        const key = storageKey(userId, sectionKey);
        if (equal(memory.get(key), snapshot)) return;
        const saved = copy(snapshot);
        storage.setItem(key, JSON.stringify(saved));
        memory.set(key, saved);
      },
      clear() { memory.clear(); }
    };
  }

  function createIndexedBases(indexedDB, fallbackStorage) {
    if (!indexedDB) return createBases(fallbackStorage);
    const memory = new Map(), legacy = createBases(fallbackStorage);
    let connection;
    function open() {
      if (!connection) connection = new Promise((resolve, reject) => {
        const request = indexedDB.open("FoodBrokerBaseSync", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("bases");
        request.onerror = () => {connection = null; reject(request.error);};
        request.onblocked = () => {connection = null; reject(new Error("The browser sync cache is waiting for another app window. Close the older window and retry."));};
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {db.close(); connection = null;};
          resolve(db);
        };
      });
      return connection;
    }
    async function transact(key, value, writing) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("bases", writing ? "readwrite" : "readonly");
        const store = transaction.objectStore("bases");
        const request = writing ? store.put(value, key) : store.get(key);
        let result;
        request.onsuccess = () => {result = request.result;};
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error("The browser could not keep the sync copy."));
      });
    }
    return {
      async get(userId, sectionKey) {
        const key = JSON.stringify([userId, sectionKey]);
        if (!memory.has(key)) {
          const saved = await transact(key);
          memory.set(key, saved || legacy.get(userId, sectionKey));
        }
        return memory.get(key);
      },
      async remember(userId, sectionKey, snapshot) {
        const key = JSON.stringify([userId, sectionKey]);
        if (equal(memory.get(key), snapshot)) return;
        const saved = copy(snapshot);
        // Wait for transaction completion, not just the individual request.
        await transact(key, saved, true);
        memory.set(key, saved);
      },
      clear() {memory.clear(); legacy.clear();}
    };
  }

  async function save(client, options) {
    const {table, userId, payload, normalize, isCurrent} = options;
    const original = copy(options.local);
    const base = options.base;
    let remote = base;
    const valid = () => {
      if (!isCurrent()) throw new Error("The signed-in account changed. Your browser copy has been kept.");
    };
    const filters = query => {
      query = query.eq("record_type", payload.record_type).eq("record_key", payload.record_key);
      return table === "app_records" ? query.eq("owner_id", userId) : query;
    };
    const read = async () => {
      valid();
      const {data, error} = await filters(client.from(table).select("record_key,data,updated_at")).limit(1);
      if (error) throw error;
      valid();
      const row = data?.[0];
      return {version: row?.updated_at || null, value: normalize(row?.data?.value || [])};
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!remote) remote = await read();
      const value = merge(base?.value, original, remote.value);
      const data = {...payload.data, value};
      valid();
      const query = remote.version
        ? filters(client.from(table).update({data, updated_by: userId})).eq("updated_at", remote.version)
        : client.from(table).insert({...payload, data});
      const result = await query.select("record_key,data,updated_at");
      valid();
      if (result.error && result.error.code !== "23505") throw result.error;
      const row = result.data?.[0];
      if (!result.error && row?.updated_at) {
        const confirmed = normalize(row.data?.value);
        if (!equal(confirmed, value)) throw new Error("The cloud did not confirm the complete save. Your changes are kept in this browser.");
        return {version: row.updated_at, value: confirmed};
      }
      // A zero-row UPDATE is a version conflict, not a successful save.
      // A simultaneous first INSERT is handled by reading and merging again.
      remote = await read();
    }
    throw new Error("This task or calendar changed on another device while saving. Your changes are kept in this browser and will retry.");
  }

  const api = {equal, merge, createBases, createIndexedBases, save};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else window.foodBrokerWorkSync = api;
})();
