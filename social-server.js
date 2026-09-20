import {randomBytes,randomUUID} from 'node:crypto';
import {retailers} from './shared.js';
const fail=(status,message)=>Object.assign(Error(message),{status});
const clean=s=>String(s||'').trim();
export function socialRoutes(db,save){
 db.friendships??=[];db.posts??=[];
 function code(u){if(!u.friendCode){u.friendCode=randomBytes(7).toString('hex').toUpperCase();save();}return u.friendCode;}
 const person=id=>{const u=db.users.find(u=>u.id===id);return {id,name:u?.state.profile.name||'Closet member'};};
 const friendship=(a,b)=>db.friendships.find(f=>[f.from,f.to].includes(a)&&[f.from,f.to].includes(b));
 const visible=(p,u)=>p.author===u.id||friendship(p.author,u.id)?.status==='accepted';
 const postView=p=>({...p,author:person(p.author)});
 return async(route,req,user,body)=>{
  if(!route.startsWith('/api/social/'))return null;
  if(route==='/api/social/feed'&&req.method==='GET')return {code:code(user),friends:db.friendships.filter(f=>f.status==='accepted'&&[f.from,f.to].includes(user.id)).map(f=>person(f.from===user.id?f.to:f.from)),incoming:db.friendships.filter(f=>f.to===user.id&&f.status==='pending').map(f=>({id:f.id,person:person(f.from)})),outgoing:db.friendships.filter(f=>f.from===user.id&&f.status==='pending').map(f=>({id:f.id,person:person(f.to)})),posts:db.posts.filter(p=>visible(p,user)).sort((a,b)=>b.created-a.created).slice(0,100).map(postView)};
  if(req.method!=='POST')throw fail(405,'This action is not supported.');
  const data=await body(req);
  if(route==='/api/social/request'){const other=db.users.find(u=>u.friendCode===clean(data.code).toUpperCase());if(!other||other.id===user.id)throw fail(400,'Check the friend code. Ask your friend to open Friends on this installation to get their code.');if(friendship(user.id,other.id))throw fail(409,'You already have a friendship or request with this person.');db.friendships.push({id:randomUUID(),from:user.id,to:other.id,status:'pending',created:Date.now()});}
  else if(route==='/api/social/respond'){const f=db.friendships.find(f=>f.id===data.id&&f.to===user.id&&f.status==='pending');if(!f)throw fail(404,'Request not found.');if(data.accept===true)f.status='accepted';else db.friendships=db.friendships.filter(x=>x!==f);}
  else if(route==='/api/social/remove'){db.friendships=db.friendships.filter(f=>!([f.from,f.to].includes(user.id)&&[f.from,f.to].includes(data.id)));}
  else if(route==='/api/social/unshare'){const p=db.posts.find(p=>p.id===data.id&&p.author===user.id);if(!p)throw fail(404,'Shared outfit not found.');db.posts=db.posts.filter(x=>x!==p);}
  else if(route==='/api/social/share'){
   const o=user.state.outfits.find(o=>o.id===data.id);if(!o)throw fail(404,'Choose one of your outfits.');if(data.confirm!==true)throw fail(400,'Confirm the sharing preview first.');
   if(db.posts.some(p=>p.author===user.id&&p.outfitId===o.id))throw fail(409,'This outfit is already shared. Remove the post before sharing an updated version.');
   if(db.posts.filter(p=>p.author===user.id).length>=100)throw fail(400,'You have reached 100 shared looks. Remove an older post first.');
   const pieces=o.ids.map(id=>user.state.items.find(i=>i.id===id)).filter(Boolean).map(i=>({name:i.name,cat:i.cat,colour:i.colour,brand:i.brand,style:i.style,image:i.image,retailer:retailers.some(r=>r.name===i.brand)?i.brand:'Bash'}));
   pieces.push(...o.suggestions.map(s=>({name:s.name,cat:s.category,colour:'',brand:'',image:'',style:'',retailer:s.retailer})));
   db.posts.push({id:randomUUID(),author:user.id,outfitId:o.id,name:o.name,caption:clean(data.caption).slice(0,400),occasion:o.occasion,image:data.image==='tryOn'?o.tryOnImage||'':o.image||'',pieces,created:Date.now()});
  }else throw fail(404,'Unknown social action.');
  save();return {ok:true};
 };
}
