import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPostgresStore} from '../postgres-store.js';
import {createApp} from '../server.js';
// A transactional driver double exercises restart/login and failure semantics.
// Deployment verification also checks the real PostgreSQL connection.
test('database accounts survive server replacement and failed saves do not issue sessions',async()=>{
 let persisted={users:[],sessions:[]},failWrite=false;
 class Pool {on(){} async end(){} async query() {return {rows:[]};} async connect(){let draft;return {async query(sql,args){if(sql==='BEGIN')draft=structuredClone(persisted);if(sql.startsWith('SELECT'))return {rows:[{data:structuredClone(draft)}]};if(sql.startsWith('UPDATE')){if(failWrite)throw Error('disk unavailable');draft=JSON.parse(args[0]);}if(sql==='COMMIT')persisted=draft;return {rows:[]};},release(){}};}}
 const storage=await createPostgresStore('test',{PoolClass:Pool});
 let server,base;
 async function start(){server=createApp({storage,apiKey:'',dataDir:process.env.TEMP});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 const call=async(route,body,cookie='')=>{const r=await fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',cookie},body:body?JSON.stringify(body):undefined});return {status:r.status,cookie:r.headers.get('set-cookie'),data:await r.json()};};
 const account={email:'persistent@example.com',password:'long-test-password',name:'Storage test',gender:'Female',remember:true};
 try{await start();let r=await call('auth/register',account);assert.equal(r.status,200);const cookie=r.cookie.split(';')[0];assert.equal(persisted.users.length,1);await new Promise(r=>server.close(r));await start();assert.equal((await call('auth/me',null,cookie)).data.user.email,account.email);assert.equal((await call('auth/login',account)).status,200);
 failWrite=true;r=await call('auth/register',{...account,email:'failure@example.com'});assert.equal(r.status,503);assert.equal(r.cookie,null);assert.equal(persisted.users.length,1);failWrite=false;assert.equal((await call('auth/login',{...account,email:'failure@example.com'})).status,401);
 }finally{await new Promise(r=>server.close(r));await storage.close();}
});
