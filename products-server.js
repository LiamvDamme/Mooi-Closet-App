import {categories,retailers} from './shared.js';
const fail=(status,message)=>Object.assign(Error(message),{status});
export function productRoutes(db,save,isOwner){
 return async(req,user,jsonBody)=>{
  if(req.method==='GET'){const url=new URL(req.url,'http://localhost'),category=url.searchParams.get('category');return {products:(db.products||[]).filter(p=>!category||p.category===category),canManage:isOwner(user)};}
  if(req.method!=='PUT')throw fail(405,'Unsupported catalogue action.');
  if(!isOwner(user))throw fail(403,'Only the MOOI owner can import products.');
  const body=await jsonBody(req);if(!Array.isArray(body.products)||body.products.length>500)throw fail(400,'Upload a products array containing at most 500 items.');
  const products=body.products.map(p=>{const retailer=retailers.find(r=>r.name===p.retailer);let url;try{url=new URL(p.url);}catch{throw fail(400,'Every product needs a valid retailer URL.');}const domain=retailer?.domain.split('/')[0];if(!retailer||url.protocol!=='https:'||url.username||url.password||!(url.hostname===domain||url.hostname.endsWith('.'+domain))||url.pathname==='/')throw fail(400,'Use a direct HTTPS product URL on the selected retailer’s domain.');if(!categories[p.category]||!p.name||!Number.isFinite(p.price)||p.price<0||!Array.isArray(p.sizes))throw fail(400,'Every product needs a name, category, numeric rand price and sizes array.');const checked=Date.parse(p.checkedAt);if(!Number.isFinite(checked)||checked>Date.now())throw fail(400,'Include the real checkedAt date for every product.');return {name:String(p.name).slice(0,100),category:p.category,retailer:retailer.name,url:url.href,price:p.price,sizes:p.sizes.map(s=>String(s).slice(0,25)).slice(0,30),checkedAt:new Date(checked).toISOString(),delivery:String(p.delivery||'Check delivery at the retailer.').slice(0,200)};});
  db.products=products;save();return {count:products.length};
 };
}
