import {supabaseCA} from './supabase-ca.js';
// Read-only staged-service checks. Never logs credentials, URLs, or account data.
export async function checkCloudConnections(env, {PoolClass, fetcher=fetch}={}) {
 const result={supabase:'not configured',imagekit:'not configured'};
 if(env.SUPABASE_DATABASE_URL){
  let pool,stage='validate';
  try {
   const url=new URL(env.SUPABASE_DATABASE_URL);
   if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname.endsWith('.supabase.com')&&!url.hostname.endsWith('.supabase.co')||!url.password||decodeURIComponent(url.password).includes('[YOUR-PASSWORD]'))throw Error('config');
   // Strip URL SSL overrides: TLS certificate verification must stay enabled.
   for(const k of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(k);
   stage='connect';const Pool=PoolClass||(await import('pg')).default.Pool;
   pool=new Pool({connectionString:url.toString(),ssl:{rejectUnauthorized:true,ca:supabaseCA},max:1,connectionTimeoutMillis:10000,query_timeout:10000});
   pool.on('error',()=>{});
   await pool.query('SELECT 1');result.supabase='connection verified';
  }catch(e){result.supabase=stage==='validate'?'invalid URI or placeholder password':/tenant or user not found/i.test(String(e.message))?'pooler username or host rejected':/password authentication failed/i.test(String(e.message))?'password rejected':/timeout|timed out/i.test(String(e.message))?'connection timed out':e.code==='28P01'?'password rejected':e.code==='ENOTFOUND'?'host not found':['SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(e.code)?'trusted database certificate required':'connection failed; check the staged URI and password';}
  finally{if(pool)await pool.end().catch(()=>{});}
 }
 if(env.IMAGEKIT_PRIVATE_KEY&&env.IMAGEKIT_URL_ENDPOINT){
  try{
   const endpoint=new URL(env.IMAGEKIT_URL_ENDPOINT);
   if(endpoint.protocol!=='https:'||endpoint.hostname!=='ik.imagekit.io'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname==='/')throw Error('endpoint');
   const r=await fetcher('https://api.imagekit.io/v1/files?limit=1',{headers:{Authorization:'Basic '+Buffer.from(env.IMAGEKIT_PRIVATE_KEY+':').toString('base64')},redirect:'error',signal:AbortSignal.timeout(10000)});
   result.imagekit=r.ok?'API key verified; endpoint ownership not yet checked':r.status===401||r.status===403?'API key rejected':'API check failed';
   await r.body?.cancel();
  }catch{result.imagekit='connection failed; check key and URL endpoint';}
 }
 return result;
}
