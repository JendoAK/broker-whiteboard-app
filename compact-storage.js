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
    if (cached && cached.text === text && nativeGet.call(this,key) === cached.raw) return;
    const raw = pack(text);
    // A failed durable write must never enter the memo or report success.
    nativeSet.call(this,key,raw);
    remember(name,raw,text);
  };
  // Skip the old full localStorage recompression pass at startup.
  window.foodBrokerCompactStorage = { optimized: true };
})();
