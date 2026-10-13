import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkCloudConnections} from '../cloud-preflight.js';
test('staged cloud checks are read-only and do not leak connection values',async()=>{
 let config,sql,closed=false,called;
 class Pool{constructor(c){config=c;}on(){}async query(q){sql=q;return {rows:[{}]};}async end(){closed=true;}}
 const env={SUPABASE_DATABASE_URL:'postgresql://postgres:TOPSECRET@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=disable',IMAGEKIT_PRIVATE_KEY:'private_TEST',IMAGEKIT_URL_ENDPOINT:'https://ik.imagekit.io/test'};
 const result=await checkCloudConnections(env,{PoolClass:Pool,fetcher:async(url,options)=>{called={url,options};return {ok:true,body:{async cancel(){}}};}});
 assert.equal(sql,'SELECT 1');assert.equal(config.ssl.rejectUnauthorized,true);assert.ok(!config.connectionString.includes('sslmode'));assert.ok(closed);assert.equal(called.url,'https://api.imagekit.io/v1/files?limit=1');assert.equal(called.options.redirect,'error');assert.equal(result.supabase,'connection verified');assert.ok(!JSON.stringify(result).includes('TOPSECRET'));assert.ok(!JSON.stringify(result).includes('private_TEST'));
});
test('invalid configuration and upstream errors stay safe',async()=>{
 const result=await checkCloudConnections({SUPABASE_DATABASE_URL:'not-a-uri',IMAGEKIT_PRIVATE_KEY:'private_TEST',IMAGEKIT_URL_ENDPOINT:'https://untrusted.example/test'},{fetcher:()=>{throw Error('must not call');}});
 assert.match(result.supabase,/failed/);assert.match(result.imagekit,/failed/);
 const rejected=await checkCloudConnections({IMAGEKIT_PRIVATE_KEY:'private_TEST',IMAGEKIT_URL_ENDPOINT:'https://ik.imagekit.io/test'},{fetcher:async()=>({ok:false,status:401})});assert.equal(rejected.imagekit,'API key rejected');
});
