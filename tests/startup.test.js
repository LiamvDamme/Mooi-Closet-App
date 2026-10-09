import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as shared from '../shared.js';
import {dateKey} from '../calendar-ui.js';
import {startIntro} from '../navigation-ui.js';
const code=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
test('Generate creates three free looks and then requests the cached avatar and all three personal images',async()=>{
 const root={innerHTML:''},modal={open:false,close(){},addEventListener(){}},toast={textContent:'',classList:{add(){},remove(){}}},calls=[];
 const state=shared.blankState();state.profile.gender='Female';state.personal={photo:'data:image/png;base64,cGhvdG8=',usePhoto:true};state.items=[{id:'shirt',cat:'top',name:'Shirt',colour:'White',photoTreatment:'catalogue-v1',image:'data:image/png;base64,YQ=='}];
 const form={elements:{images:{checked:true},noHeels:{checked:false},moreRelaxed:{checked:false}}};
 const ctx={...shared,dateKey,console,AbortSignal,form,FormData:class{*[Symbol.iterator](){yield ['occasion','Everyday'];}getAll(){return [];}},location:{port:''},localStorage:{getItem(){return null;}},setInterval(){},setTimeout(){},document:{querySelector:s=>s==='#root'?root:s==='#toast'?toast:s==='#modal'?modal:null,addEventListener(){}},startIntro:()=>()=>{},icon:()=>'',bottomNavigation:()=>'',createWeatherWidget:()=>({html:()=>''}),createNotifications:()=>({badge(){},load:async()=>{}}),createSocial:()=>({preview:()=>'',load:async()=>{}}),createStudio:()=>({}),fetch:async(url,opts)=>{calls.push(url);let data={};if(url.endsWith('auth/me'))data={user:{id:'test'}};if(url.endsWith('/health'))data={aiConfigured:true};if(url.endsWith('/state'))data={state,revision:1};if(url.endsWith('/quick-outfits')){state.outfits=[1,2,3].map(n=>({id:'look-'+n,batch:'batch',name:'Look '+n,ids:['shirt'],suggestions:[],gender:'Female',source:'Wardrobe mix',image:''}));data={outfits:state.outfits};}if(url.endsWith('/render-outfit')){const id=JSON.parse(opts.body).id;state.outfits.find(o=>o.id===id).image='data:image/png;base64,YQ==';}return {ok:true,json:async()=>data};}};
 await vm.runInNewContext('(async()=>{'+code+'; await generate(form);})()',ctx);
 assert.equal(calls.filter(p=>p.endsWith('/quick-outfits')).length,1);assert.equal(calls.filter(p=>p.endsWith('/generate-avatar')).length,1);assert.equal(calls.filter(p=>p.endsWith('/render-outfit')).length,3);assert.ok(state.outfits.every(o=>o.image));
});
for(const signedIn of [true,false])test('startup renders '+(signedIn?'remembered account':'sign in')+' and releases intro',async()=>{
 const root={innerHTML:''},modal={addEventListener(){}},calls=[];let released=false;
 const ctx={...shared,dateKey,console,AbortSignal,location:{port:''},localStorage:{getItem(){return null;}},setInterval(){},setTimeout(){},document:{querySelector:s=>s==='#root'?root:modal,addEventListener(){}},startIntro:()=>()=>{released=true;},icon:()=>'',bottomNavigation:()=>'',createWeatherWidget:()=>({html:()=>''}),createNotifications:()=>({badge(){},load:async()=>{}}),createSocial:()=>({preview:()=>'',load:async()=>{}}),createStudio:()=>({}),fetch:async url=>{calls.push(url);let data={};if(url.endsWith('auth/me'))data={user:signedIn?{id:'test'}:null};if(url.endsWith('/state'))data={state:shared.blankState(),revision:1};return {ok:true,json:async()=>data};}};
 await vm.runInNewContext('(async()=>{'+code+'})()',ctx);
 assert.equal(released,true);assert.match(root.innerHTML,signedIn?/Hey lovely, you’re home/:/Make yourself at home/);assert.equal(calls.includes('/api/state'),signedIn);
});
test('skip intro releases screen even before startup API finishes',()=>{
 const old={document:globalThis.document,matchMedia:globalThis.matchMedia,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};let click,removed=false;const root={inert:false},intro={classList:{add(){}},querySelector:()=>({addEventListener:(name,fn)=>{click=fn;}}),remove(){removed=true;}};
 try{globalThis.document={querySelector:s=>s==='#root'?root:intro};globalThis.matchMedia=()=>({matches:true});globalThis.setTimeout=(fn,ms)=>{if(ms===0)fn();return 1;};globalThis.clearTimeout=()=>{};startIntro();assert.equal(root.inert,true);click();assert.equal(root.inert,false);assert.equal(removed,true);}finally{Object.assign(globalThis,old);}
});
