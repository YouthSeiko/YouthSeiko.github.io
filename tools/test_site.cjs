/* Local integration tests. Requires Playwright + Edge; no production dependency.
   node tools/test_site.cjs [absolute screenshot directory]
   All external requests are blocked. The HTTP server and browser are temporary. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const screenshotDir = process.argv[2];
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon'};
const baseline = {};
for (const name of ['index.html', 'assets/css/style.css', 'assets/js/main.js']) {
  baseline[name] = execFileSync('git', ['show', 'cd3d686:' + name], {cwd:root});
}
const server = http.createServer((req,res) => {
  let name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\//,'');
  const old = name.startsWith('__baseline/');
  if (old) name = name.slice('__baseline/'.length);
  name ||= 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end(); return;}
  try {
    const body = old && baseline[name] ? baseline[name] : fs.readFileSync(file);
    res.writeHead(200, {'Content-Type':types[path.extname(name)] || 'application/octet-stream'}).end(body);
  } catch {res.writeHead(404).end();}
});
let browser;
let base;
const results = [];
const errors = [];
const touchContexts = new WeakSet();
async function check(name, fn) { await fn(); results.push(name); console.log('PASS ' + name); }
async function context(options = {}, init) {
  const ctx = await browser.newContext({viewport:{width:1440,height:1000}, reducedMotion:'reduce', ...options});
  if (options.hasTouch) touchContexts.add(ctx);
  await ctx.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  if (init) await ctx.addInitScript(init);
  ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return ctx;
}
async function load(ctx, suffix = '/') { const page = await ctx.newPage(); await page.goto(base + suffix, {waitUntil:'load'}); return page; }
async function saved(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('youthseiko.fragments.v1') || '{"fragments":[]}').fragments); }
async function activate(page, selector) {
  if (touchContexts.has(page.context())) await page.locator(selector).tap();
  else await page.locator(selector).click();
}
async function open(page, trigger, dialog) { await activate(page,trigger); await page.locator(dialog).waitFor({state:'visible'}); }
async function close(page, dialog) { await activate(page,dialog + ' [data-close]'); await page.locator(dialog).waitFor({state:'hidden'}); }
async function snap(page, name, selector) {
  if (!screenshotDir) return;
  const options = {path:path.join(screenshotDir, name + '.png'), animations:'disabled'};
  if (selector) await page.locator(selector).screenshot(options); else await page.screenshot({...options,fullPage:true});
}
async function heart(page) {
  for(let n=1;n<=7;n++) {
    await activate(page,'#mascotTalk');
    if (n<7) assert.equal(await page.locator('#notebook-entry').isVisible(), false);
  }
  await open(page, '#notebook-entry', '#secret-heart');
  await activate(page,'#notebook-next');
  await activate(page,'#notebook-next');
  await activate(page,'[data-claim="HEART"]');
}
async function mirai(page) {
  await open(page, '.medical-trigger', '#secret-mirai');
  await activate(page,'#terminal-inspect');
  await activate(page,'#terminal-compare');
  await activate(page,'[data-claim="MIRAI"]');
}
async function babylone(page) {
  await open(page, '.cube-trigger', '#secret-babylone');
  await activate(page,'#room-object');
  assert.equal(await page.locator('[data-claim="BABYLONE"]').isVisible(), false);
  await activate(page,'#room-inscription');
  await activate(page,'#room-turn');
  await activate(page,'#room-object');
  await activate(page,'[data-claim="BABYLONE"]');
}
async function century(page) {
  await open(page, '#project-century .secret-trigger', '#secret-century');
  for(let n=0;n<4;n++) await activate(page,'#chat-next');
  await activate(page,'#chat-inspect-date');
  await activate(page,'[data-claim="CENTURY"]');
}
async function noOverflow(page, selector = 'html') {
  const size = await page.locator(selector).evaluate(e => ({scroll:e.scrollWidth,client:e.clientWidth}));
  assert.ok(size.scroll <= size.client + 1, JSON.stringify({selector,...size}));
}
(async () => {
  if (screenshotDir) fs.mkdirSync(screenshotDir, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
  const ctx = await context();
  const page = await load(ctx);
  page.setDefaultTimeout(10000);
  await check('HTML: unique IDs, local resources, anchors, dialog labels', async () => {
    const report = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(e=>e.id);
      return {
        duplicate:ids.filter((id,i)=>ids.indexOf(id)!==i),
        anchors:[...document.querySelectorAll('a[href^="#"]')].map(e=>e.getAttribute('href')).filter(href=>!document.getElementById(href.slice(1))),
        dialogLabels:[...document.querySelectorAll('dialog')].filter(e=>!e.getAttribute('aria-label') && !document.getElementById(e.getAttribute('aria-labelledby'))).map(e=>e.id),
        resources:[...document.querySelectorAll('[src],link[href]')].map(e=>e.getAttribute('src')||e.getAttribute('href')).filter(href=>href && !/^https?:/.test(href))
      };
    });
    assert.deepEqual(report.duplicate,[]); assert.deepEqual(report.anchors,[]); assert.deepEqual(report.dialogLabels,[]);
    for(const resource of report.resources) assert.equal((await page.request.get(new URL(resource,base).href)).status(),200,resource);
  });
  await check('No fragment granted on arrival, dialog visits, or premature claim events', async () => {
    for(const [trigger,dialog] of [['.medical-trigger','#secret-mirai'],['.cube-trigger','#secret-babylone'],['#project-century .secret-trigger','#secret-century'],['.archive-entry','#secret-archives']]) {
      await open(page,trigger,dialog); await close(page,dialog);
    }
    // Exercise the eligibility guard separately from presentation hiding.
    await page.locator('[data-claim]').evaluateAll(buttons=>buttons.forEach(b=>b.click()));
    assert.deepEqual(await saved(page),[]);
    assert.equal(await page.locator('#archive-unlock').isDisabled(),true);
    assert.equal(await page.locator('#glitch-enter').isDisabled(),true);
    await page.locator('#glitch-enter').evaluate(e=>e.click());
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('is-glitched')),false);
  });
  await check('HEART: seven interactions, three pages, fragment, nested dialog and focus return', async () => {
    await heart(page);
    assert.deepEqual(await saved(page),['HEART']);
    await snap(page,'heart-desktop','#secret-heart');
    await open(page,'#secret-heart [data-modal="secret-archives"]','#secret-archives');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#secret-heart').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.body.classList.contains('modal-open')),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'notebook-entry');
    await page.waitForFunction(()=>!document.body.classList.contains('modal-open'));
    assert.equal(await page.evaluate(()=>document.body.classList.contains('modal-open')),false);
  });
  await check('MIRAI: inspect and compare before collection', async () => {
    await mirai(page); assert.deepEqual(await saved(page),['HEART','MIRAI']);
    await snap(page,'mirai-desktop','#secret-mirai'); await close(page,'#secret-mirai');
  });
  await check('BABYLONE: inscription, other side, object and collection', async () => {
    await babylone(page); assert.equal((await saved(page)).length,3);
    await snap(page,'babylone-desktop','#secret-babylone'); await close(page,'#secret-babylone');
  });
  await check('CENTURY: notification dismissal and message sequence', async () => {
    await page.locator('#project-century').scrollIntoViewIfNeeded();
    await page.locator('#century-dismiss').click();
    assert.equal(await page.locator('#century-notice').isVisible(),false);
    await century(page); assert.equal((await saved(page)).length,4);
    await snap(page,'century-desktop','#secret-century'); await close(page,'#secret-century');
  });
  await check('Archive 000 unlocks only at four fragments; persistence after reload', async () => {
    await open(page,'.archive-entry','#secret-archives');
    await page.locator('#archive-unlock').click();
    assert.equal(await page.locator('#archive-000').isVisible(),true);
    await snap(page,'archive-000-desktop','#secret-archives');
    await page.reload();
    assert.equal((await saved(page)).length,4);
    await open(page,'.archive-entry','#secret-archives');
    assert.equal(await page.locator('#archive-unlock').isDisabled(),false);
    await page.locator('#archive-unlock').click();
    await close(page,'#secret-archives');
  });
  await check('Archive 000: voluntary glitch theme, mobile exit, working dialogs and reset on reload', async () => {
    await page.reload();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('is-glitched')),false);
    await open(page,'.archive-entry','#secret-archives');
    await page.locator('#glitch-enter').evaluate(e=>e.click());
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('is-glitched')),false);
    await page.locator('#archive-unlock').click();
    await page.locator('#glitch-enter').click();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('is-glitched')),true);
    assert.equal(await page.locator('dialog[open]').count(),0);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'glitch-exit');
    assert.equal(await page.locator('#mascotAudio').evaluate(e=>e.paused),true);
    assert.equal(await page.locator('.hero-title').evaluate(e=>getComputedStyle(e).animationName),'none');
    if (screenshotDir) await page.screenshot({path:path.join(screenshotDir,'glitch-desktop.png'),animations:'disabled'});
    await open(page,'.project-card [data-modal="modal-heart"]','#modal-heart');
    await close(page,'#modal-heart');
    await open(page,'.medical-trigger','#secret-mirai');
    await close(page,'#secret-mirai');
    await page.setViewportSize({width:320,height:740});
    await page.evaluate(()=>window.scrollTo(0,0));
    await noOverflow(page);
    const boxes = await page.evaluate(()=>({exit:document.getElementById('glitch-controls').getBoundingClientRect().toJSON(),yuki:document.getElementById('mascotTalk').getBoundingClientRect().toJSON()}));
    assert.ok(boxes.exit.left>=0 && boxes.exit.right<=boxes.yuki.left+1,JSON.stringify(boxes));
    if (screenshotDir) await page.screenshot({path:path.join(screenshotDir,'glitch-mobile.png'),animations:'disabled'});
    await page.locator('#glitch-exit').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('is-glitched')),false);
    assert.equal(await page.locator('#glitch-controls').isVisible(),false);
    assert.equal((await saved(page)).length,4);
    await page.setViewportSize({width:1440,height:1000});
    await open(page,'.archive-entry','#secret-archives');
    await page.locator('#glitch-enter').click();
    await page.reload();
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('is-glitched')),false);
    assert.equal((await saved(page)).length,4);
  });
  await check('Existing project dialogs, HEART lightbox, FAQ and Yuki audio opt-in', async () => {
    for(const id of ['mirai','heart','babylone','century']) {
      await open(page, '.project-card [data-modal="modal-' + id + '"]','#modal-' + id);
      if(id==='heart') {
        await page.locator('.gallery-item').first().click();
        assert.equal(await page.locator('#lightbox').isVisible(),true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#modal-heart').isVisible(),true);
      }
      await close(page,'#modal-' + id);
    }
    assert.equal(await page.locator('#mascotAudio').evaluate(e=>e.paused),true);
    await page.locator('#mascotVoice').click();
    await page.waitForFunction(()=>!document.getElementById('mascotAudio').paused);
    await page.locator('#mascotTalk').click(); // First secret reaction must stop speech.
    assert.equal(await page.locator('#mascotAudio').evaluate(e=>e.paused),true);
    assert.equal(await page.locator('#mascotVoice').isDisabled(),true);
    await page.locator('#mascotTalk').click(); // Normal voiced line.
    await page.waitForFunction(()=>!document.getElementById('mascotAudio').paused);
    await open(page,'.medical-trigger','#secret-mirai');
    assert.equal(await page.locator('#mascotAudio').evaluate(e=>e.paused),true);
    await close(page,'#secret-mirai');
    await page.reload();
    assert.equal(await page.locator('#mascotAudio').evaluate(e=>e.paused),true);
    await page.locator('#yu-repond summary').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#yu-repond details').first().getAttribute('open'),'');
  });
  await check('Keyboard: modal traps Tab and returns focus on Escape', async () => {
    const trigger = page.locator('.medical-trigger');
    await trigger.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#secret-mirai').isVisible(),true);
    for(let n=0;n<12;n++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>!!document.activeElement.closest('#secret-mirai')),true);
    }
    await page.keyboard.press('Escape');
    assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  });
  await check('Page length reduced on desktop and 390px; mobile layouts 320/390/760', async () => {
    const lengths = [];
    for(const width of [1440,390]) {
      await page.setViewportSize({width,height:900});
      const old = await load(ctx,'/__baseline/index.html');
      await old.setViewportSize({width,height:900});
      const before = await old.locator('html').evaluate(e=>e.scrollHeight);
      const after = await page.locator('html').evaluate(e=>e.scrollHeight);
      assert.ok(after < before, JSON.stringify({width,before,after}));
      lengths.push({width,before,after,reductionPercent:Math.round((1-after/before)*100)});
      await old.close();
    }
    console.log('HEIGHTS ' + JSON.stringify(lengths));
    for(const width of [320,390,760]) {
      await page.setViewportSize({width,height:844});
      await noOverflow(page);
      const titleWidths = await page.locator('.project-card h3').evaluateAll(titles => titles.map(e => ({text:e.textContent,scroll:e.scrollWidth,client:e.clientWidth})));
      for (const title of titleWidths) assert.ok(title.scroll <= title.client + 1, JSON.stringify({width,...title}));
      for(const [trigger,dialog] of [['.medical-trigger','#secret-mirai'],['.cube-trigger','#secret-babylone'],['#project-century .secret-trigger','#secret-century'],['.archive-entry','#secret-archives']]) {
        await open(page,trigger,dialog); await noOverflow(page,dialog+' .modal-body');
        await snap(page,dialog.slice(1)+'-'+width,dialog);
        await close(page,dialog);
      }
      await page.locator('#mascotTalk').click();
      await open(page,'#notebook-entry','#secret-heart');
      await noOverflow(page,'#secret-heart .modal-body');
      await snap(page,'heart-'+width,'#secret-heart');
      await close(page,'#secret-heart');
      await page.locator('#navToggle').click();
      assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'true');
      await page.locator('#nav a[href="#projets"]').click();
      assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'false');
    }
    await page.setViewportSize({width:1440,height:1000});
    for(let y=0;y<await page.locator('html').evaluate(e=>e.scrollHeight);y+=600) {
      await page.evaluate(y=>window.scrollTo(0,y),y); await page.waitForTimeout(25);
    }
    await page.evaluate(()=>window.scrollTo(0,0));
    await snap(page,'page-desktop');
  });
  await check('Reduced motion disables scene transitions', async () => {
    assert.equal(await page.locator('#room-object').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  });
  await ctx.close();
  await check('Complete journey at 320px with touch input', async () => {
    const c = await context({viewport:{width:320,height:740},isMobile:true,hasTouch:true});
    const p = await load(c);
    await heart(p); await close(p,'#secret-heart');
    await mirai(p); await close(p,'#secret-mirai');
    await babylone(p); await close(p,'#secret-babylone');
    await century(p); await close(p,'#secret-century');
    assert.equal((await saved(p)).length,4);
    await open(p,'.archive-entry','#secret-archives'); await p.locator('#archive-unlock').tap();
    await noOverflow(p,'#secret-archives .modal-body');
    await snap(p,'archive-000-mobile','#secret-archives');
    await c.close();
  });
  await check('Blocked localStorage: collection works in memory, no crash or false persistence claim', async () => {
    const c = await context({},()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
    const p = await load(c);
    await mirai(p);
    assert.match(await p.locator('[data-feedback="MIRAI"]').textContent(),/visite seulement/);
    await close(p,'#secret-mirai'); await open(p,'.archive-entry','#secret-archives');
    assert.match(await p.locator('#archive-progress').textContent(),/^1 \/ 4/);
    assert.match(await p.locator('#storage-note').textContent(),/indisponible/);
    await p.reload(); await open(p,'.archive-entry','#secret-archives');
    assert.match(await p.locator('#archive-progress').textContent(),/^0 \/ 4/);
    await c.close();
  });
  await check('Malformed save and quota failure are recoverable', async () => {
    const c = await context({},()=>{
      if (window.top !== window || location.hostname !== '127.0.0.1') return;
      localStorage.setItem('youthseiko.fragments.v1','{broken');
      Storage.prototype.setItem = function(){throw new DOMException('Full','QuotaExceededError');};
    });
    const p = await load(c);
    await open(p,'.archive-entry','#secret-archives');
    assert.match(await p.locator('#storage-note').textContent(),/illisible/);
    await close(p,'#secret-archives'); await mirai(p);
    assert.match(await p.locator('[data-feedback="MIRAI"]').textContent(),/visite seulement/);
    await c.close();
  });
  await check('Saved IDs validated; another tab receives new fragments', async () => {
    const c = await context(); const p = await load(c);
    await p.evaluate(()=>localStorage.setItem('youthseiko.fragments.v1',JSON.stringify({version:1,fragments:['HEART','HEART','UNKNOWN',null,{}]})));
    await p.reload(); const other = await load(c);
    await mirai(p);
    await other.waitForFunction(()=>document.getElementById('archive-progress').textContent.startsWith('2 /'));
    assert.deepEqual(await saved(p),['HEART','MIRAI']);
    await c.close();
  });
  await check('Yuki workshop: deferred videos, playback, exclusive audio, close and responsive layout', async () => {
    const c = await context(); const p = await load(c);
    assert.equal(await p.locator('#latest-news .news-entry').first().getAttribute('id'),'news-yuki-life');
    const initial = await p.locator('[data-studio-video]').evaluateAll(videos=>videos.every(v=>v.paused && v.preload==='none' && !v.autoplay));
    assert.equal(initial,true);
    assert.equal(await p.evaluate(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('.mp4'))),false);
    await p.locator('#yuki-hors-ecran summary').click();
    await p.locator('#mascotVoice').click();
    await p.waitForFunction(()=>!document.getElementById('mascotAudio').paused);
    const animation = p.locator('[data-studio-video]').first();
    const desktop = p.locator('[data-studio-video]').last();
    await animation.evaluate(v=>v.play());
    await p.waitForFunction(()=>document.querySelector('[data-studio-video]').currentTime>0);
    assert.equal(await p.locator('#mascotAudio').evaluate(v=>v.paused),true);
    await desktop.evaluate(v=>v.play());
    await p.waitForFunction(()=>document.querySelector('[data-studio-video]').paused);
    assert.equal(await desktop.evaluate(v=>v.videoWidth),460);
    assert.equal(await desktop.evaluate(v=>v.videoHeight),250);
    await p.locator('#yuki-hors-ecran summary').click();
    await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-studio-video]')).every(v=>v.paused));
    await p.locator('#yuki-hors-ecran summary').focus(); await p.keyboard.press('Enter');
    assert.equal(await p.locator('#yuki-hors-ecran').getAttribute('open'),'');
    for (const width of [1440,390,320]) {
      await p.setViewportSize({width,height:900});
      await noOverflow(p,'.yuki-workshop');
      await snap(p,'yuki-workshop-'+width,'#news-yuki-life');
    }
    await c.close();
  });
  await check('Only the latest three news entries stay expanded (synthetic fixtures)', async () => {
    const c = await context();
    await c.route(base+'/',async route=>{
      const html = fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<div id="latest-news">','<div id="latest-news">'+[1,2,3,4].map(n=>`<article class="news-entry">Fixture ${n}</article>`).join(''));
      await route.fulfill({contentType:'text/html',body:html});
    });
    const p = await load(c);
    assert.equal(await p.locator('#latest-news .news-entry').count(),3);
    assert.equal(await p.locator('#older-news .news-entry').count(),3);
    await p.locator('#anciennes-actualites > summary').click();
    assert.equal(await p.locator('#older-news .news-entry').last().isVisible(),true);
    await c.close();
  });
  await check('Without JavaScript: projects, news, FAQ remain readable, secret controls hidden', async () => {
    const c = await context({javaScriptEnabled:false}); const p = await load(c);
    assert.equal(await p.locator('.project-hook:visible').count(),4);
    assert.equal(await p.locator('.news-entry:visible').count(),2);
    assert.equal(await p.locator('[data-secret-control]:visible').count(),0);
    await p.locator('#yu-repond summary').first().click();
    assert.equal(await p.locator('#yu-repond details[open]').count(),1);
    await c.close();
  });
  assert.deepEqual(errors,[],'Browser JavaScript errors');
  console.log(JSON.stringify({passed:results.length,errors},null,2));
})().catch(async error=>{
  console.error(error);
  if (browser && screenshotDir) {
    const pages = browser.contexts().flatMap(c=>c.pages());
    if (pages.length) {
      await pages[0].screenshot({path:path.join(screenshotDir,'failure.png')});
      console.log(await pages[0].locator('#notebook-next').evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),style:getComputedStyle(e).cssText,dialog:e.closest('dialog').getBoundingClientRect().toJSON()})));
    }
  }
  process.exitCode=1;
}).finally(async()=>{
  if(browser) await browser.close();
  server.close();
});
