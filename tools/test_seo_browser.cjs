/* Headless validation of generated pages. No production dependency. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.argv[2];
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.mp3':'audio/mpeg','.mp4':'video/mp4','.vtt':'text/vtt'};
const urls=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://local').pathname);let f=path.resolve(root,'.'+name);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(name.endsWith('/'))f=path.join(f,'index.html');try{res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
let browser;const errors=[];
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
async function context(js,width,motion="reduce"){const c=await browser.newContext({javaScriptEnabled:js,viewport:{width,height:900},reducedMotion:motion});await c.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));return c;}
const nojs=await context(false,390),p=await nojs.newPage();
for(const route of urls){const r=await p.goto(base+route,{waitUntil:'load'});assert.equal(r.status(),200,route);assert.equal(await p.locator('html').getAttribute('lang'),route.split('/')[1]);assert.equal(await p.locator('h1').count(),1,route);assert(await p.locator('h1').isVisible(),route);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' overflows');}
console.log(`PASS ${urls.length} static pages readable at 390px without JavaScript`);await nojs.close();
const c=await context(true,390);await c.addInitScript(()=>{try{localStorage.setItem('youthseiko.language','fr')}catch{}});const page=await c.newPage();
for(const route of urls){await page.goto(base+route,{waitUntil:'load'});await page.waitForFunction(()=>!!window.YouthseikoI18n);assert.equal(await page.locator('html').getAttribute('lang'),route.split('/')[1]);}
console.log(`PASS ${urls.length} generated pages execute without page errors`);
for(const route of ['/en/','/ja/','/fr/jeux/project-mirai/','/en/jeux/les-ex-de-lhaut-dela/','/ja/jeux/project-century/','/en/carnet/un-masque-plusieurs-univers/','/ja/actualites/demo-acte-1-microsoft-store/','/en/presse/']){
 await page.goto(base+route,{waitUntil:'load'});await page.waitForFunction(()=>!!window.YouthseikoI18n);assert.equal(await page.locator('html').getAttribute('lang'),route.split('/')[1]);assert(await page.locator('[data-language="en"]').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' JS overflow');
 if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,route.replace(/\//g,'_')+'.png'),fullPage:false});}
}
console.log('PASS Static locale wins over saved preference; mobile flags and layouts');
await page.goto(base+'/en/jeux/les-ex-de-lhaut-dela/');await page.locator('[data-language="ja"]').click();await page.waitForURL('**/ja/jeux/les-ex-de-lhaut-dela/');assert.equal(await page.locator('html').getAttribute('lang'),'ja');console.log('PASS Flags navigate between the same game in all languages');
await page.goto(base+'/en/');await page.waitForFunction(()=>!!window.YouthseikoI18n);await page.locator('#mascotVoice').click();assert.match(await page.locator('#mascotAudio').getAttribute('src'),/\/assets\/voice\/yuki\//);console.log('PASS Yuki voice assets resolve from nested homepage');
await page.goto(base+'/en/actualites/demo-acte-1-microsoft-store/');assert.equal(await page.locator('iframe').count(),0);assert(await page.locator('a[href*="9NKH7Z996H68"]').count()>0);await page.locator('[data-acte1-trailer]').click();assert.match(await page.locator('iframe').getAttribute('src'),/^https:\/\/www.youtube-nocookie.com\/embed\/mtY2pzi8atQ$/);console.log('PASS Demo Store link and click-only no-cookie trailer preserved');
await page.goto(base+'/en/actualites/yuki-3d-et-desktop/');await page.locator('details.yuki-workshop summary').click();
await page.evaluate(()=>{window.pauseCalls=[];const v=[...document.querySelectorAll('video[data-studio-video]')];v.forEach((n,i)=>n.pause=()=>window.pauseCalls.push(i));v[0].dispatchEvent(new Event('play'));});assert((await page.evaluate(()=>window.pauseCalls)).includes(1));
await page.locator('details.yuki-workshop summary').click();await page.waitForFunction(()=>window.pauseCalls.includes(0));console.log('PASS Standalone Yuki videos pause each other and stop when workshop closes');
await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/fr/jeux/les-ex-de-lhaut-dela/');if(shots)(await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{}))))),await page.screenshot({path:path.join(shots,'desktop-heart.png')});await page.goto(base+'/fr/presse/');if(shots)await page.screenshot({path:path.join(shots,'desktop-presse.png')});assert.deepEqual(errors,[]);await c.close();
const exContext=await context(true,1440,'no-preference'),ex=await exContext.newPage();let mp4Requests=0;ex.on('request',r=>{if(r.url().endsWith('.mp4'))mp4Requests++;});
await ex.goto(base+'/en/jeux/les-ex-de-lhaut-dela/');await ex.waitForFunction(()=>!!window.YouthseikoI18n);
assert.equal(mp4Requests,0,'trailers must not download on arrival');assert.equal(await ex.locator('#ex-trailer source').getAttribute('src'),'/assets/media/les-ex/trailers/en.mp4');
await ex.locator('[data-ex-trailer="ja"]').click();assert.equal(await ex.locator('#ex-trailer source').getAttribute('src'),base+'/assets/media/les-ex/trailers/ja.mp4');assert(await ex.locator('#ex-trailer').evaluate(v=>v.paused));
await ex.locator('[data-ex-character="mio"]').click();assert.equal(await ex.locator('[data-ex-character="mio"]').getAttribute('aria-pressed'),'true');assert.match(await ex.locator('#ex-character-note').textContent(),/everyday life/);
await ex.locator('[data-ex-motion]').click();assert.equal(await ex.locator('.ex-actor img').first().evaluate(n=>getComputedStyle(n).animationName),'none');
await ex.locator('[data-ex-lightbox]').first().click();assert(await ex.locator('#ex-lightbox').evaluate(n=>n.open));await ex.keyboard.press('ArrowRight');assert.match(await ex.locator('#ex-lightbox-caption').textContent(),/Hana/);await ex.keyboard.press('Escape');assert.equal(await ex.locator('[data-ex-lightbox]').first().evaluate(n=>n===document.activeElement),true);
console.log('PASS Les EX: no eager video, language selection without autoplay, cast, motion and keyboard gallery');
await ex.setViewportSize({width:390,height:900});await ex.goto(base+'/ja/jeux/les-ex-de-lhaut-dela/');assert(await ex.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(shots)await ex.screenshot({path:path.join(shots,'ex-japanese-mobile.png')});
await ex.setViewportSize({width:1440,height:1000});await ex.goto(base+'/fr/jeux/les-ex-de-lhaut-dela/');await ex.locator('.ex-actor img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));if(shots)await ex.screenshot({path:path.join(shots,'ex-hero-desktop.png')});assert.deepEqual(errors,[]);await exContext.close();console.log(JSON.stringify({pages:urls.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
