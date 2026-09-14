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
    return compressed.length < text.length ? compressed : text;
  };
  Storage.prototype.getItem = function(key) {
    const value = nativeGet.call(this,key);
    return this === storage && managed(key) ? unpack(value) : value;
  };
  Storage.prototype.setItem = function(key,value) {
    const text = String(value);
    return nativeSet.call(this,key,this === storage && managed(key) ? pack(text) : text);
  };
  // Existing records are left untouched at startup. They will be compressed
  // naturally the next time each record is saved, avoiding expensive full-store
  // decompress/recompress work every time FoodBrokerBase launches.
  window.foodBrokerCompactStorage = {optimized:true};
})();
