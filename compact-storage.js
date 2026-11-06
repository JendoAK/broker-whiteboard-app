"use strict";
// Only the app's own local records are compressed; auth/session storage is untouched.
(() => {
  if (!window.LZString || window.foodBrokerCompactStorage) return;
  const storage = window.localStorage;
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const prefix = '~FBB-LZ1~';
  // Repeated saves and refreshes often read or write the identical collection.
  // Still check native storage on every read so other tabs remain authoritative.
  const memo = new Map();
  const backgroundKeys = new Set(['cards','todos','address-book','people-contacts','stock-lists','manual-vendor-reports','sample-tracker','dot-orders','nestle-machines','market-visits','market-visits-new-products'].map(name => 'broker-whiteboard-' + name));
  const pending = new Map();
  let worker, running, sequence = 0, workerUnavailable = false;
  let memoChars = 0;
  const remember = (key, raw, text) => {
    const old = memo.get(key);
    if (old) { memoChars -= old.size; memo.delete(key); }
    const size = (raw?.length || 0) + (text?.length || 0);
    if (size > 16 * 1024 * 1024) return;
    while (memo.size >= 24 || memoChars + size > 16 * 1024 * 1024) {
      const first = memo.keys().next().value;
      if (first === undefined) break;
      memoChars -= memo.get(first).size; memo.delete(first);
    }
    memo.set(key, {raw, text, size}); memoChars += size;
  };
  const managed = key => String(key).startsWith('broker-whiteboard-');
  const unpack = value => {
    if (value === null || !value.startsWith(prefix)) return value;
    const text = LZString.decompressFromUTF16(value.slice(prefix.length));
    if (text === null) throw new Error('The saved browser copy could not be read. Keep your backup and contact support.');
    return text;
  };
  const pack = text => {
    if (text.length < 1024) return text;
    const compressed = prefix + LZString.compressToUTF16(text);
    return compressed.length < text.length ? compressed : text;
  };
  const finish = (key, error) => {
    const entry = pending.get(key);
    if (!entry) return;
    pending.delete(key);
    entry.waiters.forEach(waiter => error ? waiter.reject(error) : waiter.resolve());
  };
  const disableWorker = error => {
    workerUnavailable = true;
    worker?.terminate(); worker = null; running = null;
    [...pending.keys()].forEach(key => finish(key, error));
  };
  const drain = () => {
    if (running || !worker || !pending.size) return;
    const [key, entry] = pending.entries().next().value;
    running = {key, id: entry.id};
    try { worker.postMessage({id: entry.id, text: entry.text}); }
    catch (error) { disableWorker(error); }
  };
  const startWorker = () => {
    if (workerUnavailable || typeof window.Worker !== 'function') return false;
    if (worker) return true;
    try {
      worker = new window.Worker('compact-storage-worker.js?v=20261106-entryspeed1');
      worker.onerror = () => disableWorker(new Error('Background browser saving stopped. Your recorded edits are kept for retry.'));
      worker.onmessage = ({data}) => {
        if (!running || data?.id !== running.id) return;
        const {key} = running; running = null;
        const entry = pending.get(key);
        // A later edit owns this cache. Earlier waiters follow the newest write.
        if (entry?.id === data.id) {
          try {
            if (data.error || typeof data.raw !== 'string') throw new Error(data.error || 'Could not prepare the browser copy.');
            // Never replace a copy written by a different window while working.
            if (nativeGet.call(storage, key) !== entry.base) throw new Error('Another window updated this browser copy. Your recorded edits are kept and will retry.');
            nativeSet.call(storage, key, data.raw);
            remember(key, data.raw, entry.text);
            finish(key);
          } catch (error) { finish(key, error); }
        }
        drain();
      };
      return true;
    } catch (_) { workerUnavailable = true; return false; }
  };
  const enqueue = (key, text) => new Promise((resolve, reject) => {
    let entry = pending.get(key);
    if (!entry || entry.text !== text) {
      entry = {id: ++sequence, text, base: nativeGet.call(storage, key), waiters: entry?.waiters || []};
      pending.set(key, entry);
    }
    entry.waiters.push({resolve, reject});
    drain();
  });
  const cachedWrite = (key, text) => {
    const cached = memo.get(key);
    return cached && cached.text === text && nativeGet.call(storage, key) === cached.raw;
  };
  const canBackground = (key, text) => backgroundKeys.has(key) && text.length >= 256 * 1024 && startWorker();
  window.addEventListener?.('foodbrokerbase:workspace-leaving', () => disableWorker(new Error('The workspace closed. Recorded edits remain saved for the next sign-in.')));
  Storage.prototype.getItem = function(key) {
    const value = nativeGet.call(this,key);
    if (this !== storage || !managed(key)) return value;
    const name = String(key), cached = memo.get(name);
    if (cached && cached.raw === value) return cached.text;
    const text = unpack(value);
    remember(name,value,text);
    return text;
  };
  Storage.prototype.setItem = function(key,value) {
    const text = String(value);
    if (this !== storage || !managed(key)) return nativeSet.call(this,key,text);
    const name = String(key), cached = memo.get(name);
    if (cached && cached.text === text && nativeGet.call(this,key) === cached.raw) {finish(name); return;}
    const raw = pack(text);
    // A failed durable write must never enter the memo or report success.
    nativeSet.call(this,key,raw);
    remember(name,raw,text);
    finish(name);
  };
  // Skip the old full localStorage recompression pass at startup.
  window.foodBrokerCompactStorage = {
    optimized: true,
    // Only callers that have already written a durable edit may use defer.
    // The ordinary Storage API always remains a synchronous durable write.
    defer(key, value, onError) {
      key = String(key); const text = String(value);
      if (cachedWrite(key, text)) {finish(key); return true;}
      if (!canBackground(key, text)) return false;
      enqueue(key, text).catch(error => onError?.(error));
      return true;
    },
    async writeAsync(key, value) {
      key = String(key); const text = String(value);
      if (cachedWrite(key, text)) {finish(key); return;}
      if (canBackground(key, text)) return await enqueue(key, text);
      storage.setItem(key, text);
    }
  };
})();
