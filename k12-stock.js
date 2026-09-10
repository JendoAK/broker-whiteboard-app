"use strict";
function k12ProductKey(product) {
  const vendor=String(product.vendor||'').trim().toLowerCase();
  const number=String(product.manufacturerNumber||'').trim().toLowerCase();
  return vendor && number && !['n/a','na','none','tbd','seasonal only'].includes(number) ? JSON.stringify([vendor,number]) : 'id:'+product.id;
}
function getCrossStockIndex() {
  const index=new Map();
  stockProducts.forEach(product=>{
    const key=k12ProductKey(product);
    if(key.startsWith('id:') || product.so==='Yes')return;
    const distributor=/^US Foods/i.test(product.distributor)?'US Foods':product.distributor==='Sysco'?'Sysco':'';
    if(!distributor)return;
    if(!index.has(key))index.set(key,new Set());
    index.get(key).add(distributor);
  });
  return index;
}
function renderCrossStockCheck(product,index) {
  const other=activeStockList==='usFoods'?'Sysco':activeStockList==='sysco'?'US Foods':'';
  if(!other || !index?.get(k12ProductKey(product))?.has(other))return '';
  return '<span class="cross-stock-check" title="Matched manufacturer and MF# in the '+other+' stock list">✓ Also stocked with '+other+'</span>';
}
function getK12Products() {
  const families=new Map();
  stockProducts.forEach(product=>{const key=k12ProductKey(product);if(!families.has(key))families.set(key,[]);families.get(key).push(product);});
  return [...families.values()].filter(items=>items.some(item=>item.k12)).map(items=>{
    const base=items.find(item=>item.k12);
    const usf=items.filter(item=>/^US Foods/i.test(item.distributor));const sysco=items.filter(item=>item.distributor==='Sysco');
    const codes=(items,key)=>[...new Set(items.map(item=>item[key]).filter(Boolean))].join(', ');
    return {...base,apn:codes(usf,'apn'),supc:codes(sysco,'supc'),k12Usf:usf.some(item=>item.so!=='Yes'),k12Sysco:sysco.some(item=>item.so!=='Yes'),k12SpecialOrder:items.some(item=>item.so==='Yes')};
  });
}
function renderK12Stocking(product) {
  if(activeStockList!=='k12')return '';
  return '<div class="k12-stocking">'+[product.k12Usf?'✓ US Foods':'US Foods: not stocked',product.k12Sysco?'✓ Sysco':'Sysco: not stocked',product.k12SpecialOrder?'Special-order listing':''].filter(Boolean).map(text=>'<span>'+escapeHtml(text)+'</span>').join('')+'</div>';
}
function openK12ProductPicker() {
  const dialog=createVisitDialog('Choose school products');const body=dialog.querySelector('[data-visit-entry-body]');
  body.innerHTML='<p>Select products to include in K-12. Matched manufacturer numbers will show codes from both distributor lists.</p><input type="search" aria-label="Search stock products" placeholder="Search product, vendor, MF#, APN or SUPC"><div class="visit-product-choices" data-k12-choices></div><button type="button" class="primary-action" data-k12-save>Add selected to K-12</button>';
  const selected=new Set();
  const render=()=>{const query=body.querySelector('input').value.toLowerCase();const included=new Set(getK12Products().map(k12ProductKey));const seen=new Set();const choices=stockProducts.filter(product=>{const key=k12ProductKey(product);if(included.has(key)||seen.has(key)||!getStockSearchText(product).includes(query))return false;seen.add(key);return true;});body.querySelector('[data-k12-choices]').innerHTML=choices.map(product=>'<label class="visit-product-choice"><input type="checkbox" value="'+escapeAttribute(product.id)+'" '+(selected.has(product.id)?'checked':'')+'><span><strong>'+escapeHtml(product.description)+'</strong><small>'+escapeHtml([product.vendor,'MF#: '+(product.manufacturerNumber||'Not assigned'),product.distributor].join(' · '))+'</small></span></label>').join('')||'<p>No matching products to add.</p>';body.querySelectorAll('input[type=checkbox]').forEach(input=>input.onchange=()=>input.checked?selected.add(input.value):selected.delete(input.value));};
  body.querySelector('input').oninput=render;
  body.querySelector('[data-k12-save]').onclick=()=>{if(!selected.size)return;const previous=stockProducts;stockProducts=stockProducts.map(product=>selected.has(product.id)?stampSharedRecord({...product,k12:true,updatedAt:new Date().toISOString()},'Added to K-12'):product);if(!persistStockProducts()){stockProducts=previous;return;}renderStockLists();dialog.close();};render();dialog.showModal();
}
window.addEventListener('DOMContentLoaded',()=>document.getElementById('chooseK12Products').onclick=openK12ProductPicker);
