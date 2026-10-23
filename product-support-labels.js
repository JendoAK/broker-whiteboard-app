/* Print-job drafts only. No product writes, browser business cache, or cloud client. */
(function () {
  "use strict";
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const fields = {psBagTitle:"title",psBagSubtitle:"subtitle",psBagPackaging:"packaging",psBagMf:"manufacturerNumber",psBagApn:"apn",psBagSupc:"supc",psBagItem:"itemNumber"};
  const mimeTypes = new Set(["image/png","image/jpeg","image/webp","image/gif"]);
  function create(host) {
    const $ = id => document.getElementById(id), renderer = window.foodBrokerBagLabels, catalog = window.foodBrokerPrintLogos;
    const drafts = new Map(), assets = new Map(), controllers = new Set(), frames = new Set();
    let products = [], active = "", signature = "", revision = 0, ready = null, view = "label", pageNumber = 0, uploadRevision = 0;
    const productKey = p => host.productKey(p);
    const current = () => drafts.get(active);
    const isCurrent = (identity, rev) => host.valid(identity) && revision === rev;
    function draftFor(p) {
      const id = productKey(p);
      const base = {title:p.description || "Untitled product",subtitle:"",packaging:p.packaging || "",manufacturerNumber:p.manufacturerNumber || "",apn:p.apn || "",supc:p.supc || "",itemNumber:host.itemNumber(p) || ""};
      Object.keys(base).forEach(field=>{base[field]=String(base[field]);});
      if (!drafts.has(id)) drafts.set(id,{id,source:p,...base,copies:10,logoMode:"automatic",logoChoice:"",customLogo:null,dirty:new Set()});
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
      return revision;
    }
    function clear() {
      invalidate("Choose products, then select Preview layout.");
      drafts.clear(); assets.clear(); products = []; active = ""; signature = ""; uploadRevision++;
      $("psBagProduct").replaceChildren(); $("psBagLogoChoice").replaceChildren(); $("psBagLogoFile").value = "";
      $("psBagLogoStatus").textContent = ""; $("psBagHelp").textContent = "";
      Object.keys(fields).forEach(id => {$(id).value = "";});
      $("psBagCopies").value = "10"; $("psBagStart").value = "1"; $("psBagLogoMode").value = "automatic"; $("psBagTextSize").value = "standard";
      ["psBagShowMf","psBagShowApn","psBagShowSupc","psBagShowItem","psBagOutlines"].forEach(id => {$(id).checked = true;});
      view = "label"; pageNumber = 0; updateFormat();
    }
    function updateFormat() {
      const labels = $("psPrintFormat").value === "labels";
      $("psBagSettings").hidden = !labels; $("psPrintLayout").dataset.format = labels ? "labels" : $("psPrintFormat").value;
      document.querySelectorAll("[data-print-document]").forEach(node => {node.hidden = labels;});
    }
    function sync() {
      if (!host.allowed()) return;
      const next = host.getProducts();
      const nextSignature = JSON.stringify([$("psPrintSource").value,$("psPrintFormat").value,next.map(p=>[productKey(p),p.updatedAt,p.description,p.vendor,p.brandName,p.brandType,p.distributor,p.packaging,p.manufacturerNumber,p.apn,p.supc,host.itemNumber(p)])]);
      if (signature !== nextSignature) {invalidate("Choose the label wording and logo, then select Preview layout.");signature = nextSignature;}
      products = next;
      products.forEach(draftFor);
      if (!products.some(p => productKey(p) === active)) active = products.length ? productKey(products[0]) : "";
      $("psBagProduct").innerHTML = products.map(p=>'<option value="'+esc(productKey(p))+'">'+esc(p.description || "Untitled product")+'</option>').join("");
      $("psBagProduct").value = active;
      updateFormat(); loadEditor();
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
      } catch (error) {if(host.valid(identity) && rev === uploadRevision) {$("psBagLogoStatus").textContent=error.message;host.status(error.message,"error");}}
      finally {if(host.valid(identity) && rev === uploadRevision) $("psBagLogoFile").value="";}
    }
    async function assetData(src) {
      if (assets.has(src)) return assets.get(src);
      const url = new URL(src,location.href), basePath = new URL(".",location.href).pathname;
      if (url.origin !== location.origin || !["print-logos/","vendor-logos/"].some(prefix=>url.pathname.startsWith(basePath+prefix))) throw new Error("This logo is not in the app’s verified logo library.");
      const controller = new AbortController(); controllers.add(controller);
      const promise = (async()=>{
        try {const response=await fetch(url,{credentials:"omit",signal:controller.signal});if(!response.ok)throw new Error("Logo image unavailable. Try another logo or select No logo.");const dataUrl=(await imageData(await response.blob())).dataUrl;if(!controller.signal.aborted)assets.set(src,dataUrl);return dataUrl;}
        finally {controllers.delete(controller);}
      })();
      return promise;
    }
    async function buildJob(identity,rev) {
      const type = $("psBagTextSize").value, typography = type === "large" ? {titlePt:18,bodyPt:14} : type === "compact" ? {titlePt:14,bodyPt:11} : {titlePt:16,bodyPt:12};
      const job = {products:[],startPosition:Number($("psBagStart").value),showMf:$("psBagShowMf").checked,showApn:$("psBagShowApn").checked,showSupc:$("psBagShowSupc").checked,showItem:$("psBagShowItem").checked,showOutlines:$("psBagOutlines").checked,typography,logoMode:"automatic"};
      const draftList = products.map(draftFor);
      // Validate counts and text before fetching any images.
      const counts = renderer.validate({...job,products:draftList.map(d=>({...d,logos:[],customLogo:undefined}))});
      if (!counts.valid) throw new Error(counts.errors.join(" "));
      let artworkBytes = 0;
      for (const draft of draftList) {
        const resolved = resolveLogo(draft);
        if (resolved.missing) throw new Error(draft.title+": "+(resolved.reason || "Choose a matching logo or select No logo."));
        const logoList = resolved.logos || (resolved.src ? [resolved] : []), images = [];
        for (const logo of logoList) {
          const dataUrl = logo.dataUrl || await assetData(logo.src);
          if (!isCurrent(identity,rev)) return null;
          artworkBytes += dataUrl.length * draft.copies;
          if (artworkBytes > 16*1024*1024) throw new Error("This print job contains too much logo artwork. Use a smaller logo image or split the products into smaller print jobs.");
          images.push({...logo,dataUrl});
        }
        job.products.push({title:draft.title,subtitle:draft.subtitle,packaging:draft.packaging,manufacturerNumber:draft.manufacturerNumber,apn:draft.apn,supc:draft.supc,itemNumber:draft.itemNumber,copies:draft.copies,logos:images});
      }
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
        await Promise.race([Promise.all([frame.contentDocument.fonts.ready,...[...frame.contentDocument.images].map(image=>image.decode())]),new Promise((_,reject)=>setTimeout(()=>reject(new Error("A label logo did not finish loading. Choose another logo or try again.")),8000))]);
        if (!isCurrent(identity,rev)) {frame.remove();frames.delete(frame);host.frames.delete(frame);return null;}
        const fit = renderer.inspectOverflow(frame.contentDocument);
        if (!fit.ok) throw new Error(fit.issues.slice(0,3).map(issue=>"Label "+issue.labelIndex+" ("+issue.title+"): "+issue.reasons.join(" ")).join(" ")+" Shorten the wording, use Compact text, or hide an item number.");
        return frame;
      } catch (error) {frame.remove();frames.delete(frame);host.frames.delete(frame);throw error;}
    }
    async function prepare() {
      if (!host.allowed()) return;
      sync();
      if (!products.length) {host.status("Choose products or an event lineup before printing.","waiting");return;}
      const rev=invalidate("Checking label size and logos…"),identity=host.identity();
      host.status("Checking label size and logos…","waiting");
      try {
        const job=await buildJob(identity,rev);
        if (!job || !isCurrent(identity,rev)) return;
        const output=renderer.build(job),frame=await validatedFrame(job,identity,rev);
        if (!frame || !isCurrent(identity,rev)) return;
        ready={job,output,frame,identity,revision:rev,keys:products.map(productKey)};pageNumber=0;renderPreview();
        host.status("Preview ready · Label wording is for this print job only. Print Letter paper at 100% / actual size.");
      } catch(error) {
        if (!isCurrent(identity,rev)) return;
        $("psPrintPreview").innerHTML='<p id="psBagFit" class="ps-status" data-tone="error" role="alert">'+esc(error.message)+'</p>';
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
      $("psPrintPreview").innerHTML='<style>'+output.css+'</style><div class="ps-bag-stagebar"><div class="ps-bag-view-controls" role="group" aria-label="Label preview"><button type="button" data-bag-view="label" aria-pressed="'+(view==="label")+'">One label</button><button type="button" data-bag-view="sheet" aria-pressed="'+(view==="sheet")+'">Full sheet</button></div><button id="psPrintNow" type="button" class="primary-action">Print this preview</button></div><div id="psBagPreviewPaper"><div class="ps-bag-paper-inner">'+content+'</div></div><div class="ps-bag-preview-footer"><p id="psBagFit" role="status">'+output.labelCount+' labels · '+output.pageCount+' sheet'+(output.pageCount===1?"":"s")+' · Content fits</p><div class="ps-bag-pagination"'+(view!=="sheet"||pages.length<2?' hidden':'')+'><button id="psBagPrev" type="button" aria-label="Previous sheet"'+(pageNumber===0?' disabled':'')+'>←</button><span>Sheet '+(pageNumber+1)+' of '+pages.length+'</span><button id="psBagNext" type="button" aria-label="Next sheet"'+(pageNumber===pages.length-1?' disabled':'')+'>→</button></div></div>';
      $("psPrintNow").addEventListener("click",print);
      $("psPrintPreview").querySelectorAll("[data-bag-view]").forEach(button=>button.addEventListener("click",()=>{view=button.dataset.bagView;renderPreview();}));
      $("psBagPrev").addEventListener("click",()=>{pageNumber--;renderPreview();});$("psBagNext").addEventListener("click",()=>{pageNumber++;renderPreview();});scalePreview();
    }
    function print() {
      if (!ready || !isCurrent(ready.identity,ready.revision) || !ready.frame.isConnected) return;
      const frame=ready.frame,fit=renderer.inspectOverflow(frame.contentDocument);
      if(!fit.ok){invalidate("Label content changed. Select Preview layout to check it again.");return;}
      frame.contentWindow.addEventListener("afterprint",()=>{frame.remove();frames.delete(frame);host.frames.delete(frame);if(ready?.frame===frame){ready=null;$("psPrintNow")?.remove();}},{once:true});
      frame.contentWindow.focus();frame.contentWindow.print();
    }
    $("psBagProduct").addEventListener("change",()=>{active=$("psBagProduct").value;uploadRevision++;loadEditor();renderPreview();});
    Object.entries(fields).forEach(([id,field])=>$(id).addEventListener("input",()=>{if(!host.allowed()||!current())return;current()[field]=$(id).value;current().dirty.add(field);invalidate();}));
    $("psBagCopies").addEventListener("input",()=>{if(current()){current().copies=Number($("psBagCopies").value);invalidate();}});
    $("psBagLogoMode").addEventListener("change",()=>{if(current()){current().logoMode=$("psBagLogoMode").value;current().logoChoice="";uploadRevision++;invalidate();logoOptions();}});
    $("psBagLogoChoice").addEventListener("change",()=>{if(current()){current().logoChoice=$("psBagLogoChoice").value;invalidate();logoOptions();}});
    $("psBagLogoFile").addEventListener("change",event=>upload(event.target.files[0]));
    $("psBagClearLogo").addEventListener("click",()=>{if(current()){uploadRevision++;current().customLogo=null;$("psBagLogoFile").value="";invalidate();logoOptions();}});
    $("psBagReset").addEventListener("click",()=>{const p=products.find(p=>productKey(p)===active);if(p){uploadRevision++;drafts.delete(active);draftFor(p);invalidate();loadEditor();}});
    ["psBagStart","psBagShowMf","psBagShowApn","psBagShowSupc","psBagShowItem","psBagOutlines","psBagTextSize"].forEach(id=>$(id).addEventListener("change",()=>invalidate()));
    ["psPrintFormat","psPrintLogo","psPrintHeading","psPrintCopies"].forEach(id=>$(id).addEventListener(id==="psPrintHeading"||id==="psPrintCopies"?"input":"change",()=>{invalidate();sync();}));
    new ResizeObserver(scalePreview).observe($("psPrintPreview"));
    return Object.freeze({sync,clear,invalidate,prepare,getRevision:()=>revision});
  }
  window.foodBrokerSupportLabels = Object.freeze({create});
})();
