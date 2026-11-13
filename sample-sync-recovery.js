(function () {
  "use strict";
  // Reconciliation UI only. No cloud requests or business browser storage.
  const state = { sections:new Map(), dialog:null };
  const strings=["product","vendor","orderedBy","orderedDate","expected","storageType","poNumber","dotNumber","shipmentConfirmation","requestedFor","status","note"];
  const flags=["isDot","directFromManufacturer","addedToPo","fedex","usps"];
  const labels={product:"Products",vendor:"Vendor",orderedBy:"Ordered by",orderedDate:"Ordered date",expected:"Expected arrival",storageType:"Storage",poNumber:"PO number",dotNumber:"DOT number",shipmentConfirmation:"Tracking",requestedFor:"Requested for",status:"Status",note:"Notes",isDot:"DOT order",directFromManufacturer:"Direct from manufacturer",addedToPo:"Added to PO",fedex:"FedEx",usps:"UPS",archived:"Archived",attachments:"Attached files"};
  const text=v=>String(v==null?"":v),esc=v=>text(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const error=(code,message)=>Object.assign(new Error(message),{code});
  function stable(value){if(Array.isArray(value))return "["+value.map(stable).join(",")+"]";if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stable(value[k])).join(",")+"}";return JSON.stringify(value);}
  function attachment(file){return {name:text(file?.name||"Attachment").trim(),type:text(file?.type||"application/octet-stream").trim(),size:Number(file?.size)||0,data:text(file?.data),storageId:text(file?.storageId)};}
  function projection(item,normalize){const n=normalize(item),out={};for(const field of strings)out[field]=text(n[field]);for(const field of flags)out[field]=Boolean(n[field]);out.archived=Boolean(n.archivedAt);out.attachments=(Array.isArray(n.attachments)?n.attachments:[]).map(attachment);return out;}
  function sameItems(left,right,normalize){
    const comparable=items=>[...keyed(items)].sort(([a],[b])=>a.localeCompare(b)).map(([id,item])=>({id,...projection(item,normalize)}));
    return stable(comparable(left))===stable(comparable(right));
  }
  function keyed(items){if(!Array.isArray(items))throw error("SAMPLE_REVIEW_REQUIRED","The sample list needs review before it can sync.");const result=new Map();for(const item of items){if(!item||typeof item!=="object"||Array.isArray(item)||!text(item.id).trim()||result.has(text(item.id)))throw error("SAMPLE_REVIEW_REQUIRED","A blank or repeated sample identifier needs review before syncing.");result.set(text(item.id),item);}return result;}
  function plan(local,remote,normalize){const browser=keyed(local),cloud=keyed(remote),conflicts=[],additions=[],cloudOnlyIds=[];for(const [id,item]of browser){const stored=cloud.get(id);if(!stored)additions.push({id,local:item});else {const a=projection(item,normalize),b=projection(stored,normalize);if(stable(a)!==stable(b))conflicts.push({id,local:item,remote:stored,a,b});}}for(const id of cloud.keys())if(!browser.has(id))cloudOnlyIds.push(id);return{browser,cloud,conflicts,additions,cloudOnlyIds};}
  // Compare edits with the copy this browser actually loaded. A different
  // collection revision alone is not a competing edit to the same sample.
  function knownPlan(local,remote,base,normalize){
    const browser=keyed(local),cloud=keyed(remote),before=keyed(base),conflicts=[],additions=[],cloudOnlyIds=[];
    for(const [id,old] of before){
      if(browser.has(id)||!cloud.has(id))continue;
      const stored=cloud.get(id),b=projection(stored,normalize);
      if(stable(b)===stable(projection(old,normalize)))cloud.delete(id);
      else conflicts.push({id,local:null,remote:stored,a:{removed:true},b});
    }
    for(const [id,item] of browser){
      const stored=cloud.get(id),old=before.get(id),a=projection(item,normalize);
      if(!stored){
        if(!old)cloud.set(id,mergeKnown(item,null,normalize));
        else if(stable(a)!==stable(projection(old,normalize)))additions.push({id,local:item});
        continue;
      }
      const b=projection(stored,normalize);
      if(!old){
        if(stable(a)!==stable(b))conflicts.push({id,local:item,remote:stored,a,b});
        continue;
      }
      const previous=projection(old,normalize),merged=mergeKnown(item,stored,normalize);
      let conflict=false,localChanged=false;
      for(const field of Object.keys(a)){
        const here=stable(a[field]),there=stable(b[field]),was=stable(previous[field]);
        if(here!==was)localChanged=true;
        if(here!==was&&there!==was&&here!==there){conflict=true;continue;}
        if(here!==was)continue;
        if(field==='archived')merged.archivedAt=stored.archivedAt||'';
        else if(field==='attachments')merged.attachments=stored.attachments||[];
        else merged[field]=b[field];
        if(field==='product'&&Array.isArray(stored.products))merged.products=stored.products;
      }
      if(conflict)conflicts.push({id,local:item,remote:stored,a,b});
      else {
        if(!localChanged){if(stored._audit)merged._audit=stored._audit;if(stored.updatedAt)merged.updatedAt=stored.updatedAt;}
        cloud.set(id,merged);
      }
    }
    for(const id of cloud.keys())if(!browser.has(id))cloudOnlyIds.push(id);
    return{browser,cloud,conflicts,additions,cloudOnlyIds};
  }
  function sameAttachments(a,b){return stable((Array.isArray(a)?a:[]).map(attachment))===stable((Array.isArray(b)?b:[]).map(attachment));}
  function history(a,b){const result=[],seen=new Set();for(const event of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])]){if(!event||typeof event!=="object")continue;const id=event.id?"id:"+text(event.id):stable(event);if(!seen.has(id)){seen.add(id);result.push({...event});}}return result;}
  function mergeKnown(local,remote,normalize){const n=normalize(local),remoteNormalized=remote?normalize(remote):null,merged=remote?{...remote}:{id:local.id};for(const field of strings)merged[field]=text(n[field]);for(const field of flags)merged[field]=Boolean(n[field]);
    if(Object.prototype.hasOwnProperty.call(local,"archivedAt"))merged.archivedAt=text(local.archivedAt);
    if(Object.prototype.hasOwnProperty.call(local,"updatedAt"))merged.updatedAt=local.updatedAt;
    if(!remote&&Object.prototype.hasOwnProperty.call(local,"createdAt"))merged.createdAt=local.createdAt;
    if(!remote||!sameAttachments(n.attachments,remoteNormalized?.attachments)){const oldFiles=Array.isArray(remote?.attachments)?remote.attachments:[],represented=Array.isArray(remoteNormalized?.attachments)?remoteNormalized.attachments:[];merged.attachments=(Array.isArray(n.attachments)?n.attachments:[]).map(file=>{const old=oldFiles.find(x=>(file.id&&x.id===file.id)||stable(attachment(x))===stable(attachment(file)));const value={...(old||{})};for(const field of ["id","name","type","size","data","storageId","addedAt"])if(file[field]!=null)value[field]=file[field];return value;});for(const file of oldFiles){if(represented.some(known=>stable(attachment(known))===stable(attachment(file))))continue;if(!merged.attachments.some(known=>(file.id&&known.id===file.id)||(file.storageId&&known.storageId===file.storageId)))merged.attachments.push(file);}}
    if(Array.isArray(n.products)&&(!remote||projection(local,normalize).product!==projection(remote,normalize).product))merged.products=n.products.map(p=>({text:text(p.text)}));
    if(Array.isArray(local._activity))merged._activity=history(remote?._activity,local._activity);
    if(n._audit&&typeof n._audit==="object"){merged._audit={...(remote?._audit||{})};for(const field of ["initials","name","email","action","at"])if(n._audit[field]!=null)merged._audit[field]=n._audit[field];}return merged;
  }
  function browserVersion(local,remote,normalize,stamp){const merged=mergeKnown(local,remote,normalize);merged.updatedAt=new Date().toISOString();const stamped=typeof stamp==="function"?stamp(merged):null;return stamped||merged;}
  function dismissDialog(reason){const current=state.dialog;if(!current)return;state.dialog=null;current.element.close();current.element.remove();if(reason)current.reject(reason);if(current.valid()&&current.focus?.isConnected)current.focus.focus({preventScroll:true});}
  function clearSection(sectionKey){state.sections.delete(sectionKey);if(state.dialog?.sectionKey===sectionKey)dismissDialog(error("SAMPLE_REVIEW_CANCELLED","Sample review was closed. Your current entries have been kept."));renderBanner();}
  function clear(){state.sections.clear();dismissDialog(error("SAMPLE_REVIEW_CANCELLED","Sample review was closed because the workspace changed."));document.getElementById("sampleSyncRecoveryBanner")?.remove();}
  function renderBanner(){let banner=document.getElementById("sampleSyncRecoveryBanner");if(!state.sections.size){banner?.remove();return;}if(!banner){banner=document.createElement("section");banner.id="sampleSyncRecoveryBanner";banner.className="sample-sync-recovery-banner";banner.setAttribute("role","region");banner.setAttribute("aria-label","Sample sync review");document.body.append(banner);}banner.innerHTML='<div><strong>Sample changes need review</strong><p>Your current entries are kept in this open app. Review the browser and cloud copies before syncing.</p><span data-recovery-banner-status role="status" aria-live="polite"></span></div><div class="sample-sync-banner-actions"><button type="button" data-sample-review>Review samples</button><button type="button" data-sample-backup>Export backup</button></div>';
    const entry=[...state.sections.values()].find(x=>x.valid());if(!entry){clear();return;}const review=banner.querySelector("[data-sample-review]"),backup=banner.querySelector("[data-sample-backup]");backup.hidden=typeof entry.onBackup!=="function";review.addEventListener("click",async()=>{if(!entry.valid()){clear();return;}review.disabled=true;try{await entry.onReview?.();}catch{if(banner.isConnected)banner.querySelector("[data-recovery-banner-status]").textContent="The samples still need review. Your current entries have been kept.";}finally{if(review.isConnected)review.disabled=false;}});backup.addEventListener("click",()=>{if(entry.valid())entry.onBackup?.();else clear();});
  }
  function display(value,field){if(field==="attachments")return Array.isArray(value)&&value.length?value.map(file=>file.name+(file.size?" ("+file.size+" bytes)":"")).join("\n"):"No files";if(typeof value==="boolean")return value?"Yes":"No";return text(value)||"—";}
  function conflictMarkup(item,index){const fields=[...new Set([...Object.keys(item.a),...Object.keys(item.b)])].filter(field=>stable(item.a[field])!==stable(item.b[field]));return '<article class="sample-sync-review-card"><h3>'+esc(item.local?.product||item.remote.product||"Sample")+'</h3><div class="sample-sync-versions">'+[["In this browser",item.a],["In the cloud",item.b]].map(([title,value])=>'<section><h4>'+title+'</h4><dl>'+fields.map(field=>'<div><dt>'+esc(field==='removed'?'Removed in this browser':labels[field]||field)+'</dt><dd>'+esc(display(value[field],field))+'</dd></div>').join("")+'</dl></section>').join("")+'</div><label class="sample-sync-choice" for="sampleRecoveryChoice'+index+'">Choose which details to keep<select id="sampleRecoveryChoice'+index+'" data-recovery-choice="'+esc(item.id)+'" required><option value="">Choose a version</option><option value="browser">'+(item.local?'Keep browser details':'Keep browser removal')+'</option><option value="cloud">Keep cloud details</option></select></label></article>';}
  function review(options,p){return new Promise((resolve,reject)=>{if(!options.valid()){reject(error("SAMPLE_REVIEW_CANCELLED","The workspace changed before sample review."));return;}if(state.dialog){reject(error("SAMPLE_REVIEW_REQUIRED","Finish the open sample review first."));return;}const dialog=document.createElement("dialog"),focus=document.activeElement;dialog.id="sampleSyncRecoveryDialog";dialog.className="sample-sync-recovery-dialog";dialog.setAttribute("aria-labelledby","sampleSyncRecoveryTitle");dialog.innerHTML='<form><header><div><p>Cloud sync review</p><h2 id="sampleSyncRecoveryTitle" tabindex="-1">Review '+esc(options.label||"samples")+'</h2></div><button type="button" data-recovery-cancel aria-label="Close sample review">×</button></header><p>Your browser and the cloud have different sample details. Choose what to keep. Cloud-only samples stay in the list.</p><div class="sample-sync-review-items">'+p.conflicts.map(conflictMarkup).join("")+p.additions.map(item=>'<article class="sample-sync-review-card"><h3>'+esc(item.local.product||"Browser-only sample")+'</h3><p>'+esc([item.local.vendor,item.local.status].filter(Boolean).join(" · "))+'</p><p>This sample is in this browser but is not in the cloud. It may be new or may have been removed elsewhere.</p><label class="sample-sync-add"><input type="checkbox" data-recovery-add="'+esc(item.id)+'" required />Add this browser-only sample to the cloud</label></article>').join("")+'</div><p data-recovery-error role="status" aria-live="polite"></p><footer><button type="button" data-recovery-backup>Export backup</button><span></span><button type="button" data-recovery-cancel>Cancel</button><button type="submit" data-recovery-confirm>Save reviewed samples</button></footer></form>';
    document.body.append(dialog);state.dialog={element:dialog,reject,valid:options.valid,focus,sectionKey:options.sectionKey};dialog.querySelectorAll("[data-recovery-cancel]").forEach(button=>button.addEventListener("click",()=>dismissDialog(error("SAMPLE_REVIEW_CANCELLED","Review cancelled. Your current entries have been kept."))));dialog.addEventListener("cancel",event=>{event.preventDefault();dismissDialog(error("SAMPLE_REVIEW_CANCELLED","Review cancelled. Your current entries have been kept."));});const backup=dialog.querySelector("[data-recovery-backup]");backup.hidden=typeof options.onBackup!=="function";backup.addEventListener("click",()=>{if(options.valid())options.onBackup?.();else clear();});dialog.querySelector("form").addEventListener("submit",event=>{event.preventDefault();if(!options.valid()){clear();return;}const choices=new Map([...dialog.querySelectorAll("[data-recovery-choice]")].map(node=>[node.dataset.recoveryChoice,node.value]));if(p.conflicts.some(item=>!["browser","cloud"].includes(choices.get(item.id)))||[...dialog.querySelectorAll("[data-recovery-add]")].some(node=>!node.checked)){dialog.querySelector("[data-recovery-error]").textContent="Choose a version for each changed sample and confirm each browser-only addition.";return;}const items=[...p.cloud].filter(([id])=>choices.get(id)!=="browser"||p.browser.has(id)).map(([id,item])=>choices.get(id)==="browser"?browserVersion(p.browser.get(id),item,options.normalize,options.stamp):item);for(const item of p.additions)items.push(browserVersion(item.local,null,options.normalize,options.stamp));dismissDialog();resolve({items,cloudOnlyIds:p.cloudOnlyIds});});dialog.showModal();dialog.querySelector("h2").focus({preventScroll:true});});}
  async function reconcile(options){if(!options||typeof options.valid!=="function"||!options.valid())throw error("SAMPLE_REVIEW_CANCELLED","The workspace changed before sample sync.");const p=Array.isArray(options.base)?knownPlan(options.local,options.remote,options.base,options.normalize):plan(options.local,options.remote,options.normalize);if(!p.conflicts.length&&!p.additions.length)return{items:[...p.cloud.values()],cloudOnlyIds:p.cloudOnlyIds};state.sections.set(options.sectionKey,{valid:options.valid,onReview:options.onReview,onBackup:options.onBackup});renderBanner();if(!options.allowReview)throw error("SAMPLE_REVIEW_REQUIRED","Review browser and cloud sample details before syncing. Your current entries have been kept.");return review(options,p);}
  for(const name of ["foodbrokerbase:auth-checking","foodbrokerbase:workspace-leaving"])window.addEventListener(name,clear,true);
  window.addEventListener("foodbrokerbase:auth",()=>{if([...state.sections.values()].some(item=>!item.valid())||state.dialog&&!state.dialog.valid())clear();},true);
  window.foodBrokerSampleSyncRecovery=Object.freeze({reconcile,mergeKnown,sameItems,clear,clearSection,hasReview:()=>Boolean(state.sections.size||state.dialog)});
})();
