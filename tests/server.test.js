import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.js';
import {validateState,blankState,categories} from '../shared.js';
test('accounts, wardrobe isolation, repeated generation and garment-reference image rendering',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'closet-test-'));let iteration=0,prompt='',references=0;
 const upstream=async(url,opts)=>{if(url.endsWith('/responses')){const b=JSON.parse(opts.body);if(b.text.format.name==='garment')return Response.json({output_text:JSON.stringify({name:'Blue jeans',cat:'bottom',colour:'Blue',style:'Everyday',material:'',fit:'Regular',formality:1,confidence:.9,notes:'Confirm the colour.'})});iteration++;return Response.json({output_text:JSON.stringify({outfits:[0,1,2].map(n=>({name:'Look '+iteration+'-'+n,ids:['real-jeans'],suggestions:[{name:`Top ${iteration}-${n}`,category:'top',retailer:'Bash'}],reason:'Wear your jeans.'}))})});}prompt=opts.body.get('prompt');references=opts.body.getAll('image[]').length;return Response.json({data:[{b64_json:'aGVsbG8='}]});};
 const server=createApp({dataDir:dir,apiKey:'test-key',fetch:upstream,weatherFetch:async()=>{throw Error('offline');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let cookie='';
 const call=async(p,b,method='POST',custom={})=>{const r=await fetch(base+p,{method:b===undefined?'GET':method,headers:{'Content-Type':'application/json',cookie,...custom},body:b===undefined?undefined:JSON.stringify(b)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{
 assert.equal((await call('/api/state')).status,401);
 let r=await call('/api/auth/register',{email:'test@example.com',password:'a-long-test-password',name:'Test',gender:'Female'});assert.equal(r.status,200);cookie=r.cookie;const firstCookie=cookie;let s=r.data.state;s.items=[{id:'real-jeans',name:'My jeans',cat:'bottom',colour:'Blue',image:'data:image/jpeg;base64,aGVsbG8='}];
 s.personal={completed:true,photo:'data:image/jpeg;base64,aGVsbG8=',usePhoto:true,lifestyle:'Office and weekends',avoid:'Heels',bodyShape:'Straight silhouette'};
 assert.equal((await call('/api/state',{state:s,revision:0},'PUT')).status,200);
 assert.equal((await call('/api/state')).data.state.personal.avoid,'Heels');
 assert.equal((await call('/api/analyse-personal',{imageData:s.personal.photo,consent:false})).status,400);
 const tagging=await call('/api/tag-item',{imageData:s.personal.photo});assert.equal(tagging.data.name,'Blue jeans');
 assert.equal((await call('/api/state',{state:s,revision:0},'PUT')).status,409);
 assert.equal((await call('/.env')).status,404);
 assert.equal((await call('/api/state',undefined,'GET',{Origin:'https://evil.example'})).status,403);
 const one=await call('/api/generate-outfits',{anchorId:'real-jeans'});assert.equal(one.status,200);assert.equal(one.data.outfits.length,3);assert.ok(one.data.outfits.slice(0,2).every(o=>o.ids.includes('real-jeans')));
 const two=await call('/api/generate-outfits',{weather:'Automatic'});assert.equal(two.status,200);assert.match(two.data.weatherNotice,/unavailable/);assert.notEqual(one.data.outfits[0].name,two.data.outfits[0].name);
 const image=await call('/api/render-outfit',{id:two.data.outfits[0].id});assert.equal(image.status,200);assert.equal(references,2);assert.match(prompt,/adult female/);assert.match(prompt,/LAST reference image shows the user/);assert.match(prompt,/Heels/);assert.match(image.data.outfit.image,/^data:image/);
 const tryOn=await call('/api/render-outfit',{id:two.data.outfits[0].id,tryOn:true,regenerate:true});assert.equal(tryOn.status,200);assert.match(tryOn.data.outfit.tryOnImage,/^data:image/);assert.equal(tryOn.data.outfit.image,image.data.outfit.image);assert.equal(tryOn.data.outfit.tryOnStatus,'ready');
 const latest=await call('/api/state');latest.data.state.personal.usePhoto=false;await call('/api/state',{state:latest.data.state,revision:latest.data.revision},'PUT');
 assert.equal((await call('/api/render-outfit',{id:two.data.outfits[0].id,tryOn:true,regenerate:true})).status,400);
 r=await call('/api/auth/register',{email:'second@example.com',password:'a-long-test-password',gender:'Male'});cookie=r.cookie;assert.equal((await call('/api/state')).data.state.items.length,0);
 assert.equal((await call('/api/render-outfit',{id:two.data.outfits[0].id})).status,404);
 cookie=firstCookie;await call('/api/auth/logout',{});assert.equal((await call('/api/state')).status,401);
 assert.equal((await call('/api/auth/login',{email:'test@example.com',password:'incorrect-password'})).status,401);
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('accessory categories and independent try-on survive persistence',()=>{const state=blankState();state.items=Object.keys(categories).map((cat,n)=>({id:'piece-'+n,cat,name:cat}));state.outfits=[{id:'manual',ids:state.items.map(i=>i.id).slice(0,12),suggestions:[],name:'Edited look',source:'Styled by you',image:'data:image/png;base64,YQ==',tryOnImage:'data:image/png;base64,Yg==',tryOnStatus:'ready'}];const restored=validateState(state);assert.equal(restored.items.length,Object.keys(categories).length);assert.equal(restored.outfits[0].source,'Styled by you');assert.equal(restored.outfits[0].tryOnImage,'data:image/png;base64,Yg==');assert.notEqual(restored.outfits[0].image,restored.outfits[0].tryOnImage);});
