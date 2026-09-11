"use strict";
// Only the app's own local records are compressed; auth/session storage is untouched.
(() => {
  if (!window.LZString || window.foodBrokerCompactStorage) return;
  const storage = window.localStorage;
  const nativeGet = Storage.prototype.getItem;
  const nativeSet = Storage.prototype.setItem;
  const prefix = '~FBB-LZ1~';
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
    if (compressed.length >= text.length) return text;
    if (unpack(compressed) !== text) throw new Error('Storage verification failed; original data was preserved.');
    return compressed;
  };
  Storage.prototype.getItem = function(key) {
    const value = nativeGet.call(this,key);
    return this === storage && managed(key) ? unpack(value) : value;
  };
  Storage.prototype.setItem = function(key,value) {
    const text = String(value);
    return nativeSet.call(this,key,this === storage && managed(key) ? pack(text) : text);
  };
  let before = 0, after = 0;
  const keys = Array.from({length:storage.length},(_,index) => storage.key(index)).filter(managed);
  keys.sort((a,b) => (nativeGet.call(storage,b)?.length || 0) - (nativeGet.call(storage,a)?.length || 0));
  for (const key of keys) {
    const original = nativeGet.call(storage,key);
    if (original === null) continue;
    before += original.length;
    try {
      const compact = pack(unpack(original));
      // setItem is atomic: failure leaves the existing value in place.
      if (compact !== original) nativeSet.call(storage,key,compact);
    } catch (error) { console.warn('Could not compact local app storage.',error); }
    after += (nativeGet.call(storage,key) || '').length;
  }
  window.foodBrokerCompactStorage = {savedCharacters:Math.max(0,before-after)};
})();
