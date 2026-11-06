const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),LZ=require('../vendor/lz-string.js'),source=fs.readFileSync(path.join(root,'compact-storage.js'),'utf8'),workerSource=fs.readFileSync(path.join(root,'compact-storage-worker.js'),'utf8');
const key='broker-whiteboard-cards',large=value=>JSON.stringify([{id:'lead',notes:value,attachment:'sample file '.repeat(24000)}]);
function setup({unavailable=false}={}){
 const workers=[],events=new Map();let compressions=0;
 class Storage{constructor(){this.raw=new Map();this.fail=false;}getItem(k){return this.raw.get(String(k))??null;}setItem(k,v){if(this.fail)throw Error('Storage full');this.raw.set(String(k),String(v));}removeItem(k){this.raw.delete(String(k));}}
 const local=new Storage(),library={...LZ,compressToUTF16:text=>{compressions++;return LZ.compressToUTF16(text);}};
 class Worker{constructor(){if(unavailable)throw Error('Worker unavailable');this.jobs=[];workers.push(this);}postMessage(job){this.jobs.push(job);}terminate(){this.stopped=true;}complete(){const job=this.jobs.shift();assert.ok(job,'a worker job is queued');let result;const self={postMessage:value=>{result=value;}};vm.runInNewContext(workerSource,{self,LZString:library,importScripts(){}});self.onmessage({data:job});this.onmessage({data:result});}}
 const scope={Storage,LZString:library,window:{LZString:library,localStorage:local,Worker,addEventListener:(name,fn)=>events.set(name,fn)}};
 vm.runInNewContext(source,scope);
 return {local,raw:local.raw,api:scope.window.foodBrokerCompactStorage,workers,events,compressions:()=>compressions,complete:()=>workers[0].complete()};
}

test('normal Storage writes stay synchronous and never queue a worker',()=>{
 const s=setup(),text=large('original');s.local.setItem(key,text);
 assert.equal(s.local.getItem(key),text);assert.equal(s.workers.length,0);assert.equal(s.compressions(),1);
});
test('deferred preparation does no compression or collection write on the caller thread',async()=>{
 const s=setup(),text=large('saved edit');s.local.setItem(key,'old');
 assert.equal(s.api.defer(key,text),true);assert.equal(s.compressions(),0);assert.equal(s.local.getItem(key),'old');
 s.complete();await Promise.resolve();assert.equal(s.local.getItem(key),text);
 const raw=s.raw.get(key);assert.ok(raw.startsWith('~FBB-LZ1~'));assert.equal(LZ.decompressFromUTF16(raw.slice(9)),text);
});
test('newer queued edits supersede stale work and all confirmations wait for the newest durable cache',async()=>{
 const s=setup();s.local.setItem(key,'old');let settled=false;
 const first=s.api.writeAsync(key,large('first')).then(()=>{settled=true;});
 const second=s.api.writeAsync(key,large('second')),last=s.api.writeAsync(key,large('last'));
 assert.equal(s.workers[0].jobs.length,1);s.complete();await Promise.resolve();
 assert.equal(settled,false);assert.equal(s.local.getItem(key),'old');assert.equal(s.workers[0].jobs.length,1);
 s.complete();await Promise.all([first,second,last]);assert.equal(s.local.getItem(key),large('last'));assert.equal(s.compressions(),2);
});
test('a synchronous save supersedes an in-flight cache without a late overwrite',async()=>{
 const s=setup();s.local.setItem(key,'old');const pending=s.api.writeAsync(key,large('older'));
 s.local.setItem(key,'newer synchronous value');await pending;s.complete();assert.equal(s.local.getItem(key),'newer synchronous value');
});
test('saving the existing durable value can cancel a pending change intentionally',async()=>{
 const s=setup();s.local.setItem(key,'original');const pending=s.api.writeAsync(key,large('pending'));
 s.local.setItem(key,'original');await pending;s.complete();assert.equal(s.local.getItem(key),'original');
});
test('another window cache write is preserved and the uncommitted job rejects',async()=>{
 const s=setup();s.local.setItem(key,'old');const pending=s.api.writeAsync(key,large('this window'));
 const rejected=assert.rejects(pending,/Another window/);s.raw.set(key,'other window');s.complete();await rejected;
 assert.equal(s.local.getItem(key),'other window');
});
test('quota failure never confirms a cache write or changes the memo',async()=>{
 const s=setup();s.local.setItem(key,'old');const pending=s.api.writeAsync(key,large('new'));
 const rejected=assert.rejects(pending,/Storage full/);s.local.fail=true;s.complete();await rejected;assert.equal(s.local.getItem(key),'old');
});
test('worker startup failure falls back to a synchronous durable write',async()=>{
 const s=setup({unavailable:true}),text=large('fallback');assert.equal(s.api.defer(key,text),false);
 await s.api.writeAsync(key,text);assert.equal(s.local.getItem(key),text);
});
test('worker execution failure rejects pending confirmations and enables safe fallback',async()=>{
 const s=setup();s.local.setItem(key,'old');const pending=s.api.writeAsync(key,large('new'));
 const rejected=assert.rejects(pending,/Background browser saving stopped/);s.workers[0].onerror();await rejected;
 assert.equal(s.local.getItem(key),'old');await s.api.writeAsync(key,large('retry'));assert.equal(s.local.getItem(key),large('retry'));
});
test('auth and recovery-edit keys cannot be deferred',async()=>{
 const s=setup(),text=large('private');
 for(const name of ['sb-auth-session','broker-whiteboard-work-outbox:user:leads:edit'])assert.equal(s.api.defer(name,text),false);
 assert.equal(s.workers.length,0);await s.api.writeAsync('sb-auth-session',text);assert.equal(s.raw.get('sb-auth-session'),text);
});
test('leaving the workspace cancels old-user work and ignores late worker responses',async()=>{
 const s=setup();s.local.setItem(key,'old');const pending=s.api.writeAsync(key,large('prior user'));
 const rejected=assert.rejects(pending,/workspace closed/);s.events.get('foodbrokerbase:workspace-leaving')();await rejected;
 s.raw.set(key,'new user');s.complete();assert.equal(s.local.getItem(key),'new user');assert.equal(s.workers[0].stopped,true);
});
