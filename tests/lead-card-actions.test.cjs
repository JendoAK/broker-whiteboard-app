const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const workspace=fs.readFileSync(path.join(root,'lead-workspace.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
function part(source,name,indent=''){
  const start=source.indexOf('function '+name+'('),next=source.indexOf('\n'+indent+'function ',start+1);
  return source.slice(start,next<0?undefined:next);
}
function setup(){
  let fail=false,writes=0,durable,archiving='Won';
  const messages=[];
  const context={
    cards:[{id:'lead',account:'Account',status:'New Lead',priority:'High',due:'2026-11-06',note:'Original note',noteHistory:[{id:'note',text:'Keep this history'}],products:[{id:'product',description:'Product',apn:'12345'}],attachments:[{id:'file',data:'data:test'}],archivedAt:'',deletedAt:''}],
    columns:['New Lead','Samples Requested','Ready to Show / Send Out','Showed / Waiting on Feedback','Follow Up','Done'],
    normalizeStatus:value=>value,normalizeProducts:card=>card.products||[],normalizeVendorReports:value=>value||{},getVendorReport:()=>({}),render(){},renderArchive(){},alert(){},
    notify:(...message)=>messages.push(message),askArchiveOutcome:()=>archiving,
    elements:{archiveDialog:{open:false}},
    persist(){writes++;if(fail)return false;durable=JSON.parse(JSON.stringify(context.cards));return true;}
  };
  vm.createContext(context);
  vm.runInContext(part(workspace,'saveStatus','  ')+'\n'+part(workspace,'latestNote','  ')+'\n'+part(app,'archiveCard')+'\n'+part(app,'turnLeadIntoVendorReport'),context);
  return {context,messages,writes:()=>writes,durable:()=>durable,fail:()=>{fail=true;},cancel:()=>{archiving='';}};
}
test('inline lead status saves while retaining notes, products, attachments and schedule',()=>{
  const s=setup(),before=JSON.parse(JSON.stringify(s.context.cards[0]));
  assert.equal(s.context.saveStatus('lead','Samples Requested'),true);
  assert.deepEqual(s.durable()[0],{...before,status:'Samples Requested'});
  assert.equal(s.writes(),1);
});
test('a failed status save restores the existing lead and reports the failure',()=>{
  const s=setup(),before=s.context.cards;s.fail();
  assert.equal(s.context.saveStatus('lead','Done'),false);
  assert.equal(s.context.cards,before);assert.equal(s.context.cards[0].status,'New Lead');
  assert.equal(s.messages.at(-1)[1],true);
});
test('invalid, deleted and archived leads cannot be changed through stale card controls',()=>{
  const s=setup();assert.equal(s.context.saveStatus('lead','Not a stage'),false);
  s.context.cards[0].archivedAt='saved';assert.equal(s.context.saveStatus('lead','Done'),false);
  s.context.cards[0].archivedAt='';s.context.cards[0].deletedAt='saved';assert.equal(s.context.saveStatus('lead','Done'),false);
  assert.equal(s.writes(),0);
});
test('selecting the current stage avoids an unnecessary write',()=>{
  const s=setup();assert.equal(s.context.saveStatus('lead','New Lead'),true);assert.equal(s.writes(),0);
});
test('archiving preserves the stage and all saved lead detail for restoration',()=>{
  const s=setup(),before=JSON.parse(JSON.stringify(s.context.cards[0]));
  assert.equal(s.context.archiveCard('lead'),true);
  const saved=s.durable()[0];assert(saved.archivedAt);assert.equal(saved.archiveOutcome,'Won');
  assert.deepEqual({...saved,archivedAt:'',archiveOutcome:undefined},{...before,archiveOutcome:undefined});
});
test('failed archive persistence keeps the lead visible with its existing data',()=>{
  const s=setup(),before=s.context.cards;s.fail();
  assert.equal(s.context.archiveCard('lead'),false);assert.equal(s.context.cards,before);
  assert.equal(s.context.cards[0].archivedAt,'');assert.equal(s.writes(),1);
});
test('canceling the existing archive prompt does not change or save the lead',()=>{
  const s=setup(),before=s.context.cards;s.cancel();
  assert.equal(s.context.archiveCard('lead'),false);assert.equal(s.context.cards,before);assert.equal(s.writes(),0);
});
test('card notes preview the latest saved history entry without changing history',()=>{
  const s=setup(),history=[{id:'one',text:'Earlier note'},{id:'two',text:'Newest note'}];
  const card={note:'Combined history text',noteHistory:history};
  assert.equal(s.context.latestNote(card),'Newest note');assert.equal(card.noteHistory,history);assert.equal(history.length,2);
  assert.equal(s.context.latestNote({note:'Legacy note'}),'Legacy note');
});
test('the retained Vendor Report action saves product details without depending on a different view',()=>{
  const s=setup();s.context.cards[0].products[0].vendor='Vendor';
  assert.equal(s.context.turnLeadIntoVendorReport('lead'),true);
  assert.equal(s.durable()[0].vendorReports.product.productShown,'Product');
  assert.equal(s.durable()[0].vendorReports.product.opportunityNote,'Original note');
  assert.equal(s.durable()[0].status,'New Lead');
});
test('a failed Vendor Report action retains the original lead for retry',()=>{
  const s=setup(),before=s.context.cards;s.context.cards[0].products[0].vendor='Vendor';s.fail();
  assert.equal(s.context.turnLeadIntoVendorReport('lead'),false);assert.equal(s.context.cards,before);
  assert.equal(s.context.cards[0].vendorReports,undefined);
});
