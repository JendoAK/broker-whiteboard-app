"use strict";
importScripts('./vendor/lz-string.js?v=1.5.0');
self.onmessage = ({data}) => {
  try {
    const compressed = '~FBB-LZ1~' + LZString.compressToUTF16(data.text);
    self.postMessage({id: data.id, raw: compressed.length < data.text.length ? compressed : data.text});
  } catch (error) {
    self.postMessage({id: data.id, error: error?.message || 'Could not prepare the browser copy.'});
  }
};
