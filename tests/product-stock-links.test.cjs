const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
function part(source,name,indent=''){const start=source.indexOf('function '+name+'(');if(start<0)return '';const end=source.indexOf('\n'+indent+'function ',start+1);return source.slice(start,end<0?undefined:end);}
const clone=value=>JSON.parse(JSON.stringify(value));
const decode=value=>value.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function list(id){return {id,options:[],querySelectorAll(){return this.options;},set innerHTML(html){this.options=[...html.matchAll(/<option\s+([^>]+)>/g)].map(match=>{const attrs=Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));return {value:attrs.value,label:attrs.label||'',textContent:'',dataset:{search:attrs['data-search']||''}};});}};}
function setup(){
 const stocks=[
  {id:'usf',distributor:'US Foods Anchorage',description:'Avocado halves',vendor:'Simplot',brandName:'Harvest Fresh',apn:'110001',manufacturerNumber:'MF100',packaging:'12/16 oz',storage:'Frozen',k12:true},
  {id:'sysco',distributor:'Sysco',description:'Avocado halves',vendor:'Simplot',supc:'770001',manufacturerNumber:'MF100',packaging:'12/16 oz',storage:'Frozen'},
  {id:'linford',distributor:'Linford',description:'Brioche buns',vendor:'Test Bakery',distributorNumber:'LF100',manufacturerNumber:'MF200',packaging:'6/12 count',storage:'Frozen'},
  {id:'quality',distributor:'Quality Sales',description:'Wheat rolls',vendor:'Test Bakery',distributorNumber:'QS100',manufacturerNumber:'MF300',packaging:'4/24 count',storage:'Frozen'}
 ];
 const lists=new Map(['productSearchSuggestions','apnSuggestions','timelineSearchSuggestions'].map(id=>[id,list(id)]));
 const c={console,stockProducts:clone(stocks),cards:[],eventProducts:[],marketVisits:[],addressBook:[],manualVendorReports:[],samples:[],todos:[],leadProductSuggestionsDirty:true,timelineSuggestionsDirty:true,
  window:{foodBrokerVendors:{canonical:value=>String(value||'').trim()}},document:{getElementById:id=>lists.get(id)||null,addEventListener(){}},
  elements:{leadDistributor:{value:'US Foods'},productSearchSuggestions:lists.get('productSearchSuggestions'),apnSuggestions:lists.get('apnSuggestions'),timelineSearchSuggestions:lists.get('timelineSearchSuggestions')},
  normalizeVendorName:value=>String(value||'').trim(),normalizeVendorLogoKey:value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,''),normalizeProducts:card=>card.products||[],preferredLeadDistributor:()=> 'US Foods',getAccountDirectory:()=>[],getMarketVisitOperators:()=>[],getOperatorName:()=>'',resolveEventProduct:()=>null,
  escapeAttribute:value=>String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'product-catalog.js'),'utf8'),c);
 for(const name of ['normalizeMarketDistributor','distributorMatchesStock','getProductNumberForDistributor','getLeadItemNumber','getLeadProductSuggestionProducts','getProductDirectory','getLeadProductSearchDirectory','findLeadProductSearchMatch','rebuildLeadProductSuggestions','getInputSuggestionList','refreshFocusedSuggestions','rebuildTimelineSearchSuggestions','getStockSearchText','getMarketVisitProducts','getProductsByVendor','getMarketProductCandidates','findStockProductForVendorReport','getVendorReportMainVendor','fillProductFromApn']){const source=part(app,name);if(source)vm.runInContext(source,c);}
 const visits=fs.readFileSync(path.join(root,'market-visit-layout.js'),'utf8');for(const name of ['formatVisitProductCodes','getVisitProductPickerCandidates'])vm.runInContext(part(visits,name),c);
 const k12=fs.readFileSync(path.join(root,'k12-stock.js'),'utf8');for(const name of ['k12ProductKey','getCrossStockIndex','getK12Products'])vm.runInContext(part(k12,name),c);
 const start=app.indexOf('  const getValues = (input) => {'),end=app.indexOf('\n  const positionMenu =',start);
 c.readSuggestions=vm.runInContext('(()=>{'+app.slice(start,end)+';return getValues;})()',c);
 const input=id=>({list:null,dataset:{suggestionList:id},getAttribute:()=>null});
 return {c,lists,input,values:input=>Array.from(c.readSuggestions(input),value=>typeof value==='string'?value:value.value)};
}

test('an enhanced product search with no native list rebuilds its stock suggestions on first input',()=>{
 const s=setup();s.c.refreshFocusedSuggestions({target:s.input('productSearchSuggestions')});
 assert.equal(s.c.leadProductSuggestionsDirty,false);assert.ok(s.lists.get('productSearchSuggestions').options.some(option=>option.value.includes('Simplot')));
});
test('the menu reads freshly rebuilt products before rendering the first keystroke',()=>{
 const s=setup();assert.ok(s.values(s.input('productSearchSuggestions')).some(value=>value.includes('110001')&&value.includes('Simplot')));
});
test('an already-open enhanced search sees updated stock descriptions and item numbers after invalidation',()=>{
 const s=setup(),input=s.input('productSearchSuggestions');s.values(input);
 s.c.stockProducts=s.c.stockProducts.map(item=>item.id==='usf'?{...item,description:'Updated avocado halves',apn:'119999'}:item);s.c.leadProductSuggestionsDirty=true;
 const values=s.values(input);assert.ok(values.some(value=>value.includes('Updated avocado halves')&&value.includes('119999')));assert.ok(!values.some(value=>value.includes('110001')));
});
test('stock-list replacement refreshes choices without relying on a dirty flag or reopening the form',()=>{
 const s=setup(),input=s.input('productSearchSuggestions');s.values(input);assert.equal(s.c.leadProductSuggestionsDirty,false);
 s.c.stockProducts=s.c.stockProducts.map(item=>item.id==='usf'?{...item,description:'Fresh stock update',apn:'118888'}:item);
 assert.ok(s.values(input).some(value=>value.includes('Fresh stock update')&&value.includes('118888')));
 s.c.elements.leadDistributor.value='Sysco';assert.ok(s.values(input).some(value=>value.includes('770001')));assert.ok(!s.values(input).some(value=>value.includes('118888')));
});
test('stock-only additions and removals are reflected in an already-used product search',()=>{
 const s=setup(),input=s.input('productSearchSuggestions');s.values(input);
 s.c.stockProducts=[...s.c.stockProducts.filter(item=>item.id!=='usf'),{id:'new-stock',distributor:'US Foods Anchorage',description:'New Simplot item',vendor:'Simplot',apn:'118877'}];
 const values=s.values(input);assert.ok(values.some(value=>value.includes('118877')));assert.ok(!values.some(value=>value.includes('110001')));
});
test('native inputs remain supported and unrelated suggestion lists do not build product catalogs',()=>{
 const s=setup();s.c.refreshFocusedSuggestions({target:{list:s.lists.get('apnSuggestions')}});assert.equal(s.c.leadProductSuggestionsDirty,false);
 s.c.leadProductSuggestionsDirty=true;s.c.refreshFocusedSuggestions({target:s.input('vendorSuggestions')});assert.equal(s.c.leadProductSuggestionsDirty,true);
});
test('enhanced timeline suggestions include stock entries beyond the old 500-option cutoff',()=>{
 const s=setup();s.c.stockProducts=Array.from({length:600},(_,i)=>({id:'stock-'+i,description:'Catalog item '+i,vendor:'Vendor '+i,apn:String(100000+i),distributor:'US Foods Anchorage'}));
 s.c.stockProducts.push({id:'last',description:'Zucchini avocado',vendor:'Simplot',apn:'999999',distributor:'US Foods Anchorage'});
 const values=s.values(s.input('timelineSearchSuggestions'));assert.ok(values.includes('Simplot'));assert.ok(values.includes('999999'));
});
for(const [distributor,expected,excluded] of [['US Foods','110001','770001'],['Sysco','770001','110001'],['Linford','LF100','QS100'],['Quality Sales','QS100','LF100']])test(`${distributor} lead choices use the correct stock-list item numbers`,()=>{
 const {c}=setup();const rows=c.getLeadProductSearchDirectory(distributor);assert.ok(rows.some(row=>row.number===expected));assert.ok(!rows.some(row=>row.number===excluded));
});
test('lead search indexes brand and manufacturer details without changing the selected value',()=>{
 const s=setup(),entries=s.c.readSuggestions(s.input('productSearchSuggestions')),entry=entries.find(entry=>entry.value?.includes('110001'));
 assert.ok(entry);assert.match(entry.search,/harvest fresh/i);assert.match(entry.search,/mf100/i);assert.ok(entry.value.includes('Avocado halves'));
});
for(const type of ['personal','manufacturer','foodshow','testkitchen'])test(`${type} visit/event picker resolves current stock data and excludes selected products`,()=>{
 const {c}=setup(),visit={type,vendor:type==='manufacturer'?'Simplot':'',productIds:[],newProductIds:[]};
 assert.ok(c.getVisitProductPickerCandidates(visit).some(item=>item.description==='Avocado halves'));
 c.stockProducts=c.stockProducts.map(item=>item.manufacturerNumber==='MF100'?{...item,description:'Updated avocado halves'}:item);
 assert.ok(c.getVisitProductPickerCandidates(visit).some(item=>item.description==='Updated avocado halves'));
 visit.productIds=['usf'];assert.ok(!c.getVisitProductPickerCandidates(visit).some(item=>c.window.foodBrokerProducts.same(item,c.stockProducts[0])));
});
test('K-12 and stock search retain linked distributor numbers, brands and manufacturer codes',()=>{
 const {c}=setup(),product=c.getK12Products()[0];assert.equal(product.apn,'110001');assert.equal(product.supc,'770001');assert.equal(product.k12Usf,true);assert.equal(product.k12Sysco,true);
 for(const term of ['harvest fresh','mf100','110001'])assert.ok(c.getStockSearchText(c.stockProducts[0]).includes(term));
});
test('vendor reports resolve their stock-linked vendor from the current list after changes',()=>{
 const {c}=setup();assert.equal(c.findStockProductForVendorReport({apn:'110001'}).id,'usf');assert.equal(c.findStockProductForVendorReport({supc:'770001'}).id,'sysco');
 c.stockProducts=c.stockProducts.map(item=>item.id==='usf'?{...item,vendor:'Updated stock vendor'}:item);
 assert.equal(c.getVendorReportMainVendor({apn:'110001',vendor:'Earlier vendor'}),'Updated stock vendor');
});
test('the lead item-number row fills current stock details for the chosen distributor',()=>{
 const {c}=setup(),fields={'.product-apn':{value:'770001'},'.product-description':{value:''},'.product-vendor-input':{value:''}};c.elements.leadDistributor.value='Sysco';
 c.fillProductFromApn({querySelector:selector=>fields[selector]});assert.equal(fields['.product-description'].value,'Avocado halves');assert.equal(fields['.product-vendor-input'].value,'Simplot');
});
test('Print Center rebuilds stock choices from current rows and retains only available selections',()=>{
 const {c}=setup(),source=fs.readFileSync(path.join(root,'team-print-center.js'),'utf8');
 Object.assign(c,{state:{selected:new Set(['stock:usf']),eventProducts:new Map()},allowed:()=>true,text:value=>String(value||''),productKey:product=>product._kind+':'+product.id,
  projection:(product,kind,id)=>({...product,_kind:kind,id}),refreshPrintSources(){},renderPicker(){},pageSize:60});
 for(const name of ['safeStocks','safeNewProducts','safeEvents','sortProducts','resolveStock','snapshot'])vm.runInContext(part(source,name,'  '),c);
 c.snapshot();assert.equal(c.state.stock.length,4);assert.ok(c.state.selected.has('stock:usf'));
 c.stockProducts=[...c.stockProducts.filter(item=>item.id!=='usf'),{id:'new',distributor:'US Foods Anchorage',description:'Latest catalog entry',vendor:'Simplot',apn:'112233'}];
 c.snapshot();assert.ok(c.state.stock.some(item=>item.description==='Latest catalog entry'));assert.ok(!c.state.selected.has('stock:usf'));
});

test('all workspace timeline inputs are connected to the shared stock suggestions',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const inputs=[...html.matchAll(/<input\b[^>]*class="timeline-search-input"[^>]*>/g)];
 assert.equal(inputs.length,7);
 for(const [input] of inputs)assert.match(input,/list="timelineSearchSuggestions"/);
});
