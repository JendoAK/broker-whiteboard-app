/* Print-job drafts only. No product writes, browser business cache, or cloud client. */
(function () {
  "use strict";
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const fields = {psBagTitle:"title",psBagSubtitle:"subtitle",psBagPackaging:"packaging",psBagMf:"manufacturerNumber",psBagApn:"apn",psBagSupc:"supc",psBagItem:"itemNumber"};
  const mimeTypes = new Set(["image/png","image/jpeg","image/webp","image/gif"]);
  function eventDay(value) {
    const match=/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(String(value || ""));
    if(!match)return "";
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),date=new Date(year,month-1,day,12);
    return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day ? match[1]+"-"+match[2]+"-"+match[3] : "";
  }
  function isPrintableEvent(event,now=new Date()) {
    if(!event || event.archivedAt || event.deletedAt || Number.isNaN(now.getTime()))return false;
    const start=eventDay(event.startDate) || eventDay(event.date),end=eventDay(event.endDate),last=start && end ? (start>end?start:end) : end || start;
    const today=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
    return Boolean(last && last>=today);
  }
  function printableEvents(events,now=new Date()) {
    const first=event=>eventDay(event.startDate) || eventDay(event.date) || eventDay(event.endDate);
    return events.filter(event=>isPrintableEvent(event,now)).slice().sort((a,b)=>first(a).localeCompare(first(b)) || String(a.name || "").localeCompare(String(b.name || "")));
  }
  function create(host) {
    const $ = id => document.getElementById(id), renderer = window.foodBrokerBagLabels, catalog = window.foodBrokerPrintLogos;
    const drafts = new Map(), assets = new Map(), controllers = new Set(), frames = new Set(), resourceGroups = new Set(), exclusions = new Map();
    let products = [], available = [], active = "", source = "", signature = "", revision = 0, ready = null, view = "label", pageNumber = 0, uploadRevision = 0;
    const productKey = p => host.productKey(p);
    const current = () => drafts.get(active);
    const isCurrent = (identity, rev) => host.valid(identity) && revision === rev;
    function clearErrors() {
      $("psPrintErrors").hidden = true; $("psPrintErrors").open = false;
      $("psPrintErrorDetails").textContent = ""; $("psPrintCopyStatus").textContent = "";
    }
    function recordError(error, context = "LABEL_PREVIEW") {
      if (!host.allowed()) return;
      const clean = value => String(value == null ? "" : value).replace(/Bearer\s+\S+/gi,"Bearer [redacted]").replace(/\beyJ[\w-]+\.[\w-]+(?:\.[\w-]+)?\b/g,"[token redacted]").replace(/\b(?:sb_secret_\S+|sb_publishable_\S+)\b/g,"[key redacted]").replace(/https?:\/\/[^\s]+/gi,"[URL]").replace(/\b(?:Failing row contains|row contains)\s*\([^)]*\)/gi,"Row [values redacted]").replace(/\bKey\s*\([^)]*\)\s*=\s*\([^)]*\)/gi,"Key [values redacted]").replace(/\{[^{}]*\}/g,"[record details redacted]").slice(0,1200);
      $("psPrintErrorDetails").textContent = [new Date().toISOString(),"Step: "+clean(context),error?.name && "Type: "+clean(error.name),error?.code && "Code: "+clean(error.code),"Message: "+clean(error?.message || error || "The print job could not be completed.")].filter(Boolean).join("\n");
      $("psPrintErrors").hidden = false; $("psPrintErrors").open = true; $("psPrintCopyStatus").textContent = "Details stay here until dismissed or you leave this workspace.";
    }
    const excluded = () => {
      const source = $("psPrintSource").value;
      if (!exclusions.has(source)) exclusions.set(source,new Set());
      return exclusions.get(source);
    };
    function renderSelection() {
      const query = $("psPrintProductSearch").value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(), omitted = excluded();
      const rows = available.filter(p=>[p.description,p.vendor,p.brandName,p.manufacturerNumber,p.apn,p.supc,host.itemNumber(p)].join(" ").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query));
      $("psPrintProductList").innerHTML = rows.map(p=>'<label class="ps-print-product-row"><input type="checkbox" data-print-product="'+esc(productKey(p))+'"'+(!omitted.has(productKey(p))?' checked':'')+' /><span><strong>'+esc(p.description || "Untitled product")+'</strong><small>'+esc([p.vendor,p.brandName,p.apn && "APN "+p.apn,p.supc && "SUPC "+p.supc,p.manufacturerNumber && "MF# "+p.manufacturerNumber,host.itemNumber(p) && "Item# "+host.itemNumber(p)].filter(Boolean).join(" · "))+'</small></span></label>').join("") || '<p class="ps-empty">'+(available.length?'No products match this search.':'Choose products or an event above.')+'</p>';
      $("psPrintProductCount").textContent = products.length+" of "+available.length+" selected";
      $("psPrintSelectAll").disabled = !available.length; $("psPrintSelectNone").disabled = !products.length;
      updateQuantities();
    }
    function updateQuantities() {
      const counts = products.map(p=>draftFor(p).copies);
      for (const [id,count] of [["psBagOneEach",1],["psBagFullSheet",10]]) {
        $(id).disabled = !counts.length; $(id).setAttribute("aria-pressed",String(Boolean(counts.length) && counts.every(value=>value===count)));
      }
    }
    function chooseProducts() {
      products = available.filter(p=>!excluded().has(productKey(p)));
      products.forEach(draftFor);
      if (!products.some(p=>productKey(p)===active)) {active = products.length ? productKey(products[0]) : "";uploadRevision++;}
      $("psBagProduct").innerHTML = products.map(p=>'<option value="'+esc(productKey(p))+'">'+esc(p.description || "Untitled product")+'</option>').join("");
      $("psBagProduct").value = active;
      renderSelection(); updateFormat(); loadEditor(); host.selectionChanged?.();
    }
    function releaseResources(group) {
      if (!group || group.released) return;
      group.released = true;
      group.byData.forEach(url => URL.revokeObjectURL(url));
      group.byData.clear(); resourceGroups.delete(group);
    }
    function imageResource(group, dataUrl) {
      if (group.released) throw new Error("This label preview was replaced. Select Preview layout again.");
      if (group.byData.has(dataUrl)) return group.byData.get(dataUrl);
      const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
      if (!match) throw new Error("Choose a valid PNG, JPEG, WebP or GIF logo.");
      const encoded = match[2], decodedBytes = encoded.length * 3 / 4 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
      if (group.bytes + decodedBytes > 16*1024*1024) throw new Error("This print job has too many different large logo images. Use smaller images or split the products into smaller jobs.");
      const binary = atob(encoded), bytes = new Uint8Array(binary.length);
      for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes],{type:match[1]}));
      group.bytes += bytes.length; group.byData.set(dataUrl,url);
      return url;
    }
    function draftFor(p) {
      const id = productKey(p);
      const base = {title:p.description || "Untitled product",subtitle:"",packaging:p.packaging || "",manufacturerNumber:p.manufacturerNumber || "",apn:p.apn || "",supc:p.supc || "",itemNumber:host.itemNumber(p) || ""};
      Object.keys(base).forEach(field=>{base[field]=String(base[field]);});
      if (!drafts.has(id)) drafts.set(id,{id,source:p,...base,copies:1,logoMode:"automatic",logoChoice:"",customLogo:null,dirty:new Set()});
      const draft = drafts.get(id);
      for (const field of Object.values(fields)) if (!draft.dirty.has(field)) draft[field] = base[field];
      draft.source = p;
      return draft;
    }
    function invalidate(message = "Label settings changed · Select Preview layout to check the updated labels.") {
      revision++; ready = null;
      controllers.forEach(c => c.abort()); controllers.clear();
      frames.forEach(frame => {frame.remove();host.frames.delete(frame);}); frames.clear();
      $("psPrintNow")?.remove();
      $("psPrintPreview").innerHTML = '<p class="ps-empty">'+esc(message)+'</p>';
      [...resourceGroups].forEach(releaseResources);
      return revision;
    }
    function clear() {
      invalidate("Choose products, then select Preview layout.");
      drafts.clear(); assets.clear(); exclusions.clear(); products = []; available = []; active = ""; source = ""; signature = ""; uploadRevision++;
      clearErrors(); $("psPrintProductList").replaceChildren(); $("psPrintProductSearch").value = ""; $("psPrintProductCount").textContent = "";
      $("psPrintSelectAll").disabled = true; $("psPrintSelectNone").disabled = true; updateQuantities();
      $("psBagProduct").replaceChildren(); $("psBagLogoChoice").replaceChildren(); $("psBagLogoFile").value = "";
      $("psBagLogoStatus").textContent = ""; $("psBagHelp").textContent = "";
      Object.keys(fields).forEach(id => {$(id).value = "";});
      $("psBagCopies").value = "1"; $("psBagStart").value = "1"; $("psBagLogoMode").value = "automatic"; $("psBagTextSize").value = "standard";
      ["psBagShowMf","psBagShowApn","psBagShowSupc","psBagShowItem","psBagOutlines"].forEach(id => {$(id).checked = true;});
      view = "label"; pageNumber = 0; updateFormat();
    }
    function updateFormat() {
      const labels = $("psPrintFormat").value === "labels";
      $("psBagSettings").hidden = !labels; $("psPrintLayout").dataset.format = labels ? "labels" : $("psPrintFormat").value;
      $("psBagQuantity").hidden = !labels;
      document.querySelectorAll("[data-print-document]").forEach(node => {node.hidden = labels;});
    }
    function sync() {
      if (!host.allowed()) return;
      host.beforeSync?.();
      const next = host.getProducts();
      if (source !== $("psPrintSource").value) {source = $("psPrintSource").value;$("psPrintProductSearch").value = "";}
      const nextSignature = JSON.stringify([$("psPrintSource").value,$("psPrintFormat").value,next.map(p=>[productKey(p),p.updatedAt,p.description,p.vendor,p.brandName,p.brandType,p.distributor,p.packaging,p.manufacturerNumber,p.apn,p.supc,host.itemNumber(p)])]);
      if (signature !== nextSignature) {invalidate("Choose the label wording and logo, then select Preview layout.");signature = nextSignature;}
      available = [...new Map(next.map(p=>[productKey(p),p])).values()];
      chooseProducts();
    }
    function resolveLogo(draft) {
      if (draft.logoMode === "custom") return draft.customLogo ? {name:"Uploaded logo",logos:[draft.customLogo]} : {missing:true,reason:"Upload a logo for this label, or choose another logo option."};
      if (draft.logoMode === "none") return {name:"No logo",logos:[]};
      return catalog.resolve(draft.source,draft.logoMode,draft.logoChoice);
    }
    function logoOptions() {
      const draft = current();
      if (!draft) return;
      const options = catalog.options(draft.logoMode,draft.source);
      $("psBagLogoChoice").innerHTML = '<option value="">Match this product</option>'+options.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join("");
      $("psBagLogoChoice").value = draft.logoChoice;
      $("psBagLogoChoice").parentElement.hidden = ["none","custom"].includes(draft.logoMode);
      const uploadBox = $("psBagLogoFile").closest(".ps-bag-logo-upload"); if (uploadBox) uploadBox.hidden = draft.logoMode !== "custom";
      $("psBagClearLogo").disabled = !draft.customLogo;
      const logo = resolveLogo(draft);
      $("psBagLogoStatus").textContent = logo.missing ? logo.reason || "Choose the matching brand logo, upload one, or select No logo." : [logo.name,logo.notice || logo.reason].filter(Boolean).join(" · ");
      $("psBagLogoStatus").dataset.tone = logo.missing ? "waiting" : "";
    }
    function loadEditor() {
      const draft = current();
      $("psBagSettings").querySelectorAll("input,select,textarea,button").forEach(control => {control.disabled = !draft;});
      if (!draft) {Object.keys(fields).forEach(id=>{$(id).value="";});$("psBagHelp").textContent="Choose products or an event lineup to prepare labels.";$("psBagLogoStatus").textContent="";return;}
      Object.entries(fields).forEach(([id,field])=>{$(id).value=draft[field];});
      $("psBagCopies").value = draft.copies; $("psBagLogoMode").value = draft.logoMode; $("psBagLogoFile").value = "";
      $("psBagHelp").textContent = "Edits apply to this print job only. Stock-list products stay unchanged.";
      logoOptions();
    }
    function rasterMime(bytes) {
      if (bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71 && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) return "image/png";
      if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return "image/jpeg";
      if (String.fromCharCode(...bytes.slice(0,6)).match(/^GIF8[79]a$/)) return "image/gif";
      if (String.fromCharCode(...bytes.slice(0,4))==="RIFF" && String.fromCharCode(...bytes.slice(8,12))==="WEBP") return "image/webp";
      return "";
    }
    async function imageData(blob, optimize = false) {
      if (!blob.size || blob.size > 4*1024*1024) throw new Error("Choose a logo no larger than 4 MB.");
      const bytes = new Uint8Array(await blob.arrayBuffer()), mime = rasterMime(bytes);
      if (!mimeTypes.has(mime)) throw new Error("Choose a PNG, JPEG, WebP or GIF image. SVG and document files cannot be used as label logos.");
      const url = await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Could not read the logo file."));reader.readAsDataURL(new Blob([bytes],{type:mime}));});
      const image = new Image(); image.src = url;
      await image.decode().catch(()=>{throw new Error("The logo image could not be opened. Choose another image.");});
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 6000 || image.naturalHeight > 6000 || image.naturalWidth*image.naturalHeight > 16000000) throw new Error("Choose a smaller logo image (up to 16 megapixels and 6,000 pixels per side).");
      if (optimize) {
        const ratio=Math.min(1,1200/image.naturalWidth,360/image.naturalHeight),canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
        canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
        return {dataUrl:canvas.toDataURL(mime === "image/jpeg" ? "image/jpeg" : "image/png",.92),width:canvas.width,height:canvas.height};
      }
      return {dataUrl:url,width:image.naturalWidth,height:image.naturalHeight};
    }
    async function upload(file) {
      if (!host.allowed() || !current() || !file) return;
      const draft = current(), identity = host.identity(), rev = ++uploadRevision;
      invalidate("Reading the logo · Preview layout will be available when it is ready.");
      $("psBagLogoStatus").textContent = "Reading logo…";
      try {
        const image = await imageData(file,true);
        if (!host.valid(identity) || rev !== uploadRevision || !drafts.has(draft.id)) return;
        const scale = Math.min(234/image.width,50.4/image.height);
        draft.customLogo = {dataUrl:image.dataUrl,alt:"Uploaded product logo",widthPt:image.width*scale,heightPt:image.height*scale};
        draft.logoMode = "custom"; draft.logoChoice = "";
        invalidate("Logo added for this print job · Select Preview layout.");
        if (current() === draft) {$("psBagLogoMode").value="custom";logoOptions();}
      } catch (error) {if(host.valid(identity) && rev === uploadRevision) {recordError(error,"LABEL_LOGO_UPLOAD");$("psBagLogoStatus").textContent=error.message;host.status(error.message,"error");}}
      finally {if(host.valid(identity) && rev === uploadRevision) $("psBagLogoFile").value="";}
    }
    async function assetData(src) {
      if (assets.has(src)) return assets.get(src);
      const url = new URL(src,location.href), basePath = new URL(".",location.href).pathname;
      if (url.origin !== location.origin || !["print-logos/","vendor-logos/"].some(prefix=>url.pathname.startsWith(basePath+prefix))) throw new Error("This logo is not in the app’s verified logo library.");
      const controller = new AbortController(); controllers.add(controller);
      const promise = (async()=>{
        try {const response=await fetch(url,{credentials:"omit",signal:controller.signal});if(!response.ok){const error=new Error("Logo image unavailable (HTTP "+response.status+"). Try another logo or select No logo.");error.code="LOGO_HTTP_"+response.status;throw error;}const dataUrl=(await imageData(await response.blob())).dataUrl;if(!controller.signal.aborted)assets.set(src,dataUrl);return dataUrl;}
        finally {controllers.delete(controller);}
      })();
      return promise;
    }
    async function buildJob(identity,rev,resources) {
      const type = $("psBagTextSize").value, typography = type === "large" ? {titlePt:18,bodyPt:14} : type === "compact" ? {titlePt:14,bodyPt:11} : {titlePt:16,bodyPt:12};
      const job = {products:[],imageUrls:[],startPosition:Number($("psBagStart").value),showMf:$("psBagShowMf").checked,showApn:$("psBagShowApn").checked,showSupc:$("psBagShowSupc").checked,showItem:$("psBagShowItem").checked,showOutlines:$("psBagOutlines").checked,typography,logoMode:"automatic"};
      const draftList = products.map(draftFor);
      // Validate counts and text before fetching any images.
      const counts = renderer.validate({...job,products:draftList.map(d=>({...d,logos:[],customLogo:undefined}))});
      if (!counts.valid) throw new Error(counts.errors.join(" "));
      for (const draft of draftList) {
        const resolved = resolveLogo(draft);
        if (resolved.missing) throw new Error(draft.title+": "+(resolved.reason || "Choose a matching logo or select No logo."));
        const logoList = resolved.logos || (resolved.src ? [resolved] : []), images = [];
        for (const logo of logoList) {
          const dataUrl = logo.dataUrl || await assetData(logo.src);
          if (!isCurrent(identity,rev)) return null;
          const objectUrl = imageResource(resources,dataUrl);
          const {src,dataUrl:originalData,...layout} = logo;
          images.push({...layout,objectUrl});
        }
        job.products.push({title:draft.title,subtitle:draft.subtitle,packaging:draft.packaging,manufacturerNumber:draft.manufacturerNumber,apn:draft.apn,supc:draft.supc,itemNumber:draft.itemNumber,copies:draft.copies,logos:images});
      }
      job.imageUrls = [...resources.byData.values()];
      return job;
    }
    async function validatedFrame(job,identity,rev) {
      const frame = document.createElement("iframe");
      frame.title = "Product label print preview"; frame.style.cssText = "position:fixed;width:816px;height:1056px;left:-20000px;top:0;border:0;visibility:hidden";
      frames.add(frame); host.frames.add(frame);
      const loaded = new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(new Error("The label preview took too long to load. Try Preview layout again.")),10000);
        frame.onload=()=>{clearTimeout(timer);resolve();};
      });
      frame.srcdoc = renderer.printDocument(job); document.body.appendChild(frame);
      try {
        await loaded;
        const stages=new Map();
        const productIndex=labelIndex=>{let offset=0;return job.products.findIndex(product=>{offset+=product.copies;return labelIndex<=offset;});};
        for(let pass=0;pass<=3;pass++) {
          if (!isCurrent(identity,rev)) {frame.remove();frames.delete(frame);host.frames.delete(frame);return null;}
          let decodeTimer;
          try {await Promise.race([Promise.all([frame.contentDocument.fonts.ready,...[...frame.contentDocument.images].map(image=>image.decode())]),new Promise((_,reject)=>{decodeTimer=setTimeout(()=>reject(new Error("A label logo did not finish loading. Choose another logo or try again.")),8000);})]);}
          finally {clearTimeout(decodeTimer);}
          if (!isCurrent(identity,rev)) {frame.remove();frames.delete(frame);host.frames.delete(frame);return null;}
          const fit = renderer.inspectOverflow(frame.contentDocument);
          if(fit.ok){job.autoFitCount=stages.size;return frame;}
          const failing=new Map();
          for(const issue of fit.issues){const index=productIndex(issue.labelIndex);if(index<0 || !issue.labelIndex)throw new Error(issue.reasons.join(" "));if(!failing.has(index))failing.set(index,new Set());issue.reasons.forEach(reason=>failing.get(index).add(reason));}
          const canFit=pass<3 && [...failing.values()].every(reasons=>[...reasons].every(reason=>/^(Text exceeds the label width\.|Content exceeds the label height\.)$/.test(reason)));
          if(!canFit){
            const error=new Error([...failing].slice(0,3).map(([index,reasons])=>job.products[index].title+": "+[...reasons].join(" ")).join(" ")+" Automatic fitting could not fit all the wording. Shorten this product’s label wording or hide an item number.");
            error.name="BagLabelFitError";error.code="LABEL_CONTENT_TOO_LONG";error.productIndex=failing.keys().next().value;throw error;
          }
          for(const index of failing.keys()){
            const stage=(stages.get(index)||0)+1,product=job.products[index],type=product.typography || job.typography;
            stages.set(index,stage);
            product.layout={topPaddingPt:3.75,bottomPaddingPt:3.75,sidePaddingPt:12,logoGapPt:2,titleGapPt:1.5,bodyGapPt:1.5};
            product.typography={...type,titlePt:Math.min(type.titlePt,stage===1?type.titlePt:stage===2?14:12),bodyPt:Math.min(type.bodyPt,stage===1?type.bodyPt:stage===2?11:10)};
            const maxHeight=stage===1?36:stage===2?30:24,width=product.logos.reduce((sum,logo)=>sum+(logo.widthPt || 234),0),height=Math.max(0,...product.logos.map(logo=>logo.heightPt || 50.4)),scale=Math.min(1,252/Math.max(1,width),maxHeight/Math.max(1,height));
            product.logos=product.logos.map(logo=>({...logo,widthPt:(logo.widthPt || 234)*scale,heightPt:(logo.heightPt || 50.4)*scale}));
          }
          frame.contentDocument.body.innerHTML=renderer.build(job).html;
        }
      } catch (error) {frame.remove();frames.delete(frame);host.frames.delete(frame);throw error;}
    }
    async function prepare() {
      if (!host.allowed()) return;
      sync();
      if (!products.length) {host.status("Select at least one product in the print checklist.","waiting");return;}
      const rev=invalidate("Checking label size and logos…"),identity=host.identity();
      const resources = {byData:new Map(),bytes:0,released:false}; resourceGroups.add(resources);
      host.status("Checking label size and logos…","waiting");
      let ownedFrame = null;
      try {
        const job=await buildJob(identity,rev,resources);
        if (!job || !isCurrent(identity,rev)) {releaseResources(resources);return;}
        const frame=await validatedFrame(job,identity,rev);
        ownedFrame = frame;
        if (!frame || !isCurrent(identity,rev)) {if(frame){frame.remove();frames.delete(frame);host.frames.delete(frame);}releaseResources(resources);return;}
        const output=renderer.build(job);
        ready={job,output,frame,identity,revision:rev,resources,keys:products.map(productKey)};pageNumber=0;renderPreview();
        host.status("Preview ready · "+(job.autoFitCount?job.autoFitCount+" product"+(job.autoFitCount===1?"":"s")+" adjusted automatically to fit. ":"")+"Label wording is for this print job only. Print Letter paper at 100% / actual size.");
      } catch(error) {
        if (ownedFrame) {ownedFrame.remove();frames.delete(ownedFrame);host.frames.delete(ownedFrame);}
        if (ready?.resources === resources) ready = null;
        const currentJob = isCurrent(identity,rev);
        try {if(currentJob)$("psPrintPreview").innerHTML='<p id="psBagFit" class="ps-status" data-tone="error" role="alert">'+esc(error.message)+'</p>';}
        finally {releaseResources(resources);}
        if (!currentJob) return;
        if(Number.isInteger(error.productIndex) && products[error.productIndex]){active=productKey(products[error.productIndex]);$("psBagProduct").value=active;loadEditor();}
        recordError(error,"LABEL_PREVIEW");
        host.status("Labels need an adjustment before printing.","error");
      }
    }
    function scalePreview() {
      const paper=$("psBagPreviewPaper"),inner=paper?.querySelector(".ps-bag-paper-inner");if(!inner)return;
      const sheet=view==="sheet",width=sheet?816:384,height=sheet?1056:192,ratio=Math.min(paper.clientWidth/width,sheet?1:1.6);
      inner.style.width=width+"px";inner.style.height=height+"px";inner.style.transform="scale("+ratio+")";inner.style.left=Math.max(0,(paper.clientWidth-width*ratio)/2)+"px";paper.style.height=(height*ratio)+"px";
    }
    function renderPreview() {
      if (!ready || !isCurrent(ready.identity,ready.revision)) return;
      const {output,job}=ready,holder=document.createElement("div");holder.innerHTML=output.html;
      const pages=[...holder.querySelectorAll(".bag-label-page")];pageNumber=Math.max(0,Math.min(pageNumber,pages.length-1));
      let content;
      if(view==="sheet")content=pages[pageNumber].outerHTML;
      else {const index=Math.max(0,ready.keys.indexOf(active)),offset=job.products.slice(0,index).reduce((n,p)=>n+p.copies,0);content='<div class="bag-label-single">'+holder.querySelector('[data-label-index="'+(offset+1)+'"]').outerHTML+'</div>';}
      $("psPrintPreview").innerHTML='<style>'+output.css+'</style><div class="ps-bag-stagebar"><div class="ps-bag-view-controls" role="group" aria-label="Label preview"><button type="button" data-bag-view="label" aria-pressed="'+(view==="label")+'">One label</button><button type="button" data-bag-view="sheet" aria-pressed="'+(view==="sheet")+'">Full sheet</button></div><button id="psPrintNow" type="button" class="primary-action">Print this preview</button></div><div id="psBagPreviewPaper"><div class="ps-bag-paper-inner">'+content+'</div></div><div class="ps-bag-preview-footer"><p id="psBagFit" role="status">'+output.labelCount+' labels · '+output.pageCount+' sheet'+(output.pageCount===1?"":"s")+' · Content fits'+(job.autoFitCount?' · '+job.autoFitCount+' product'+(job.autoFitCount===1?'':'s')+' adjusted automatically':'')+'</p><div class="ps-bag-pagination"'+(view!=="sheet"||pages.length<2?' hidden':'')+'><button id="psBagPrev" type="button" aria-label="Previous sheet"'+(pageNumber===0?' disabled':'')+'>←</button><span>Sheet '+(pageNumber+1)+' of '+pages.length+'</span><button id="psBagNext" type="button" aria-label="Next sheet"'+(pageNumber===pages.length-1?' disabled':'')+'>→</button></div></div>';
      $("psPrintNow").addEventListener("click",print);
      $("psPrintPreview").querySelectorAll("[data-bag-view]").forEach(button=>button.addEventListener("click",()=>{view=button.dataset.bagView;renderPreview();}));
      $("psBagPrev").addEventListener("click",()=>{pageNumber--;renderPreview();});$("psBagNext").addEventListener("click",()=>{pageNumber++;renderPreview();});scalePreview();
    }
    function print() {
      if(!host.allowed())return;
      sync();
      if (!ready || !isCurrent(ready.identity,ready.revision) || !ready.frame.isConnected) return;
      try {
        const frame=ready.frame,resources=ready.resources,fit=renderer.inspectOverflow(frame.contentDocument);
        if(!fit.ok)throw new Error("Label content changed. Select Preview layout to check it again.");
        frame.contentWindow.addEventListener("afterprint",()=>{frame.remove();frames.delete(frame);host.frames.delete(frame);if(ready?.frame===frame)invalidate("Print dialog closed · Select Preview layout to print again.");else releaseResources(resources);},{once:true});
        frame.contentWindow.focus();frame.contentWindow.print();
      } catch(error) {invalidate("Printing could not start. Select Preview layout and try again.");recordError(error,"LABEL_PRINT");host.status("Printing could not start. The error details are kept below.","error");}
    }
    $("psPrintProductList").addEventListener("change",event=>{
      if (!host.allowed()) return;
      const input=event.target.closest("[data-print-product]");
      if (!input || !available.some(p=>productKey(p)===input.dataset.printProduct)) return;
      if (input.checked) excluded().delete(input.dataset.printProduct); else excluded().add(input.dataset.printProduct);
      invalidate("Product selection changed · Select Preview layout."); chooseProducts();
    });
    $("psPrintProductSearch").addEventListener("input",()=>{if(host.allowed())renderSelection();});
    $("psPrintSelectAll").addEventListener("click",()=>{if(!host.allowed())return;excluded().clear();invalidate("All products selected · Select Preview layout.");chooseProducts();});
    $("psPrintSelectNone").addEventListener("click",()=>{if(!host.allowed())return;available.forEach(p=>excluded().add(productKey(p)));invalidate("Select the products you want to print.");chooseProducts();});
    for (const [id,copies] of [["psBagOneEach",1],["psBagFullSheet",10]]) $(id).addEventListener("click",()=>{
      if(!host.allowed())return;products.forEach(p=>{draftFor(p).copies=copies;});invalidate("Label quantities changed · Select Preview layout.");loadEditor();updateQuantities();
    });
    $("psPrintDismissError").addEventListener("click",clearErrors);
    $("psPrintCopyError").addEventListener("click",async()=>{
      if(!host.allowed() || $("psPrintErrors").hidden)return;
      const identity=host.identity(),details=$("psPrintErrorDetails").textContent;
      try {await navigator.clipboard.writeText(details);if(host.valid(identity))$("psPrintCopyStatus").textContent="Error details copied.";}
      catch {if(host.valid(identity)){$("psPrintCopyStatus").textContent="Select and copy the details below. Your browser could not copy them automatically.";const range=document.createRange();range.selectNodeContents($("psPrintErrorDetails"));const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);}}
    });
    $("psBagProduct").addEventListener("change",()=>{active=$("psBagProduct").value;uploadRevision++;loadEditor();renderPreview();});
    Object.entries(fields).forEach(([id,field])=>$(id).addEventListener("input",()=>{if(!host.allowed()||!current())return;current()[field]=$(id).value;current().dirty.add(field);invalidate();}));
    $("psBagCopies").addEventListener("input",()=>{if(host.allowed()&&current()){current().copies=Number($("psBagCopies").value);invalidate();updateQuantities();}});
    $("psBagLogoMode").addEventListener("change",()=>{if(current()){current().logoMode=$("psBagLogoMode").value;current().logoChoice="";uploadRevision++;invalidate();logoOptions();}});
    $("psBagLogoChoice").addEventListener("change",()=>{if(current()){current().logoChoice=$("psBagLogoChoice").value;invalidate();logoOptions();}});
    $("psBagLogoFile").addEventListener("change",event=>upload(event.target.files[0]));
    $("psBagClearLogo").addEventListener("click",()=>{if(current()){uploadRevision++;current().customLogo=null;$("psBagLogoFile").value="";invalidate();logoOptions();}});
    $("psBagReset").addEventListener("click",()=>{const p=products.find(p=>productKey(p)===active);if(p){uploadRevision++;drafts.delete(active);draftFor(p);invalidate();loadEditor();updateQuantities();}});
    ["psBagStart","psBagShowMf","psBagShowApn","psBagShowSupc","psBagShowItem","psBagOutlines","psBagTextSize"].forEach(id=>$(id).addEventListener("change",()=>invalidate()));
    ["psPrintFormat","psPrintLogo","psPrintHeading","psPrintCopies"].forEach(id=>$(id).addEventListener(id==="psPrintHeading"||id==="psPrintCopies"?"input":"change",()=>{invalidate();sync();}));
    new ResizeObserver(scalePreview).observe($("psPrintPreview"));
    return Object.freeze({sync,clear,invalidate,prepare,recordError,clearErrors,getProducts:()=>host.allowed()?products.slice():[],getRevision:()=>revision});
  }
  window.foodBrokerSupportLabels = Object.freeze({create,isPrintableEvent,printableEvents});
})();
