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
 const score=i=>Number(i.fav)*2+(prefs.moreRelaxed&&/relax|oversiz|loose|casual/i.test(i.fit+' '+i.style)?3:0)+state.outfits.filter(o=>o.saved&&o.ids.includes(i.id)).length+Math.min(i.worn||0,5)*.15-(state.stylistFeedback||[]).filter(f=>['Not my style','Dislike these colours','Too many accessories'].includes(f.reason)&&f.context?.includes(i.name)).length*2;
 const pick=list=>list.map(i=>({i,n:random()*6+score(i)})).sort((a,b)=>b.n-a.n)[0]?.i;
 for(let n=0;n<100;n++){
  const chosen=locks.map(id=>items.find(i=>i.id===id)),add=i=>{if(i&&!chosen.some(x=>x.id===i.id)&&chosen.length<12)chosen.push(i);};
  if(!chosen.some(i=>focus.includes(i)))add(pick(focus));
  if(['bottom','shoe','dress'].some(c=>chosen.filter(i=>i.cat===c).length>1))continue;
  const cat=c=>chosen.some(i=>i.cat===c), pool=c=>items.filter(i=>i.cat===c);
  if(!cat('dress')&&!cat('top')&&!cat('bottom')&&pool('dress').length&&random()>.55)add(pick(pool('dress')));
  if(!cat('dress')){if(!cat('top'))add(pick(pool('top')));if(!cat('bottom'))add(pick(pool('bottom')));}
  if(!cat('shoe'))add(pick(pool('shoe')));
  if(!cat('outer')&&['Cool','Cold','Rainy'].includes(prefs.weather))add(pick(pool('outer')));
  if(!cat('bag')&&random()>.4)add(pick(pool('bag')));
  const signature=chosen.map(i=>i.id).sort().join('|');if(found.has(signature))continue;
  const missing=[];if(!cat('dress')&&!cat('top'))missing.push('a top');if(!cat('dress')&&!cat('bottom'))missing.push('bottoms');if(!cat('shoe'))missing.push('shoes');
  found.set(signature,{ids:chosen.map(i=>i.id),suggestions:[],name:(prefs.occasion||'Everyday')+' · '+chosen[0].name,reason:'A free wardrobe mix using only your available pieces. '+(missing.length?'This is a starting combination; add '+missing.join(' and ')+' to complete it.':'Review the combination for fit and occasion.')+(old.has(signature)?' You have seen this combination before.':''),source:'Wardrobe mix',repeat:old.has(signature)});
 }
 if(!found.size)throw Error('Your locked pieces conflict with the clothing or colour choice. Try unlocking a piece.');
 return [...found.values()].sort((a,b)=>Number(a.repeat)-Number(b.repeat)).slice(0,3);
}
