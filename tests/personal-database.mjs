// Run with PGLITE_MODULE pointing to a transient @electric-sql/pglite installation.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);

const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002',token='a'.repeat(43);
await db.query("insert into auth.users(id,email) values($1,'joako.bon@gmail.com'),($2,'test@example.invalid')",[owner,other]);
await db.exec(await fs.readFile('supabase/migrations/20261125224519_personal_workspace.sql','utf8'));
const device=(await db.query("insert into public.personal_phone_devices(user_id,token_hash) values($1,encode(sha256(convert_to($2,'UTF8')),'hex')) returning id",[owner,token])).rows[0].id;
const day=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
const row={day,timezone:'UTC',complete:true,observed_until:day+'T23:59:00Z',payload:{total:60000,sessions:2,notifications:null,hours:Array.from({length:24},(_,i)=>i===15?60000:0),apps:[{id:'com.example',name:'Example',ms:60000}]}};
async function ingest(data,secret=token){return db.query('select public.personal_ingest_phone_usage($1,$2::jsonb) as result',[secret,JSON.stringify(data)]);}
await db.exec('set role anon');
await assert.rejects(db.query('select * from public.personal_phone_usage_daily'));
await assert.rejects(ingest([row],'b'.repeat(43)));
assert.equal((await ingest([row])).rows[0].result.saved,1);
assert.equal((await ingest([row])).rows[0].result.saved,1);
const stale=structuredClone(row);stale.complete=false;stale.observed_until=day+'T20:00:00Z';
assert.equal((await ingest([stale])).rows[0].result.saved,0);
for(const mutate of [r=>r.payload.hours.pop(),r=>r.payload.apps[0].ms=-1,r=>r.payload.sessions=-1,r=>r.payload.total=99999999,r=>r.timezone='Bad/Zone',r=>r.payload.apps.push(r.payload.apps[0])]){const invalid=structuredClone(row);mutate(invalid);await assert.rejects(ingest([invalid]));}
await db.exec('reset role;set role authenticated');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
assert.equal((await db.query('select * from public.personal_phone_usage_daily')).rows.length,0);
assert.equal((await db.query('select * from public.personal_phone_devices')).rows.length,0);
await assert.rejects(db.query('insert into public.personal_snapshots(user_id,data) values($1,$2)',[other,'{}']));
await assert.rejects(db.query('insert into public.personal_phone_devices(user_id,token_hash) values($1,$2)',[owner,'c'.repeat(64)]));
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
assert.equal((await db.query('select * from public.personal_phone_usage_daily')).rows.length,1);
await db.query('insert into public.personal_snapshots(user_id,data) values($1,$2)',[owner,'{"pulso":{"S":{},"D":{}}}']);
assert.equal((await db.query('select * from public.personal_snapshots')).rows.length,1);
await assert.rejects(db.query('update public.personal_snapshots set user_id=$1',[other]));
await assert.rejects(db.query('delete from public.personal_phone_usage_daily'));
await db.query('update public.personal_phone_devices set revoked_at=now() where id=$1',[device]);
await db.exec('reset role;set role anon');
await assert.rejects(ingest([row]));
await db.close();
console.log('Personal database verified: migration, token scope, RLS isolation, revocation, idempotency, coverage and malformed payloads.');
