import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.js';
import {chooseUsername,ensureUsernames} from '../usernames.js';
test('existing names receive stable unique handles without exposing emails',()=>{
 const db={users:[{id:'a',state:{profile:{name:'Melissa Colin'}}},{id:'b',state:{profile:{name:'Melissa Colin'}}}]};let saved=0;
 ensureUsernames(db,()=>saved++);assert.deepEqual(db.users.map(u=>u.username),['melissacolin','melissacolin1']);ensureUsernames(db,()=>saved++);assert.equal(saved,1);
 assert.throws(()=>chooseUsername(db.users,'MELISSACOLIN'),/taken/);assert.throws(()=>chooseUsername(db.users,'bad name'),/3–30/);
});
test('username uniqueness, search privacy and friend requests work end to end',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mooi-handles-')),app=createApp({dataDir:dir,apiKey:''});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
 const call=async(p,body,cookie='')=>{const r=await fetch(base+'/api/'+p,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{const details={password:'test-password-long',gender:'Female',name:'Melissa Colin',username:'MelissaColin'};
 const a=await call('auth/register',{...details,email:'first@example.com'});assert.equal(a.status,200);assert.equal(a.data.user.username,'melissacolin');
 assert.equal((await call('auth/register',{...details,email:'second@example.com',username:'MELISSACOLIN'})).status,409);
 const b=await call('auth/register',{...details,email:'second@example.com',username:'melissacolin2'});assert.equal(b.status,200);
 assert.equal((await call('social/search?q=melissa')).status,401);
 const found=await call('social/search?q=melissa',undefined,a.cookie);assert.equal(found.data.people.length,1);assert.equal(found.data.people[0].username,'melissacolin2');assert.equal(found.data.people[0].email,undefined);assert.equal(found.data.people[0].state,undefined);
 assert.equal((await call('social/search?q=second%40example.com',undefined,a.cookie)).data.people.length,0);
 assert.equal((await call('auth/username',{username:'melissacolin'},b.cookie)).status,409);
 assert.equal((await call('auth/username',{username:'melissa.style'},b.cookie)).status,200);
 assert.equal((await call('social/request',{username:'MELISSA.STYLE'},a.cookie)).status,200);
 assert.equal((await call('social/feed',undefined,b.cookie)).data.incoming[0].person.username,'melissacolin');
 }finally{await new Promise(r=>app.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('exhausted AI credits are explained without exposing the API key',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mooi-credits-')),app=createApp({dataDir:dir,apiKey:'private-test-key',fetch:async()=>Response.json({error:{code:'credit_balance_exhausted'}},{status:429})});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
 try{const signup=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'credits@example.com',password:'test-password-long',name:'Credit test',gender:'Female'})});const cookie=signup.headers.get('set-cookie').split(';')[0];const r=await fetch(base+'/api/tag-item',{method:'POST',headers:{'Content-Type':'application/json',cookie},body:JSON.stringify({imageData:'data:image/png;base64,YQ=='})});assert.equal(r.status,503);const result=await r.json();assert.match(result.error,/AI credits are unavailable/);assert.ok(!JSON.stringify(result).includes('private-test-key'));}finally{await new Promise(r=>app.close(r));rmSync(dir,{recursive:true,force:true});}
});
