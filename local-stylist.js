import {stylingTypes,colours} from './shared.js';
const patterns={Jeans:/\bjeans?\b/i,Skirt:/\bskirt/i,Shirt:/\bshirt|blouse/i,'T-shirt':/t[ -]?shirt|\btee\b/i,Trousers:/trouser|pants|chino/i,Shorts:/shorts/i,Dress:/dress/i,Jumpsuit:/jumpsuit|romper/i,Knitwear:/knit|sweater|jersey|cardigan|pullover/i,Jacket:/jacket|blazer/i,Coat:/coat/i};
export function matchesType(item,type){if(!type||type==='Any clothing')return true;if(type==='Shoes')return item.cat==='shoe';if(type==='Bag')return item.cat==='bag';if(type==='Accessories')return ['bag','jewellery','belt','hat','eyewear','scarf','hosiery','accessory'].includes(item.cat);return !!patterns[type]?.test(item.name);}
export function quickLooks(state,prefs={},random=Math.random){
 const type=prefs.clothingType||'Any clothing',colour=prefs.colour||'Any colour';
 if(!stylingTypes.includes(type)||(colour!=='Any colour'&&!Object.hasOwn(colours,colour)))throw Error('Choose a clothing type and colour from the lists.');
 const noHeels=prefs.noHeels||(state.stylistFeedback||[]).some(f=>f.reason==='Prefer flat shoes');
 const items=state.items.filter(i=>!i.laundry&&(!noHeels||i.cat!=='shoe'||!/heel|stiletto|pump|wedge/i.test(i.name)));
 if(!items.length)throw Error('Add an available wardrobe piece first.');
 const focus=items.filter(i=>matchesType(i,type)&&(colour==='Any colour'||i.colour===colour));
 if(!focus.length)throw Error('No available piece matches those choices. Try Any clothing or Any colour, or add a matching piece.');
 const locks=[...new Set([...(prefs.lockedIds||[]),prefs.anchorId].filter(Boolean))];
 if(locks.some(id=>!items.some(i=>i.id===id)))throw Error('A selected piece is unavailable or conflicts with No heels.');
 const old=new Set(state.outfits.map(o=>[...o.ids].sort().join('|'))),found=new Map();
 const score=i=>Number(!!i.fav)*2+(prefs.moreRelaxed&&/relax|oversiz|loose|casual/i.test(i.fit+' '+i.style)?3:0)+state.outfits.filter(o=>o.saved&&o.ids.includes(i.id)).length+Math.min(i.worn||0,5)*.15-(state.stylistFeedback||[]).filter(f=>['Not my style','Dislike these colours','Too many accessories'].includes(f.reason)&&f.context?.includes(i.name)).length*2;
 const ranked=items.map(i=>({i,weight:score(i)+random()*4})).sort((a,b)=>b.weight-a.weight).map(x=>x.i);
 const addLook=chosen=>{
  const signature=chosen.map(i=>i.id).sort().join('|');if(found.has(signature))return;
  const has=c=>chosen.some(i=>i.cat===c),missing=[];if(!has('dress')&&!has('top'))missing.push('a top');if(!has('dress')&&!has('bottom'))missing.push('bottoms');if(!has('shoe'))missing.push('shoes');
  found.set(signature,{ids:chosen.map(i=>i.id),suggestions:[],name:(prefs.occasion||'Everyday')+' · '+chosen[0].name,reason:'A free wardrobe mix using only your available pieces. '+(missing.length?'This is a starting combination; add '+missing.join(' and ')+' to complete it.':'Review the combination for fit and occasion.')+(old.has(signature)?' You have seen this combination before.':''),source:'Wardrobe mix',repeat:old.has(signature)});
 };
 // Enumerate real combinations instead of hoping random samples find three.
 let visits=0;const walk=(chosen,groups,index=0)=>{if(++visits>12000||found.size>=120)return;if(index===groups.length){addLook(chosen);return;}const [cat,required]=groups[index];if(chosen.some(i=>i.cat===cat)){walk(chosen,groups,index+1);return;}const pool=ranked.filter(i=>i.cat===cat&&!chosen.some(x=>x.id===i.id));const choices=required&&pool.length?pool:[null,...pool];for(const piece of choices){if(chosen.length>=12&&piece)continue;walk(piece?[...chosen,piece]:chosen,groups,index+1);}};
 for(const main of ranked.filter(i=>focus.includes(i))){const chosen=locks.map(id=>items.find(i=>i.id===id));if(!chosen.some(i=>i.id===main.id))chosen.push(main);if(chosen.length>12||['bottom','shoe','dress'].some(cat=>chosen.filter(i=>i.cat===cat).length>1))continue;
  const has=c=>chosen.some(i=>i.cat===c);const bases=has('dress')?(has('bottom')?[]:[[]]):has('top')||has('bottom')?[[['top',true],['bottom',true]]]:[[['top',true],['bottom',true]],...(ranked.some(i=>i.cat==='dress')?[[['dress',true]]]:[])];
  for(const base of bases)walk(chosen,[...base,['shoe',true],['outer',['Cool','Cold','Rainy'].includes(prefs.weather)],...['bag','jewellery','belt','hat','eyewear','scarf','hosiery','accessory'].map(c=>[c,false])]);
 }
 if(!found.size)throw Error('Your locked pieces conflict with the clothing or colour choice. Try unlocking a piece.');
 return [...found.values()].sort((a,b)=>Number(a.repeat)-Number(b.repeat)).slice(0,3).map((o,i)=>({...o,name:'Look '+(i+1)+' · '+o.name}));
}
export function mixNotice(looks){return looks.length<3?'Only '+looks.length+' distinct '+(looks.length===1?'outfit fits':'outfits fit')+' these choices with your available pieces. Add another matching piece or loosen a filter to make three.':'';}
