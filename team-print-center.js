/* The team Print center projects already-authorized product data into print-only drafts. */
(function () {
  "use strict";
  const text = value => String(value == null ? "" : value);
  const esc = value => text(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const normal = value => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const roles = new Set(["member","admin","super_user"]);
  const pageSize = 100;
  const productFields = ["description","vendor","brandName","brandType","distributor","distributorNumber","manufacturerNumber","apn","supc","gtin","packaging","storage","updatedAt"];
  const distributorLogos = {usFoods:["us-foods-logo.svg","US Foods"],sysco:["sysco-logo.png?v=20260917-official1","Sysco"],linford:["linford-logo.svg","Linford"],qualitySales:["quality-sales-logo.png","Quality Sales"]};
  let dialog, labels;
  const state = {uid:"",role:"",generation:0,stock:[],new:[],all:new Map(),events:[],eventProducts:new Map(),selected:new Set(),visibleLimit:pageSize,frames:new Set()};
  const $ = id => document.getElementById(id);
  const auth = () => window.foodBrokerBaseAuth;
  function teamIdentity() {
    const profile = auth()?.getCurrentProfile?.(), user = auth()?.getCurrentUser?.();
    if(profile?.id && text(profile.id)!==text(user?.id))return null;
    return user?.id && roles.has(profile?.role) && !auth()?.isPasswordRecovery?.() ? {uid:text(user.id),role:profile.role} : null;
  }
  function allowed() {const current=teamIdentity();return Boolean(dialog?.open && current && current.uid===state.uid && current.role===state.role);}
  function identity() {return {uid:state.uid,role:state.role,generation:state.generation};}
  function valid(value) {return allowed() && value.uid===state.uid && value.role===state.role && value.generation===state.generation;}
  function productKey(product) {return product.kind+":"+product.id;}
  function family(product) {
    const value=normal(product.distributor);
    if(/^us\s*foods\b/.test(value))return "usFoods";
    if(value.includes("sysco"))return "sysco";
    if(value.includes("linford"))return "linford";
    if(/^quality\s*sales$/.test(value))return "qualitySales";
    return "other";
  }
  function itemNumber(product) {return ["usFoods","sysco"].includes(family(product)) ? "" : product.distributorNumber;}
  function codes(product) {return [["MF#",product.manufacturerNumber],["APN",product.apn],["SUPC",product.supc],["Item#",itemNumber(product)]].filter(([,value])=>value).map(([label,value])=>label+" "+value).join(" · ");}
  function status(message,tone="") {$("tpStatus").textContent=message;$("tpStatus").dataset.tone=tone;}
  function projection(product,kind,id) {
    const projected={kind,id:text(id == null ? product.id : id)};
    for(const field of productFields)projected[field]=text(product[field]);
    if(!projected.description)projected.description="Untitled product";
    return Object.freeze(projected);
  }
  function safeStocks() {return typeof stockProducts!=="undefined" && Array.isArray(stockProducts) ? stockProducts : [];}
  function safeNewProducts() {return typeof eventProducts!=="undefined" && Array.isArray(eventProducts) ? eventProducts : [];}
  function safeEvents() {return typeof marketVisits!=="undefined" && Array.isArray(marketVisits) ? marketVisits : [];}
  function sortProducts(a,b) {
    return window.foodBrokerProducts?.compare ? window.foodBrokerProducts.compare(a,b) : a.description.localeCompare(b.description) || a.vendor.localeCompare(b.vendor) || productKey(a).localeCompare(productKey(b));
  }
  function resolveStock(product,stocks,stockById) {
    const explicit=product.canonicalStockId || product.linkedStockId;
    if(explicit)return stockById.get(text(explicit)) || null;
    // A bare ID is namespaced by collection. Do not infer a link merely because
    // an unrelated stock and new-product record happen to have the same ID.
    return window.foodBrokerProducts?.stockMatch?.({...product,id:"",aliasProductIds:[]},stocks) || null;
  }
  function snapshot() {
    if(!allowed())return;
    const stocks=safeStocks(),newProducts=safeNewProducts(),stockById=new Map(stocks.map(p=>[text(p.id),p]));
    const stockCache=new Map(stocks.map((p,index)=>{const row=projection(p,"stock",p.id || "stock-row-"+index);return [row.id,row];}));
    const aliases=new Map(),newRows=[];
    newProducts.forEach((product,index)=>{
      const replacement=resolveStock(product,stocks,stockById);
      if(replacement){aliases.set("new:"+text(product.id),"stock:"+text(replacement.id));return;}
      newRows.push(projection(product,"new",product.id || "new-row-"+index));
    });
    state.stock=[...stockCache.values()].sort(sortProducts);
    state.new=[...new Map(newRows.map(product=>[productKey(product),product])).values()].sort(sortProducts);
    state.all=new Map([...state.stock,...state.new].map(product=>[productKey(product),product]));
    state.selected=new Set([...state.selected].map(key=>aliases.get(key)||key).filter(key=>state.all.has(key)));
    state.events=[];state.eventProducts.clear();
    const collidingIds=new Set(newProducts.filter(p=>stockById.has(text(p.id))).map(p=>text(p.id)));
    safeEvents().forEach((event,index)=>{
      if(event.archivedAt || event.deletedAt)return;
      const id=text(event.id || "event-row-"+index),date=text(event.startDate || event.date),summary=Object.freeze({id,name:text(event.name || "Event"),date});
      let lineup;
      if(!collidingIds.size && typeof getMarketVisitProducts==="function")lineup=getMarketVisitProducts(event).map(product=>({product,kind:""}));
      else lineup=[...(Array.isArray(event.productIds)?event.productIds:[]).map(id=>({product:stockById.get(text(id)),kind:"stock"})),...(Array.isArray(event.newProductIds)?event.newProductIds:[]).map(id=>({product:newProducts.find(p=>text(p.id)===text(id)),kind:"new"}))].filter(entry=>entry.product);
      const projected=(Array.isArray(lineup)?lineup:[]).map(({product,kind})=>{
        const linked=product.canonicalStockId || product.linkedStockId;
        const sourceStock=linked ? stockById.get(text(linked)) : kind==="stock" ? stockById.get(text(product.id)) : kind==="new" ? null : stocks.includes(product) ? product : !product.isNewEventProduct && stockById.get(text(product.id));
        const sourceNew=newProducts.find(p=>p===product || text(p.id)===text(product.id));
        const replacement=sourceStock || (sourceNew ? resolveStock(product,stocks,stockById) : null);
        if(replacement){const cached=stockCache.get(text(replacement.id));return kind==="" ? projection({...replacement,...product},"stock",replacement.id) : cached || projection(product,"stock",replacement.id);}
        if(state.all.has("new:"+text(product.id)))return state.all.get("new:"+text(product.id));
        if(state.all.has("stock:"+text(product.id)))return state.all.get("stock:"+text(product.id));
        return projection(product,sourceNew?"new":"stock",product.id);
      });
      state.events.push(summary);
      state.eventProducts.set(id,[...new Map(projected.map(product=>[productKey(product),product])).values()].sort(sortProducts));
    });
    state.events.sort((a,b)=>b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
    const source=$("psPrintSource").value;
    $("psPrintSource").innerHTML='<option value="selected">Selected products</option><option value="shown">Current product search</option>'+state.events.map(event=>'<option value="event:'+esc(event.id)+'">'+esc(event.name)+(event.date?' · '+esc(event.date.slice(0,10)):'')+'</option>').join("");
    if([...$("psPrintSource").options].some(option=>option.value===source))$("psPrintSource").value=source;
    state.visibleLimit=pageSize;renderPicker();
  }
  function shownProducts() {
    const source=$("tpCollection").value==="new"?state.new:state.stock,query=normal($("tpSearch").value),distributor=$("tpDistributor").value;
    return source.filter(product=>(!distributor || family(product)===distributor) && (!query || normal([product.description,product.vendor,product.brandName,product.distributor,codes(product),product.packaging,product.storage].join(" ")).includes(query)));
  }
  function printProducts() {
    if(!allowed())return [];
    const source=$("psPrintSource").value;
    if(source==="shown")return shownProducts();
    if(source.startsWith("event:"))return state.eventProducts.get(source.slice(6)) || [];
    return [...state.selected].map(key=>state.all.get(key)).filter(Boolean);
  }
  function updateSummary() {
    if(!allowed())return;
    labels.sync();
    renderPrintCount();
  }
  function renderPrintCount() {
    if(!allowed())return;
    const count=labels?.getProducts().length || 0;
    $("psPrintSummary").textContent=count+" product"+(count===1?"":"s")+" selected to print. "+($("psPrintFormat").value==="labels"?"One label per product is the default. Choose products below; edit individual wording, logos and quantities in Label setup.":"Choose products below and a distributor logo before printing.");
  }
  function renderPicker() {
    if(!allowed())return;
    const found=shownProducts(),visible=found.slice(0,state.visibleLimit);
    $("tpProductList").innerHTML=visible.length ? visible.map(product=>'<label class="tp-product-row"><input type="checkbox" data-tp-product="'+esc(productKey(product))+'"'+(state.selected.has(productKey(product))?' checked':'')+' /><span class="tp-product-info"><strong>'+esc(product.description)+'</strong><small>'+esc([product.vendor,product.brandName,product.distributor,codes(product),product.packaging,product.storage].filter(Boolean).join(" · "))+'</small></span></label>').join("") : '<p class="ps-empty">No products match this search.</p>';
    $("tpCount").textContent=found.length+" products"+(visible.length<found.length?" · first "+visible.length+" shown":"");
    $("tpSelectedCount").textContent=state.selected.size+" selected";
    $("tpLoadMore").hidden=visible.length>=found.length;$("tpClearSelection").disabled=!state.selected.size;$("tpSelectShown").disabled=!visible.length;
    updateSummary();
  }
  function cleanupFrames() {state.frames.forEach(frame=>frame.remove());state.frames.clear();}
  function clear() {
    state.generation++;state.uid="";state.role="";
    labels?.clear();cleanupFrames();state.stock=[];state.new=[];state.all.clear();state.events=[];state.eventProducts.clear();state.selected.clear();state.visibleLimit=pageSize;
    $("tpSearch").value="";$("tpCollection").value="stock";$("tpDistributor").value="";
    $("tpProductList").replaceChildren();$("tpCount").textContent="";$("tpSelectedCount").textContent="";
    $("psPrintSource").innerHTML='<option value="selected">Selected products</option><option value="shown">Current product search</option>';
    $("psPrintFormat").value="labels";$("psPrintLogo").value="none";$("psPrintHeading").value="Product presentation";$("psPrintCopies").value="1";$("psPrintSummary").textContent="";status("");
    $("tpLoadMore").hidden=true;$("tpClearSelection").disabled=true;
  }
  function close() {clear();if(dialog.open)dialog.close();}
  function open() {
    const current=teamIdentity();
    if(!current){if(dialog.open)close();return;}
    if(dialog.open && allowed())return;
    clear();state.uid=current.uid;state.role=current.role;dialog.showModal();snapshot();
    status("Choose products or an event lineup. Labels, product lists and presentation cards are available to every approved team member.");
  }
  const asset = value => new URL(value,window.location.href).href;
  function logoMarkup(choice) {return '<div class="ps-preview-logos"><img src="'+esc(asset("vendor-logos/pierce-cartwright.png"))+'" alt="Pierce Cartwright" />'+(distributorLogos[choice]?'<img src="'+esc(asset(distributorLogos[choice][0]))+'" alt="'+esc(distributorLogos[choice][1])+'" />':'')+'</div>';}
  function documentMarkup(products,format,logo,heading,copies) {
    const generic=products.some(itemNumber);
    if(format==="list")return '<section class="ps-sheet-preview">'+logoMarkup(logo)+'<h2>'+esc(heading)+'</h2><p>'+products.length+' products · '+esc(new Date().toLocaleDateString())+'</p><table class="ps-preview-table"><thead><tr><th>Product</th><th>Vendor / brand</th><th>MF#</th><th>APN</th><th>SUPC</th>'+(generic?'<th>Item #</th>':'')+'<th>Pack / storage</th></tr></thead><tbody>'+products.map(product=>'<tr><td>'+esc(product.description)+'</td><td>'+esc([product.vendor,product.brandName].filter(Boolean).join(" · "))+'</td><td>'+esc(product.manufacturerNumber)+'</td><td>'+esc(product.apn)+'</td><td>'+esc(product.supc)+'</td>'+(generic?'<td>'+esc(itemNumber(product))+'</td>':'')+'<td>'+esc([product.packaging,product.storage].filter(Boolean).join(" · "))+'</td></tr>').join("")+'</tbody></table></section>';
    return products.flatMap(product=>Array.from({length:copies},()=>'<section class="ps-sheet-preview ps-preview-cards"><article class="ps-preview-label">'+logoMarkup(logo)+'<div><p>'+esc([product.vendor,product.brandName].filter(Boolean).join(" · "))+'</p><h3>'+esc(product.description)+'</h3><p>'+esc(codes(product))+'</p><p>'+esc([product.packaging,product.storage].filter(Boolean).join(" · "))+'</p></div></article></section>')).join("");
  }
  function sendDocument(markup,format,heading,revision) {
    if(!allowed() || revision!==labels.getRevision())return;
    const captured=identity(),frame=document.createElement("iframe");
    frame.title="Product print preview";frame.style.cssText="position:fixed;width:816px;height:1056px;left:-20000px;top:0;border:0;visibility:hidden";state.frames.add(frame);
    const dimensions=format==="cards"?'@page{size:letter portrait;margin:.5in}.ps-sheet-preview{break-after:page}.ps-preview-label{width:6in;height:4in;border:1px dashed #aaa;padding:.25in;margin:auto;overflow:hidden;box-sizing:border-box}.ps-preview-label h3{font-size:23pt}.ps-preview-label p{font-size:12pt}':'@page{size:letter portrait;margin:.5in}thead{display:table-header-group}tr{break-inside:avoid}';
    frame.srcdoc='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(heading)+'</title><style>body{font-family:Arial,sans-serif;margin:0;color:#203d39}*{box-sizing:border-box}h2{font-size:17pt}h3,p{margin:4px 0}.ps-preview-logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.ps-preview-logos img{height:34px;max-width:105px;object-fit:contain}.ps-preview-label{display:flex;flex-direction:column;justify-content:space-between;break-inside:avoid;overflow-wrap:anywhere}.ps-preview-label .ps-preview-logos{margin:0}.ps-preview-label .ps-preview-logos img{height:20px;max-width:80px}.ps-preview-table{border-collapse:collapse;width:100%;font-size:9pt}.ps-preview-table th,.ps-preview-table td{border:1px solid #c5cfc7;padding:6px;text-align:left;overflow-wrap:anywhere}.ps-preview-table th{background:#f6dc83}.ps-sheet-preview:last-child{break-after:auto}'+dimensions+'</style></head><body>'+markup+'</body></html>';
    frame.onload=async()=>{
      try {
        await Promise.race([Promise.all([frame.contentDocument.fonts.ready,...[...frame.contentDocument.images].map(image=>image.decode())]),new Promise((_,reject)=>setTimeout(()=>reject(new Error("A print logo did not finish loading. Choose No distributor logo or try again.")),8000))]);
        if(!valid(captured) || revision!==labels.getRevision()){frame.remove();state.frames.delete(frame);return;}
        if(format==="cards" && [...frame.contentDocument.querySelectorAll(".ps-preview-label")].some(card=>card.scrollHeight>card.clientHeight+1 || card.scrollWidth>card.clientWidth+1))throw new Error("A presentation card has more text than fits. Shorten the product wording or print a product list.");
        frame.contentWindow.addEventListener("afterprint",()=>{frame.remove();state.frames.delete(frame);},{once:true});frame.contentWindow.focus();frame.contentWindow.print();
      }catch(error){frame.remove();state.frames.delete(frame);if(valid(captured) && revision===labels.getRevision()){labels.recordError(error,"PRODUCT_DOCUMENT_PRINT");status(error.message || "Could not load a print logo. Choose No distributor logo or try again.","error");}}
    };
    document.body.appendChild(frame);
  }
  function prepare() {
    if(!allowed())return;
    if($("psPrintFormat").value==="labels"){labels.prepare();return;}
    labels.sync();
    const products=labels.getProducts(),format=$("psPrintFormat").value,copies=Number($("psPrintCopies").value),heading=$("psPrintHeading").value.trim() || "Product presentation";
    if(!products.length){status("Choose products or an event lineup before printing.","waiting");return;}
    if(!["list","cards"].includes(format) || !Number.isInteger(copies) || copies<1 || copies>20){status("Choose a valid print format and a whole number of copies from 1 to 20.","error");return;}
    if(products.length*(format==="cards"?copies:1)>1000){status("Print no more than 1,000 products or cards per job. Narrow the search or reduce copies.","error");return;}
    labels.invalidate();cleanupFrames();
    const revision=labels.getRevision(),captured=identity(),markup=documentMarkup(products,format,$("psPrintLogo").value,heading,copies);
    $("psPrintPreview").innerHTML='<div class="ps-dialog-actions ps-preview-actions"><button type="button" id="psPrintNow" class="primary-action">Print this preview</button></div>'+markup;
    $("psPrintNow").addEventListener("click",()=>{if(valid(captured) && revision===labels.getRevision())sendDocument(markup,format,heading,revision);});
    status("Preview ready · Check the format and logo, then print.");
  }
  function init() {
    const trigger=$("openPrintCenter");
    if(!trigger)return;
    const template=document.createElement("template");template.innerHTML=window.foodBrokerTeamPrintTemplate;
    document.querySelector(".app-shell").append(template.content.cloneNode(true));dialog=$("teamPrintCenterDialog");
    labels=window.foodBrokerSupportLabels.create({allowed,identity,valid,getProducts:printProducts,productKey,itemNumber,status,selectionChanged:renderPrintCount,frames:state.frames});
    trigger.addEventListener("click",open);$("tpClose").addEventListener("click",close);dialog.addEventListener("close",()=>{if(!dialog.open)clear();});dialog.addEventListener("cancel",event=>{event.preventDefault();close();});
    $("teamPrintForm").addEventListener("submit",event=>event.preventDefault());
    $("tpSearch").addEventListener("input",()=>{state.visibleLimit=pageSize;renderPicker();});
    ["tpCollection","tpDistributor"].forEach(id=>$(id).addEventListener("change",()=>{state.visibleLimit=pageSize;renderPicker();}));
    $("tpProductList").addEventListener("change",event=>{if(!allowed())return;const input=event.target.closest("[data-tp-product]");if(!input || !state.all.has(input.dataset.tpProduct))return;if(input.checked)state.selected.add(input.dataset.tpProduct);else state.selected.delete(input.dataset.tpProduct);renderPicker();});
    $("tpSelectShown").addEventListener("click",()=>{if(!allowed())return;shownProducts().slice(0,state.visibleLimit).forEach(product=>state.selected.add(productKey(product)));renderPicker();});
    $("tpClearSelection").addEventListener("click",()=>{state.selected.clear();renderPicker();});$("tpLoadMore").addEventListener("click",()=>{state.visibleLimit+=pageSize;renderPicker();});
    $("tpRefresh").addEventListener("click",()=>{if(!allowed())return;labels.invalidate("Products refreshed · Prepare a new preview.");cleanupFrames();snapshot();status("Product choices refreshed. Your print-only label edits are kept.");});
    $("psPrintSource").addEventListener("change",()=>{$("tpCatalogPicker").open=!$("psPrintSource").value.startsWith("event:");$("psPrintProductSearch").value="";updateSummary();});$("psPrintFormat").addEventListener("change",updateSummary);$("psPreparePrint").addEventListener("click",prepare);
    // Clear print media before the workspace loader starts its auth-transition reload.
    window.addEventListener("foodbrokerbase:workspace-leaving",close);
    window.addEventListener("foodbrokerbase:auth-checking",close,true);
    window.addEventListener("foodbrokerbase:auth",()=>{const current=teamIdentity();if(!current || current.uid!==state.uid || current.role!==state.role)close();},true);
    clear();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
