import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monthDays,validDate} from '../calendar-ui.js';
import {blankState,validateState} from '../shared.js';
import {createApp} from '../server.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
test('calendar aligns Mondays, handles leap years and year rollover',()=>{
 const leap=monthDays(2028,1);assert.equal(leap.filter(Boolean).length,29);assert.equal(leap[1],'2028-02-01');
 assert.equal(monthDays(2026,1).filter(Boolean).length,28);
 assert.equal(monthDays(2026,12).filter(Boolean)[0],'2027-01-01');
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2026-13-01'),false);
});
test('calendar assignments can be saved, changed and removed through the account API',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mooi-calendar-'));
 const server=createApp({dataDir:dir,apiKey:''});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;let cookie='';
 async function call(route,body,method='POST'){const r=await fetch(base+'/api/'+route,{method:body===undefined?'GET':method,headers:{'Content-Type':'application/json',cookie},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return r.json();}
 try{
 let result=await call('auth/register',{email:'calendar@example.com',password:'test-calendar-password',name:'Calendar',gender:'Female'});let state=result.state,revision=result.revision;
 state.outfits=[{id:'one',name:'Work',ids:[],suggestions:[]},{id:'two',name:'Weekend',ids:[],suggestions:[]}];
 for(const value of ['one','two',null]){if(value)state.plans['2026-09-19']=value;else delete state.plans['2026-09-19'];({revision}=await call('state',{state,revision},'PUT'));result=await call('state');assert.equal(result.state.plans['2026-09-19'],value||undefined);state=result.state;}
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('plans survive state validation and disappear when their outfit is removed',()=>{
 const s=blankState();s.outfits=[{id:'look-1',name:'Weekend',ids:[],suggestions:[]}];s.plans={'2026-09-19':'look-1'};
 assert.equal(validateState(s).plans['2026-09-19'],'look-1');s.outfits=[];assert.deepEqual(validateState(s).plans,{});
});
