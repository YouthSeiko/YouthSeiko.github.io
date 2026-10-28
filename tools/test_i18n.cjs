/* Local language integration checks. Playwright is a development tool only. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const out = process.argv[2];
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server = http.createServer((req,res)=>{
  const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'') || 'index.html';
  const file = path.resolve(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}
  catch{res.writeHead(404).end();}
});
let browser,base;
const errors=[],passed=[];
async function check(name,fn){await fn();passed.push(name);console.log('PASS '+name);}
async function context(options={},init){
  const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',...options});
  await c.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  if(init)await c.addInitScript(init);
  return c;
}
async function load(c,suffix='/'){const p=await c.newPage();await p.goto(base+suffix,{waitUntil:'load'});await p.waitForFunction(()=>!!window.YouthseikoI18n);return p;}
async function language(p,id){await p.locator('[data-language="'+id+'"]').click();await p.waitForFunction(id=>document.documentElement.lang===id,id);}
async function coverage(p){const missing=await p.evaluate(()=>window.YouthseikoI18n.missing());assert.deepEqual(missing,[]);}
async function open(p,trigger,dialog){await p.locator(trigger).click();await p.locator(dialog).waitFor({state:'visible'});}
async function close(p,dialog){await p.locator(dialog+' [data-close]').click();await p.locator(dialog).waitFor({state:'hidden'});}
async function shot(p,name,selector){if(!out)return;const opts={path:path.join(out,name+'.png'),animations:'disabled'};if(selector)await p.locator(selector).screenshot(opts);else await p.screenshot(opts);}
async function journey(p,lang){
  for(let n=0;n<7;n++)await p.locator('#mascotTalk').click();
  assert.match(await p.locator('#mascotLine').textContent(),lang==='ja'?/ノート/:/notebook/);
  await open(p,'#notebook-entry','#secret-heart');
  await p.locator('#notebook-next').click();await p.locator('#notebook-next').click();
  assert.match(await p.locator('#notebook-position').textContent(),lang==='ja'?/3 \/ 3 ページ/:/Page 3 \/ 3/);
  await p.locator('[data-claim="HEART"]').click();await coverage(p);await shot(p,lang+'-notebook','#secret-heart');await close(p,'#secret-heart');
  await open(p,'.medical-trigger','#secret-mirai');await p.locator('#terminal-inspect').click();await p.locator('#terminal-compare').click();await p.locator('[data-claim="MIRAI"]').click();await coverage(p);await close(p,'#secret-mirai');
  await open(p,'.cube-trigger','#secret-babylone');await p.locator('#room-inscription').click();await p.locator('#room-turn').click();await p.locator('#room-object').click();await p.locator('[data-claim="BABYLONE"]').click();await coverage(p);await close(p,'#secret-babylone');
  await open(p,'#project-century .secret-trigger','#secret-century');for(let i=0;i<4;i++)await p.locator('#chat-next').click();await p.locator('#chat-inspect-date').click();await p.locator('[data-claim="CENTURY"]').click();await coverage(p);await close(p,'#secret-century');
  await open(p,'.archive-entry','#secret-archives');assert.equal(await p.locator('#archive-unlock').isDisabled(),false);await p.locator('#archive-unlock').click();await coverage(p);await shot(p,lang+'-archives','#secret-archives');await p.locator('#glitch-enter').click();
  assert.match(await p.locator('#glitch-exit').textContent(),lang==='ja'?/通常/:/Return/);
  const css=await p.locator('.hero').evaluate(e=>getComputedStyle(e,'::after').content);assert.doesNotMatch(css,/LA VITRINE/);
  await coverage(p);await p.locator('#glitch-exit').click();assert.equal(await p.locator('body').evaluate(e=>e.classList.contains('is-glitched')),false);
}
(async()=>{
 if(out)fs.mkdirSync(out,{recursive:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'msedge',headless:true});
 const c=await context();const p=await load(c);p.setDefaultTimeout(10000);
 await check('French default, three accessible flags and complete catalogue',async()=>{
  assert.equal(await p.locator('html').getAttribute('lang'),'fr');assert.equal(await p.locator('#language-switcher button').count(),3);
  assert.equal(await p.locator('[data-language="fr"]').getAttribute('aria-pressed'),'true');await coverage(p);
 });
 await check('English/Japanese switch all sections, metadata and Yuki; French restores',async()=>{
  for(const id of ['en','ja','fr']){
   await language(p,id);assert.equal(await p.locator('html').getAttribute('lang'),id);
   assert.match(await p.locator('.hero-tagline').textContent(),id==='en'?/Strange worlds/:id==='ja'?/不思議な世界/:/Des mondes étranges/);
   assert.match(await p.title(),id==='en'?/Independent/:id==='ja'?/インディー/:/indépendant/);
   assert.equal(await p.locator('meta[property="og:locale"]').getAttribute('content'),{fr:'fr_FR',en:'en_GB',ja:'ja_JP'}[id]);
   assert.equal(await p.locator('script[type="application/ld+json"]').evaluate(e=>JSON.parse(e.textContent)['@graph'][1].inLanguage),{fr:'fr-FR',en:'en-GB',ja:'ja-JP'}[id]);
   await coverage(p);
  }
 });
 await check('Preference and share URL persist without losing fragments or hash',async()=>{
  await p.evaluate(()=>localStorage.setItem('youthseiko.fragments.v1',JSON.stringify({version:1,fragments:['MIRAI']})));
  await p.goto(base+'/#projets');await language(p,'en');assert.equal(new URL(p.url()).hash,'#projets');assert.equal(new URL(p.url()).searchParams.get('lang'),'en');
  await p.reload();assert.equal(await p.locator('html').getAttribute('lang'),'en');assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('youthseiko.fragments.v1')).fragments),['MIRAI']);
  await p.goto(base+'/?lang=ja#projets');assert.equal(await p.locator('html').getAttribute('lang'),'ja');
 });
 await check('Header/mobile menu fit 320–1440px in every language',async()=>{
  await p.locator('#mascotReduce').click();
  for(const id of ['fr','en','ja']){
   await language(p,id);
   for(const width of [1440,1100,1000,800,600,390,320]){
    await p.setViewportSize({width,height:1000});
    const header=await p.locator('.nav-inner').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert.ok(header.scroll<=header.client+1,JSON.stringify({id,width,...header}));
    const flags=await p.locator('#language-switcher').boundingBox();assert.ok(flags.x>=0&&flags.x+flags.width<=width);
    if(width<=1000){await p.locator('#navToggle').click();assert.equal(await p.locator('#navToggle').getAttribute('aria-expanded'),'true');await p.locator('#nav a[href="#accueil"]').click();assert.equal(await p.locator('#navToggle').getAttribute('aria-expanded'),'false');}
    if([1440,390,320].includes(width)){await p.evaluate(()=>scrollTo(0,0));await shot(p,id+'-home-'+width);}
   }
  }
 });
 await c.close();
 for(const id of ['en','ja']){
  await check(id+': four secrets, dynamic messages, collection and glitch reward',async()=>{
   const c2=await context();const q=await load(c2,'/?lang='+id);await journey(q,id);await language(q,'fr');await open(q,'.archive-entry','#secret-archives');assert.match(await q.locator('#archive-progress').textContent(),/4 \/ 4 fragments retrouvés/);await c2.close();
  });
 }
 await check('Blocked storage: all languages still work within the visit',async()=>{
  const c2=await context({},()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});const q=await load(c2);await language(q,'ja');await open(q,'.archive-entry','#secret-archives');assert.match(await q.locator('#storage-note').textContent(),/保存機能/);await coverage(q);await c2.close();
 });
 await check('Bad language input falls back to French; no JS keeps the French site readable',async()=>{
  const c2=await context({},()=>{try{localStorage.setItem('youthseiko.language','unknown');}catch{}});const q=await load(c2,'/?lang=invalid');assert.equal(await q.locator('html').getAttribute('lang'),'fr');await c2.close();
  const c3=await context({javaScriptEnabled:false});const q3=await c3.newPage();await q3.goto(base+'/?lang=ja');assert.equal(await q3.locator('#language-switcher').isVisible(),false);assert.equal(await q3.locator('.project-hook:visible').count(),4);await c3.close();
 });
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:passed.length,errors},null,2));
})().catch(async e=>{console.error(e);process.exitCode=1;if(out&&browser){const p=browser.contexts().flatMap(c=>c.pages())[0];if(p)await p.screenshot({path:path.join(out,'failure.png')});}}).finally(async()=>{if(browser)await browser.close();server.close();});
