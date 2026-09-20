import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.js';
import {matches} from '../social-ui.js';
test('friend acceptance gates posts; snapshot contains only shared pieces; removal revokes access',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'closet-social-'));const server=createApp({dataDir:dir,apiKey:''});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const call=async(cookie,p,body,method='POST')=>{const r=await fetch(base+'/api/'+p,{method:body===undefined?'GET':method,headers:{'Content-Type':'application/json',cookie:cookie||''},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{const a=await call('','auth/register',{email:'a@example.com',password:'test-password-long',name:'A',gender:'Female'}),b=await call('','auth/register',{email:'b@example.com',password:'test-password-long',name:'B',gender:'Female'}),c=await call('','auth/register',{email:'c@example.com',password:'test-password-long',name:'C',gender:'Male'});
 const state=a.data.state;state.items=[{id:'top1',cat:'top',name:'Ivory shirt',colour:'Cream',size:'private-size'},{id:'secret',cat:'shoe',name:'Unshared shoes',colour:'Black'}];state.outfits=[{id:'look1',name:'Linen days',ids:['top1'],suggestions:[],gender:'Female'}];state.personal={photo:'data:image/png;base64,YQ==',bodyNotes:'private-fit'};
 await call(a.cookie,'state',{state,revision:0},'PUT');
 assert.equal((await call(a.cookie,'social/share',{id:'look1'})).status,400);
 assert.equal((await call(a.cookie,'social/share',{id:'look1',confirm:true})).status,200);
 assert.equal((await call(b.cookie,'social/feed')).data.posts.length,0);
 const bFeed=await call(b.cookie,'social/feed');await call(a.cookie,'social/request',{code:bFeed.data.code});
 assert.equal((await call(b.cookie,'social/feed')).data.posts.length,0);
 const request=(await call(b.cookie,'social/feed')).data.incoming[0];assert.equal((await call(c.cookie,'social/respond',{id:request.id,accept:true})).status,404);await call(b.cookie,'social/respond',{id:request.id,accept:true});
 const visible=(await call(b.cookie,'social/feed')).data;assert.equal(visible.posts.length,1);const p=visible.posts[0];assert.equal(p.pieces.length,1);assert.equal(p.pieces[0].name,'Ivory shirt');assert.equal(p.pieces[0].size,undefined);assert.equal(p.author.email,undefined);assert.ok(!JSON.stringify(visible).includes('private-fit'));assert.equal((await call(c.cookie,'social/feed')).data.posts.length,0);
 assert.equal((await call(b.cookie,'notifications')).data.items.filter(n=>n.kind==='friend').length,1);assert.equal((await call(c.cookie,'notifications')).data.items.length,0);
 assert.equal((await call(b.cookie,'social/unshare',{id:p.id})).status,404);
 await call(b.cookie,'social/remove',{id:a.data.user.id});assert.equal((await call(b.cookie,'social/feed')).data.posts.length,0);assert.equal((await call(b.cookie,'notifications')).data.items.length,0);
 await call(a.cookie,'social/unshare',{id:p.id});assert.equal((await call(a.cookie,'social/feed')).data.posts.length,0);
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
test('wardrobe matching ranks colour and description and excludes unavailable pieces',()=>{const piece={name:'Ivory linen shirt',cat:'top',colour:'Cream'};const items=[{id:'a',name:'Black tee',cat:'top',colour:'Black'},{id:'b',name:'Linen shirt',cat:'top',colour:'Cream'},{id:'c',name:'Linen shirt',cat:'top',colour:'Cream',laundry:true},{id:'d',name:'Cream trousers',cat:'bottom',colour:'Cream'}];const found=matches(piece,items);assert.equal(found[0].item.id,'b');assert.deepEqual(found.map(x=>x.item.id),['b','a']);});
