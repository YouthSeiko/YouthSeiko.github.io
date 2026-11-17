const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
(async()=>{
  const images=[],pending=[],jobs=[];let listener,script;
  const entry={ querySelector:()=>images[0]||null, prepend:image=>images.unshift(image) };
  const user={id:'own-user'};
  const client={auth:{getSession:async()=>({data:{session:{user}}}),getUser:async()=>({data:{user}}),onAuthStateChange:fn=>{listener=fn;}},
    from:()=>({select(){return this;},eq(){return this;},maybeSingle:()=>new Promise(resolve=>pending.push(resolve))})};
  const document={querySelector:()=>entry,head:{append:e=>{script=e;}},createElement:()=>({style:{},remove(){images.splice(images.indexOf(this),1);}})};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/community-nav.js'),'utf8'),{
    document,window:{YOUTHSEIKO_COMMUNITY:{authEnabled:true,supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'},supabase:{createClient:()=>client}},URL,setTimeout:fn=>jobs.push(fn)
  });
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  const first=script.onload();await settle();
  listener('INITIAL_SESSION');jobs.shift()();await settle();
  assert.equal(pending.length,2);
  pending[1]({data:{avatar_id:'hana'}});await settle();
  pending[0]({data:{avatar_id:'mio'}});await first;
  assert.equal(images.length,1,'racing session events must not duplicate avatars');
  assert(images[0].src.endsWith('/hana.webp'),'stale response must not overwrite latest avatar');
  console.log('PASS: concurrent session refreshes render exactly one current avatar.');
})().catch(e=>{console.error(e);process.exitCode=1;});
