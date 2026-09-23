const fail=message=>Object.assign(Error(message),{status:409});
export function normalUsername(value){return String(value||'').trim().replace(/^@/,'').toLowerCase();}
export function chooseUsername(users,value,name='member',exclude=''){
 const used=new Set(users.filter(u=>u.id!==exclude).map(u=>u.username));
 if(value){const candidate=normalUsername(value);if(!/^[a-z0-9][a-z0-9._]{2,29}$/.test(candidate))throw Object.assign(Error('Use 3–30 letters, numbers, dots or underscores for your username.'),{status:400});if(used.has(candidate))throw fail('That username is taken. Try adding a number or your surname.');return candidate;}
 let base=normalUsername(name).normalize('NFKD').replace(/[^a-z0-9]/g,'').slice(0,24)||'member';if(base.length<3)base+='mooi';let candidate=base,n=1;while(used.has(candidate))candidate=base+n++;return candidate;
}
export function ensureUsernames(db,save){let changed=false;for(const u of db.users)if(!u.username){u.username=chooseUsername(db.users,'',u.state?.profile?.name);changed=true;}if(changed)save();}
