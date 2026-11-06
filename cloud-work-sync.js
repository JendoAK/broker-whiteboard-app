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

  // Small, independent edit records survive a closed window and cannot be
  // replaced by another window's whole-collection cache or global retry list.
  function createOutbox(storage) {
    const prefix = (userId, sectionKey) => `broker-whiteboard-work-outbox:${encodeURIComponent(userId)}:${encodeURIComponent(sectionKey)}:`;
    const changes = (before, after) => {
      const old = new Map(before.map(item => [item.id, item]));
      const next = new Map(after.map(item => [item.id, item]));
      const ids = [...new Set([...old.keys(), ...next.keys()])].filter(id => !equal(old.get(id), next.get(id)));
      const base = [], value = [];
      for (const id of ids) {
        if (!old.has(id)) {value.push(copy(next.get(id))); continue;}
        if (!next.has(id)) {base.push({id}); continue;}
        const before = {id}, after = {id};
        for (const key of new Set([...Object.keys(old.get(id)), ...Object.keys(next.get(id))])) {
          if (key === 'id' || equal(old.get(id)[key], next.get(id)[key])) continue;
          if (own(old.get(id), key)) before[key] = copy(old.get(id)[key]);
          if (own(next.get(id), key)) after[key] = copy(next.get(id)[key]);
        }
        base.push(before); value.push(after);
      }
      return {base, value};
    };
    function list(userId, sectionKey) {
      const start = prefix(userId, sectionKey), entries = [];
      for (let index = 0; index < storage.length; index++) {
        const key = storage.key(index);
        if (!key?.startsWith(start)) continue;
        const raw = storage.getItem(key);
        if (!raw) continue;
        let entry;
        try {entry = JSON.parse(raw);} catch (_) { /* Report an unreadable edit rather than discard it. */ }
        if (![1, 2].includes(entry?.format) || !Number.isFinite(entry.order) || !Array.isArray(entry.base) || !Array.isArray(entry.value)) {
          throw new Error("A saved update could not be read. Keep this window open and export a backup.");
        }
        entries.push({...entry, key, raw});
      }
      return entries.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
    }
    function acknowledge(entries) {
      for (const entry of entries) {
        // A note may have changed again while its earlier text was uploading.
        if (storage.getItem(entry.key) === entry.raw) storage.removeItem(entry.key);
      }
    }
    function keep(userId, sectionKey, before, after, draftKey, {first = false} = {}) {
      const entries = list(userId, sectionKey);
      const prior = entries.find(entry => entry.key === draftKey);
      const base = prior?.base || before;
      const delta = changes(base, typeof after === "function" ? after(copy(base)) : after);
      if (!delta.base.length && !delta.value.length) {
        if (prior) acknowledge([prior]);
        return null;
      }
      const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const key = prior?.key || prefix(userId, sectionKey) + id;
      const order = first ? Math.min(Date.now(), entries[0]?.order ?? Infinity) - 1
        : Math.max(Date.now(), (entries.at(-1)?.order || 0) + 1);
      const raw = JSON.stringify({format: 2, order, ...delta});
      storage.setItem(key, raw);
      return {key, raw};
    }
    return {list, keep, acknowledge};
  }

  function createJournal(outbox, sections, readRaw = section => section.get()) {
    const snapshots = new Map(), boot = new Map();
    for (const section of sections) {
      snapshots.set(section.key, copy(section.get()));
      boot.set(section.key, copy(readRaw(section)));
    }
    return {
      capture(userId, section) {
        if (!userId || !snapshots.has(section.key)) return null;
        return outbox.keep(userId, section.key, snapshots.get(section.key), section.get());
      },
      accept(section) {if (snapshots.has(section.key)) snapshots.set(section.key, copy(section.get()));},
      snapshot(key) {return copy(snapshots.get(key));},
      boot(key) {return copy(boot.get(key));}
    };
  }

  // An obsolete app can replace a browser cache without recording an edit.
  // Only records with evidence of a newer edit may be imported once. Missing
  // rows/fields in an old schema never mean delete or clear current data.
  function verifiedLegacyChanges(base, local, remote, remoteVersion) {
    const previous = Array.isArray(base) ? base : remote;
    const old = new Map(previous.map(item => [item.id, item]));
    const current = new Map(remote.map(item => [item.id, item]));
    const result = copy(previous);
    const modified = item => Math.max(0, ...[item?.updatedAt, item?._audit?.at, ...(item?._activity || []).map(event => event.at)].map(value => Date.parse(value) || 0));
    for (const item of local || []) {
      if (!item?.id) continue;
      const before = old.get(item.id), there = current.get(item.id);
      if (before && !there) continue;
      const threshold = before ? Math.max(modified(before), modified(there)) : Date.parse(remoteVersion) || 0;
      if (!modified(item) || modified(item) <= threshold) continue;
      const index = result.findIndex(value => value.id === item.id);
      const value = {...copy(before || {}), ...copy(item)};
      if (index < 0) result.push(value); else result[index] = value;
    }
    return {base: copy(previous), value: result};
  }

  function applyEdits(value, entries) {
    return entries.reduce((current, entry) => {
      if (entry.format !== 2) return merge(entry.base, entry.value, current);
      // A field edit cannot recreate a record deleted on another device.
      // New records have no base; deliberate deletions have no next value.
      const present = new Set(current.map(item => item.id));
      const existing = new Set(entry.base.map(item => item.id));
      const next = entry.value.filter(item => !existing.has(item.id) || present.has(item.id));
      return merge(entry.base, next, current);
    }, copy(value));
  }

  async function save(client, options) {
    const {table, userId, payload, normalize, isCurrent} = options;
    const original = copy(options.local);
    const base = options.base;
    const journalled = Array.isArray(options.edits);
    let remote = journalled ? undefined : base;
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
      if (journalled && !options.edits.length) return remote;
      const value = journalled ? applyEdits(remote.value, options.edits) : merge(base?.value, original, remote.value);
      const data = {...payload.data, value, syncProtocol: 3, syncWriteBase: remote.version};
      valid();
      const query = remote.version
        ? filters(client.from(table).update({data, updated_by: userId})).eq("updated_at", remote.version)
        : client.from(table).insert({...payload, data});
      const result = await query.select("record_key,data,updated_at");
      valid();
      const conflict = result.error && (["23505", "PT409", "40001"].includes(result.error.code) || Number(result.error.status || result.status) === 409);
      if (result.error && !conflict) throw result.error;
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

  async function saveDirectory(client, options) {
    const {payload, normalize, isCurrent, edits} = options;
    const valid = () => {if (!isCurrent()) throw new Error('The signed-in account changed. Your browser copy has been kept.');};
    const read = async () => {
      valid();
      const {data, error} = await client.from('team_app_records').select('record_key,data,updated_at')
        .eq('record_type', payload.record_type).eq('record_key', payload.record_key).maybeSingle();
      if (error) throw error;
      valid();
      return {version: data?.data?.directoryRevision || data?.updated_at || null, value: normalize(data?.data?.value || []), data: data?.data || {}};
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      const remote = await read();
      if (!edits.length) return remote;
      const value = applyEdits(remote.value, edits);
      valid();
      const {data, error, status} = await client.rpc('save_team_directory_section', {
        section_key: payload.record_key, expected_updated_at: remote.version,
        section_value: {...remote.data, ...payload.data, value, syncProtocol: 3}
      });
      valid();
      if (error) {
        if (['PT409', '40001'].includes(error.code) || Number(error.status || status) === 409) continue;
        throw error;
      }
      if (typeof data?.updatedAt !== 'string' || !data.updatedAt) throw new Error('The cloud did not confirm the directory save. Your changes are kept in this browser.');
      return {version: data.updatedAt, value};
    }
    throw new Error('Contacts changed during this save. Your recorded edits are kept and will retry against the latest version.');
  }

  const api = {equal, merge, createBases, createIndexedBases, createOutbox, createJournal, verifiedLegacyChanges, applyEdits, save, saveDirectory};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else window.foodBrokerWorkSync = api;
})();
