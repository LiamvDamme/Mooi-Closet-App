import {randomUUID} from 'node:crypto';
import {matches} from './wardrobe-matches.js';
import {retailers} from './shared.js';
const fail=(status,message)=>Object.assign(Error(message),{status});
const clean=s=>String(s||'').trim();
export function visiblePost(db,user,id){const p=db.posts?.find(p=>p.id===id);if(!p||(db.blocks||[]).some(b=>b.from===user.id&&b.to===p.author||b.from===p.author&&b.to===user.id))return null;return p.author===user.id||(db.friendships||[]).some(f=>f.status==='accepted'&&[f.from,f.to].includes(user.id)&&[f.from,f.to].includes(p.author))?p:null;}
export function socialRoutes(db,save){
 db.friendships??=[];db.posts??=[];db.blocks??=[];db.reports??=[];
 const person=id=>{const u=db.users.find(u=>u.id===id);return {id,username:u?.username||'',name:u?.state.profile.name||'Closet member'};};
 const friendship=(a,b)=>db.friendships.find(f=>[f.from,f.to].includes(a)&&[f.from,f.to].includes(b));
 const blocked=(a,b)=>(db.blocks||[]).some(x=>x.from===a&&x.to===b||x.from===b&&x.to===a);
 const visible=(p,u)=>!blocked(p.author,u.id)&&(p.author===u.id||friendship(p.author,u.id)?.status==='accepted');
 const postView=(p,u)=>{const {votes,...post}=p;return {...post,author:person(p.author),poll:p.poll?{question:p.poll,counts:['Love it','Try another'].map(v=>Object.values(votes||{}).filter(x=>x===v).length),myVote:votes?.[u.id]||''}:null};};
 return async(route,req,user,body)=>{
  if(!route.startsWith('/api/social/'))return null;
  if(route==='/api/social/feed'&&req.method==='GET')return {username:user.username,blocked:(db.blocks||[]).filter(b=>b.from===user.id).map(b=>person(b.to)),friends:db.friendships.filter(f=>f.status==='accepted'&&[f.from,f.to].includes(user.id)).map(f=>person(f.from===user.id?f.to:f.from)),incoming:db.friendships.filter(f=>f.to===user.id&&f.status==='pending').map(f=>({id:f.id,person:person(f.from)})),outgoing:db.friendships.filter(f=>f.from===user.id&&f.status==='pending').map(f=>({id:f.id,person:person(f.to)})),posts:db.posts.filter(p=>visible(p,user)).sort((a,b)=>b.created-a.created).slice(0,100).map(p=>postView(p,user))};
  if(route==='/api/social/search'&&req.method==='GET'){const q=clean(new URL(req.url,'http://localhost').searchParams.get('q')).replace(/^@/,'').toLowerCase().slice(0,60);if(q.length<2)return {people:[]};return {people:db.users.filter(u=>u.id!==user.id&&!blocked(u.id,user.id)&&(u.username.includes(q)||u.state.profile.name.toLowerCase().includes(q))).slice(0,20).map(u=>({...person(u.id),relationship:friendship(user.id,u.id)?.status||''}))};}
  if(req.method!=='POST')throw fail(405,'This action is not supported.');
  const data=await body(req);
  if(route==='/api/social/recreate'){const p=visiblePost(db,user,data.id);if(!p)throw fail(404,'This shared outfit is no longer available to you.');if(p.pieces.length>12)throw fail(400,'This shared look has too many pieces. Ask your friend to share a look with up to 12 pieces.');const used=new Set(),ids=[],suggestions=[];for(const piece of p.pieces){const match=matches(piece,user.state.items).find(m=>!used.has(m.item.id));if(match){ids.push(match.item.id);used.add(match.item.id);}else suggestions.push({name:piece.name,category:piece.cat,retailer:piece.retailer||'Bash'});}const id=randomUUID(),outfit={id,batch:id,friendPostId:p.id,name:p.name+' — on me',ids,suggestions,reason:'Inspired by a friend’s shared look. Owned matches are similar alternatives, not proof you own the identical product. The AI preview uses the shared garment references where available.',gender:user.state.profile.gender,occasion:p.occasion,source:'Styled by you',saved:true,created:Date.now(),image:'',renderStatus:'pending'};user.state.outfits=[outfit,...user.state.outfits].slice(0,80);user.revision++;save();return {outfit,revision:user.revision};}
  else if(route==='/api/social/block'){if(data.id===user.id||!db.users.some(u=>u.id===data.id))throw fail(400,'Choose another member.');db.blocks??=[];if(!db.blocks.some(b=>b.from===user.id&&b.to===data.id))db.blocks.push({from:user.id,to:data.id});db.friendships=db.friendships.filter(f=>!([f.from,f.to].includes(user.id)&&[f.from,f.to].includes(data.id)));}
  else if(route==='/api/social/unblock'){db.blocks=(db.blocks||[]).filter(b=>!(b.from===user.id&&b.to===data.id));}
  else if(route==='/api/social/report'){const p=db.posts.find(p=>p.id===data.id&&visible(p,user));if(!p)throw fail(404,'This post is not available.');const reason=clean(data.reason).slice(0,500);if(!reason)throw fail(400,'Please describe the problem.');db.reports??=[];if(db.reports.some(r=>r.postId===p.id&&r.from===user.id&&r.status==='open'))throw fail(409,'You have already reported this post.');db.reports.push({id:randomUUID(),from:user.id,postId:p.id,author:p.author,reason,status:'open',created:Date.now()});}
  else if(route==='/api/social/vote'){const p=db.posts.find(p=>p.id===data.id&&visible(p,user));if(!p?.poll)throw fail(404,'Poll not available.');if(!['Love it','Try another'].includes(data.vote))throw fail(400,'Choose a poll option.');p.votes??={};p.votes[user.id]=data.vote;}
  else if(route==='/api/social/request'){const other=db.users.find(u=>u.id===data.id||u.username===clean(data.username).replace(/^@/,'').toLowerCase());if(!other||other.id===user.id||blocked(user.id,other.id))throw fail(400,'Choose a person from the name or username search.');if(friendship(user.id,other.id))throw fail(409,'You already have a friendship or request with this person.');db.friendships.push({id:randomUUID(),from:user.id,to:other.id,status:'pending',created:Date.now()});}
  else if(route==='/api/social/respond'){const f=db.friendships.find(f=>f.id===data.id&&f.to===user.id&&f.status==='pending');if(!f)throw fail(404,'Request not found.');if(data.accept===true)f.status='accepted';else db.friendships=db.friendships.filter(x=>x!==f);}
  else if(route==='/api/social/remove'){db.friendships=db.friendships.filter(f=>!([f.from,f.to].includes(user.id)&&[f.from,f.to].includes(data.id)));}
  else if(route==='/api/social/unshare'){const p=db.posts.find(p=>p.id===data.id&&p.author===user.id);if(!p)throw fail(404,'Shared outfit not found.');db.posts=db.posts.filter(x=>x!==p);}
  else if(route==='/api/social/share'){
   const o=user.state.outfits.find(o=>o.id===data.id);if(!o)throw fail(404,'Choose one of your outfits.');if(data.confirm!==true)throw fail(400,'Confirm the sharing preview first.');
   if(db.posts.some(p=>p.author===user.id&&p.outfitId===o.id))throw fail(409,'This outfit is already shared. Remove the post before sharing an updated version.');
   if(db.posts.filter(p=>p.author===user.id).length>=100)throw fail(400,'You have reached 100 shared looks. Remove an older post first.');
   const pieces=o.ids.map(id=>user.state.items.find(i=>i.id===id)).filter(Boolean).map(i=>({name:i.name,cat:i.cat,colour:i.colour,brand:i.brand,style:i.style,image:i.image,retailer:retailers.some(r=>r.name===i.brand)?i.brand:'Bash'}));
   pieces.push(...o.suggestions.map(s=>({name:s.name,cat:s.category,colour:'',brand:'',image:'',style:'',retailer:s.retailer})));
   db.posts.push({id:randomUUID(),author:user.id,outfitId:o.id,name:o.name,caption:clean(data.caption).slice(0,400),poll:data.poll===true||data.poll==='on'?'Would you wear this look?':'',votes:{},occasion:o.occasion,image:data.image==='tryOn'?o.tryOnImage||'':o.image||'',pieces,created:Date.now()});
  }else throw fail(404,'Unknown social action.');
  save();return {ok:true};
 };
}
