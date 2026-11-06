const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
function part(name){const start=app.indexOf('function '+name+'('),end=app.indexOf('\nfunction ',start+1);return app.slice(start,end);}
function stockSetup(){
 let writes=0;const c={stockProducts:[],window:{foodBrokerVendors:{product:p=>p}},crypto:require('node:crypto').webcrypto,normalizeVendorName:v=>String(v||'').trim(),normalizeBrandType:v=>v||'',normalizeStockBrandName:v=>v||'',normalizeStockCategory:v=>v||'',normalizeYes:v=>v||'',normalizeProducts:card=>card.products||[],updateVendorControls(){},normalizeAttachment:f=>({...f}),normalizeActivityHistory:a=>a||[],normalizeAuditRecord:a=>a||{},persistStockProducts(){writes++;return true;}};
 vm.createContext(c);for(const name of ['normalizeMarketDistributor','normalizeStockAttachment','normalizeStockProduct','getLeadItemNumber','getStockDistributorForLead','getLeadProductStockFields','stockProductsMatchLeadProduct','mergeStockProduct','syncLeadProductsToStock'])vm.runInContext(part(name),c);
 c.stockProducts=[c.normalizeStockProduct({id:'stock',apn:'110001',distributor:'US Foods Anchorage',vendor:'Simplot',description:'Avocado halves',packaging:'12/16 oz',storage:'Frozen',updatedAt:'2026-01-01T12:00:00Z',attachments:[{id:'spec',name:'Spec.pdf',data:'data:application/pdf;base64,sample',category:'Specsheet'}]})];
 return {c,writes:()=>writes};
}
test('saving a lead with unchanged stock details does not rewrite the stock list or timestamp',()=>{
 const {c,writes}=stockSetup(),before=c.stockProducts[0];c.syncLeadProductsToStock([{apn:'110001',vendor:'Simplot',description:'Avocado halves'}],'US Foods');
 assert.equal(writes(),0);assert.equal(c.stockProducts[0],before);assert.equal(c.stockProducts[0].updatedAt,'2026-01-01T12:00:00Z');assert.equal(c.stockProducts[0].attachments[0].data,'data:application/pdf;base64,sample');
});
test('a lead still fills missing stock information and new stock products save once',()=>{
 const {c,writes}=stockSetup();c.stockProducts=c.stockProducts.map(row=>({...row,vendor:''}));
 c.syncLeadProductsToStock([{apn:'110001',vendor:'Simplot',description:'Avocado halves'}],'US Foods');assert.equal(writes(),1);assert.equal(c.stockProducts[0].vendor,'Simplot');
 c.syncLeadProductsToStock([{apn:'119999',vendor:'Simplot',description:'New stock item'}],'US Foods');assert.equal(writes(),2);assert.ok(c.stockProducts.some(row=>row.apn==='119999'));
});
test('stock merges preserve existing fields and mark only actual new information as updated',()=>{
 const {c}=stockSetup(),before=c.stockProducts[0];assert.equal(c.mergeStockProduct(before,{description:'Different description',vendor:'Different vendor'}),before);
 const next=c.mergeStockProduct(before,{k12:true});assert.equal(next.k12,true);assert.notEqual(next.updatedAt,before.updatedAt);assert.equal(next.description,before.description);assert.equal(next.attachments[0].data,before.attachments[0].data);
 assert.equal(c.mergeStockProduct(next,{k12:false}),next);
});
test('date-label formatting reuses formatters while preserving locale output',()=>{
 let constructions=0;const c={Intl:{DateTimeFormat:class extends Intl.DateTimeFormat{constructor(...args){super(...args);constructions++;}}},parseLocalDate:value=>{const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d);}};
 vm.createContext(c);for(const name of ['formatDate','formatDateTime'])vm.runInContext(part(name),c);
 for(let i=0;i<100;i++){assert.equal(c.formatDate('2026-11-06'),c.parseLocalDate('2026-11-06').toLocaleDateString(undefined,{month:'short',day:'numeric'}));assert.equal(c.formatDateTime('2026-11-06T18:30:00Z'),new Date('2026-11-06T18:30:00Z').toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}));}
 assert.equal(constructions,2);
 assert.equal(c.formatDate('invalid'),'Invalid Date');assert.equal(c.formatDateTime('invalid'),'Invalid Date');
});
test('My Day reuses one date formatter and still changes at Anchorage midnight and DST',()=>{
 let constructions=0;const c={module:{exports:{}},Intl:{DateTimeFormat:class extends Intl.DateTimeFormat{constructor(...args){super(...args);constructions++;}}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'task-date-parser.js'),'utf8'),c);const {today}=c.module.exports;
 assert.equal(today(new Date('2026-11-06T08:59:00Z')),'2026-11-05');assert.equal(today(new Date('2026-11-06T09:01:00Z')),'2026-11-06');
 assert.equal(today(new Date('2026-11-01T09:59:00Z')),'2026-11-01');assert.equal(today(new Date('2026-11-01T10:01:00Z')),'2026-11-01');
 for(let i=0;i<100;i++)today(new Date('2026-11-06T18:00:00Z'));assert.equal(constructions,1);
});
