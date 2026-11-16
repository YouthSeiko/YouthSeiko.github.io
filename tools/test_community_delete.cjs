const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { stripTypeScriptTypes } = require('node:module');
const path = require('node:path');
const code = stripTypeScriptTypes(fs.readFileSync(path.join(__dirname,'../supabase/functions/delete-player/index.ts'),'utf8'));
async function run(origin,method,authorized) {
  let handler, calls = [];
  const env = { SUPABASE_URL:'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY:'server-test-secret' };
  vm.runInNewContext(code,{ Deno:{ serve: fn => { handler = fn; }, env:{ get: key => env[key] } }, Response, AbortSignal,
    fetch: async (url,options) => { calls.push({url,options});
      if (url.endsWith('/auth/v1/user')) return new Response(JSON.stringify(authorized ? {id:'verified-user',email_confirmed_at:'now'} : {}),{status:authorized?200:401});
      return new Response('{}',{status:200});
    }
  });
  const response = await handler(new Request('https://test.supabase.co/functions/v1/delete-player',{
    method, headers:{Origin:origin,Authorization:'Bearer caller-token'},...(method==='DELETE'?{body:JSON.stringify({id:'other-user'})}:{})
  }));
  return {response,calls};
}
(async()=>{
  let r = await run('https://evil.example','DELETE',true);assert.equal(r.response.status,403);assert.equal(r.calls.length,0);
  r=await run('https://youthseiko.github.io','GET',true);assert.equal(r.response.status,405);assert.equal(r.calls.length,0);
  r=await run('https://youthseiko.github.io','DELETE',false);assert.equal(r.response.status,401);assert.equal(r.calls.length,1);
  r=await run('https://youthseiko.github.io','DELETE',true);assert.equal(r.response.status,200);assert.equal(r.calls.length,2);
  assert(r.calls[1].url.endsWith('/admin/users/verified-user'),'delete verified identity, never body-supplied ID');
  assert(!JSON.stringify(await r.response.json()).includes('secret'));
  r=await run('https://youthseiko.github.io','OPTIONS',true);assert.equal(r.response.status,204);assert.equal(r.calls.length,0);
  console.log('PASS: deletion origin/method/authentication guards, verified identity only, CORS preflight and no secret returned (mock server).');
})().catch(e=>{console.error(e);process.exitCode=1;});
