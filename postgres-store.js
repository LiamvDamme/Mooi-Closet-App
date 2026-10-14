// Durable storage for the small MOOI pilot. A transaction serialises collection
// updates across instances, including rolling deployments. Move large photos to
// object storage and split records by account before scaling beyond the pilot.
export async function createPostgresStore(connectionString, {PoolClass}={}) {
 // Log codes only: PostgreSQL errors can contain account data and photo payloads.
 const report=(phase,e)=>console.warn('[database]',phase,/^[A-Z0-9_]{2,32}$/.test(e?.code||'')?e.code:'CONNECTION_OR_QUERY_FAILURE');
 const retryable=e=>/^(08|40)/.test(e?.code||'')||['55P03','57P01','57P02','57P03','ECONNRESET','ECONNREFUSED','ETIMEDOUT','EPIPE'].includes(e?.code)||/connection (?:terminated|timeout)|timeout exceeded when trying to connect/i.test(e?.message||'');
 const Pool=PoolClass||(await import('pg')).default.Pool;
 const pool=new Pool({connectionString,max:2,connectionTimeoutMillis:10000});
 pool.on('error',e=>report('idle',e));
 try {
  await pool.query('CREATE TABLE IF NOT EXISTS mooi_pilot_state (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
  await pool.query('INSERT INTO mooi_pilot_state (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING',[JSON.stringify({users:[],sessions:[],friendships:[],posts:[],announcements:[]})]);
 } catch(e) {await pool.end();throw Error('Cannot initialise the MOOI database. Check DATABASE_URL and database availability.');}
 let tail=Promise.resolve();
 return {
  async begin(db) {
   let unlock;const previous=tail;tail=new Promise(r=>unlock=r);await previous;
   let client,connectionError;
   const onClientError=e=>{connectionError=e;};
   const release=()=>{if(!client)return;client.release(connectionError||undefined);client.removeListener?.('error',onClientError);};
   try {
    let rows;
    // Retry only acquiring state, before any user action or image request runs.
    for(let attempt=0;attempt<2;attempt++){
     try{
      connectionError=undefined;client=await pool.connect();client.on?.('error',onClientError);await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '10s'");
      ({rows}=await client.query('SELECT data FROM mooi_pilot_state WHERE id = 1 FOR UPDATE'));
      if(connectionError)throw connectionError;
      break;
     }catch(e){
      report('load',e);
      if(client){connectionError=e;await client.query('ROLLBACK').catch(()=>{});release();client=undefined;}
      if(attempt||!retryable(e))throw e;
      await new Promise(resolve=>setTimeout(resolve,250));
     }
    }
    if(!rows[0]?.data||!Array.isArray(rows[0].data.users))throw Error('Invalid database contents');
    for(const k of Object.keys(db))delete db[k];Object.assign(db,rows[0].data);
    db.friendships??=[];db.posts??=[];db.announcements??=[];db.products??=[];
    let finished=false;
    return {async finish(success,dirty) {
     if(finished)return;finished=true;
     try {
      if(connectionError)throw connectionError;
      if(success){if(dirty)await client.query('UPDATE mooi_pilot_state SET data = $1::jsonb, updated_at = now() WHERE id = 1',[JSON.stringify(db)]);await client.query('COMMIT');}
      else await client.query('ROLLBACK');
     } catch(e){report('save',e);connectionError=e;await client.query('ROLLBACK').catch(()=>{});throw Object.assign(Error('Your changes could not be saved. Please try again.'),{status:503});}
     finally{release();unlock();}
    }};
   } catch(e){if(client){connectionError=e;await client.query('ROLLBACK').catch(()=>{});release();}unlock();throw Object.assign(Error('Your account database is temporarily unavailable. Please try again.'),{status:503});}
  },
  close:()=>pool.end()
 };
}
