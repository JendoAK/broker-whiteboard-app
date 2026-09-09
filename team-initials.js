"use strict";
let savedTeamInitials = new Map();
let syncedInitialsSignature = '';
function currentAuditInitials(audit) {
  const email=String(audit?.email||'').trim().toLowerCase();
  const user=window.foodBrokerBaseAuth?.getCurrentUser?.();
  const own=email && email===String(user?.email||'').toLowerCase() ? user?.user_metadata?.initials : '';
  return savedTeamInitials.get(email) || (/^[A-Z]{1,4}$/.test(own||'')?own:audit?.initials||'');
}
function updateRecordedInitials(value) {
  if(Array.isArray(value))return value.map(updateRecordedInitials);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,key==='_audit'&&item?{...item,initials:currentAuditInitials(item)}:updateRecordedInitials(item)]));
}
async function syncSavedTeamInitials() {
  const auth=window.foodBrokerBaseAuth;
  if(!auth?.isSuperUser())return;
  const userId=auth.getCurrentUser()?.id;
  const [profiles,initials]=await Promise.all([auth.client.rpc('get_team_profiles'),auth.client.rpc('get_team_initials')]);
  if(profiles.error||initials.error)throw profiles.error||initials.error;
  if(auth.getCurrentUser()?.id!==userId||!auth.isSuperUser())return;
  const byId=new Map((initials.data||[]).map(row=>[row.user_id,String(row.initials||'').toUpperCase()]));
  savedTeamInitials=new Map((profiles.data||[]).filter(row=>row.email&&/^[A-Z]{1,4}$/.test(byId.get(row.user_id)||'')).map(row=>[row.email.trim().toLowerCase(),byId.get(row.user_id)]));
  const signature=userId+JSON.stringify([...savedTeamInitials].sort());
  if(signature===syncedInitialsSignature)return;
  for(const table of ['app_records','team_app_records']) {
    for(let offset=0;;offset+=100) {
      if(auth.getCurrentUser()?.id!==userId||!auth.isSuperUser())return;
      const {data,error}=await auth.client.from(table).select('id,data,updated_at').eq('record_type',table==='app_records'?'app_section':'team_section').order('id').range(offset,offset+99);
      if(error)throw error;
      for(const row of data||[]) {
        const updated=updateRecordedInitials(row.data);
        if(JSON.stringify(updated)===JSON.stringify(row.data))continue;
        const result=await auth.client.from(table).update({data:updated}).eq('id',row.id).eq('updated_at',row.updated_at).select('id');
        if(result.error||!result.data?.length)throw result.error||new Error('A record changed during initials refresh. Retry on the next sync.');
      }
      if((data||[]).length<100)break;
    }
  }
  syncedInitialsSignature=signature;
}
window.addEventListener('foodbrokerbase:initials',()=>{ syncedInitialsSignature=''; if(typeof loadCloudSections==='function')loadCloudSections({silent:true}); });
window.addEventListener('foodbrokerbase:auth',()=>{ savedTeamInitials=new Map();syncedInitialsSignature=''; });
