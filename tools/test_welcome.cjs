const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');
const code=stripTypeScriptTypes(fs.readFileSync(path.join(__dirname,'../supabase/functions/welcome-player/index.ts'),'utf8'));
function setup({enabled=true,providerStatus=201,networkError=false,finalizeError=false,confirmed=true}={}){
 let handler,claimed=false,sends=[],finishes=[];
 const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_test'}),WELCOME_ENABLED:enabled?'true':'false',BREVO_WELCOME_API_KEY:'server-only-test'};
 const context={Deno:{serve:fn=>handler=fn,env:{get:key=>env[key]}},Response,URL,AbortSignal,
  fetch:async(url,options={})=>{
   if(url.endsWith('/auth/v1/user'))return Response.json({id:'verified-user',email:'owner@example.invalid',email_confirmed_at:confirmed?'now':null,last_sign_in_at:'now'});
   if(url.includes('/player_profiles?')){assert.equal(options.headers.Authorization,'Bearer test-token','profile must use verified player RLS permissions');return Response.json([{display_name:'<Yu & friends>',language:'ja'}]);}
   if(url.endsWith('/rpc/claim_welcome_email')){if(claimed)return Response.json(null);claimed=true;return Response.json({delivery_id:'stable-delivery-id',claim_token:'private-claim-token'});}
   if(url.endsWith('/rpc/finish_welcome_email')){if(finalizeError)return new Response('{}',{status:503});finishes.push(JSON.parse(options.body));return Response.json(true);}
   if(url==='https://api.brevo.com/v3/smtp/email'){sends.push(JSON.parse(options.body));if(networkError)throw new Error('network timeout');return Response.json({messageId:'provider-message-id'},{status:providerStatus});}
   throw new Error('Unexpected URL');
  }
 };
 vm.runInNewContext(code,context);
 const request=(origin='https://youthseiko.github.io',token='Bearer test-token')=>new Request('https://test.supabase.co/functions/v1/welcome-player',{method:'POST',headers:{Origin:origin,Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({email:'attacker@example.invalid',user_id:'another-user',language:'en'})});
 return {run:()=>handler(request()),handler,request,context,sends,finishes};
}
(async()=>{
 let app=setup();const responses=await Promise.all([app.run(),app.run()]);
 assert.equal(app.sends.length,1,'two simultaneous sign-ins must send once');
 assert.equal(app.sends[0].to[0].email,'owner@example.invalid','recipient must come from verified Auth, never client body');
 assert.equal(app.sends[0].headers.idempotencyKey,'stable-delivery-id');
 assert.equal(app.finishes[0].p_state,'accepted');
 await app.run();assert.equal(app.sends.length,1,'later sign-ins must not resend');
 assert(app.sends[0].htmlContent.includes('&lt;Yu &amp; friends&gt;'));
 assert(app.sends[0].htmlContent.includes('/ja/communaute/'));
 for(const lang of ['fr','en','ja']){
  const result=app.context.welcomeContent(lang,'YU','/assets/media/community/welcome-five-v1.png');
  assert(result.html.includes('Welcome'));assert(result.html.includes('welcome-five-v1.png'));assert(result.html.includes(`lang="${lang}"`));
  assert(!result.html.includes('/smtp/email'));assert(result.text.includes('/communaute/'));
 }
 app=setup({enabled:false});assert.equal((await app.run()).status,202);assert.equal(app.sends.length,0);
 app=setup({confirmed:false});assert.equal((await app.run()).status,401);assert.equal(app.sends.length,0);
 app=setup();assert.equal((await app.handler(app.request('https://evil.example'))).status,403);assert.equal(app.sends.length,0);
 app=setup();assert.equal((await app.handler(app.request(undefined,''))).status,401);assert.equal(app.sends.length,0);
 app=setup({networkError:true});assert.equal((await app.run()).status,202);assert.equal(app.finishes[0].p_state,'review');await app.run();assert.equal(app.sends.length,1,'ambiguous acceptance must not be resent automatically');
 app=setup({finalizeError:true});assert.equal((await app.run()).status,202);await app.run();assert.equal(app.sends.length,1,'database acknowledgement failure must not duplicate delivery');
 app=setup({providerStatus:429});await app.run();assert.equal(app.finishes[0].p_state,'queued');
 app=setup({providerStatus:400});await app.run();assert.equal(app.finishes[0].p_state,'failed');
 console.log('PASS: welcome deduplication, trusted recipient, three locales, escaping, setup/auth guards, ambiguous network outcome and provider rejection handling (mock services).');
 if(process.argv.includes('--preview')){
  const dir=path.join(__dirname,'../docs/newsletter');fs.mkdirSync(dir,{recursive:true});
  for(const lang of ['fr','en','ja'])fs.writeFileSync(path.join(dir,`welcome-${lang}.html`),app.context.welcomeContent(lang,'YU','/assets/media/community/welcome-five-v1.png','http://127.0.0.1:8769').html);
  console.log('3 local welcome email previews generated.');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
