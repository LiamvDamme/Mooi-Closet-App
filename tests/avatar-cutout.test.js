import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.js';
import {removeBackgroundPixels,eraseRegion} from '../photo-tools.js';

test('cleanup handles gradual lighting, preserves fabric, and a tapped background removes only its connected region',()=>{
 const w=30,h=30,frame={width:w,height:h,data:new Uint8ClampedArray(w*h*4)};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=(y*w+x)*4,v=190+x*2;frame.data.set([v,v,v,255],p);if(x>=8&&x<22&&y>=6&&y<25)frame.data.set([40,60,120,255],p);}
 removeBackgroundPixels(frame);assert.equal(frame.data[3],0);assert.equal(frame.data[(15*w+15)*4+3],255);
 const patch={width:3,height:1,data:new Uint8ClampedArray([255,255,255,255,0,0,0,255,255,255,255,255])};eraseRegion(patch,0,0);assert.equal(patch.data[3],0);assert.equal(patch.data[7],255);assert.equal(patch.data[11],255);
 const blank={width:10,height:10,data:new Uint8ClampedArray(400).fill(255)},before=blank.data.slice();assert.throws(()=>removeBackgroundPixels(blank));assert.deepEqual(blank.data,before);
});

test('avatar is private, consented, reused and invalidated when the signup photo changes; outfit uses avatar and original identity',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mooi-avatar-'));let calls=0,refs=[],prompt='';
 const server=createApp({dataDir:dir,apiKey:'test',fetch:async(url,opts)=>{calls++;assert.equal(opts.body.get('quality'),'low');assert.equal(opts.body.get('size'),'1024x1024');assert.equal(opts.body.get('output_format'),'jpeg');refs=await Promise.all(opts.body.getAll('image[]').map(b=>b.text()));prompt=opts.body.get('prompt');return Response.json({data:[{b64_json:Buffer.from('avatar-'+calls).toString('base64')}]});}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let cookie='';const base='http://127.0.0.1:'+server.address().port;
 const call=async(p,body,method='POST')=>{const r=await fetch(base+'/api/'+p,{method:body===undefined?'GET':method,headers:{cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};};
 try{
  assert.equal((await call('generate-avatar',{consent:true})).status,401);
  let r=await call('auth/register',{email:'avatar@example.com',name:'Avatar',gender:'Female',password:'long-test-password'});let state=r.data.state;
  assert.equal((await call('generate-avatar',{consent:true})).status,400);assert.equal(calls,0);
  state.personal={photo:'data:image/png;base64,c2lnbnVwLXBob3Rv',usePhoto:true};state.items=[{id:'shirt',cat:'top',name:'My shirt',colour:'White',image:'data:image/png;base64,bXktc2hpcnQ='}];state.outfits=[{id:'look',ids:['shirt'],suggestions:[],gender:'Female',name:'My look'}];
  await call('state',{state,revision:r.data.revision},'PUT');assert.equal((await call('generate-avatar',{consent:false})).status,400);
  r=await call('generate-avatar',{consent:true});assert.equal(r.status,200);assert.deepEqual(refs,['signup-photo']);assert.match(prompt,/never a substitute model/);assert.equal(calls,1);
  assert.equal((await call('generate-avatar',{consent:true})).data.cached,true);assert.equal(calls,1);
  r=await call('render-outfit',{id:'look'});assert.equal(r.status,200);assert.deepEqual(refs,['my-shirt','avatar-1','signup-photo']);assert.match(prompt,/second-last reference/);assert.ok(prompt.length<6000);const paidCalls=calls;await call('render-outfit',{id:'look'});assert.equal(calls,paidCalls,'opening a completed preview must not charge for a second image');
  r=await call('state');state=r.data.state;assert.ok(state.personal.avatar);await call('state',{state,revision:r.data.revision},'PUT');assert.ok((await call('state')).data.state.personal.avatar);
  r=await call('state');state=r.data.state;state.personal.photo='data:image/png;base64,bmV3LXBob3Rv';await call('state',{state,revision:r.data.revision},'PUT');assert.ok(!(await call('state')).data.state.personal.avatar);
  await call('generate-avatar',{consent:true});assert.deepEqual(refs,['new-photo']);r=await call('state');state=r.data.state;state.personal.usePhoto=false;await call('state',{state,revision:r.data.revision},'PUT');assert.ok(!(await call('state')).data.state.personal.avatar);assert.equal((await call('generate-avatar',{consent:true})).status,400);
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
