const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const texts = JSON.parse(fs.readFileSync(path.join(root, 'assets/i18n/community.json'))).fr;
const source = fs.readFileSync(path.join(root, 'assets/js/community.js'), 'utf8');
async function setup(configured = true, protectedLogin = false, welcomeEnabled = false) {
  const elements = new Map();
  const node = () => ({ hidden: false, value: '', textContent: '', attributes: {}, callbacks: {}, disabled: true,
    addEventListener(event, fn) { this.callbacks[event] = fn; }, setAttribute(k,v) { this.attributes[k] = v; },
    querySelector() { return this.button ||= node(); }, focus() {}, showModal() { this.open = true; }, close() { this.open = false; } });
  const get = id => { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); };
  get('community-text').textContent = JSON.stringify(texts);
  const choices = ['yuki','hana','rei','mio'].map(id => Object.assign(node(), { dataset: { avatar: id } }));
  let signedIn = false, mode = '', saved, sends = 0, deletes = 0, lastOtp, captchaCallback, welcomes = 0;
  const user = { id: 'user-a', email: 'test@example.invalid' };
  const client = { auth: {
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: signedIn ? user : null }, error: !signedIn }),
    onAuthStateChange() {},
    signInWithOtp: async args => { lastOtp = args; sends++; return { error: null }; },
    verifyOtp: async ({ token }) => { signedIn = token === '123456'; return { error: !signedIn }; },
    signOut: async () => { signedIn = false; return {}; }
  }, from(table) { assert.equal(table,'player_profiles'); return {
    select() { return this; }, eq(k,v) { assert.equal(k,'id'); assert.equal(v,user.id); return this; },
    maybeSingle: async () => ({ data: mode === 'read-error' ? null : { display_name: 'Yu', avatar_id: 'hana' }, error: mode === 'read-error' }),
    upsert: async value => { saved = value; return { error: mode === 'save-error' }; }
  }; }, functions: { invoke: async (name, options) => { if(name==='welcome-player'){assert.equal(options.body.language,'fr');welcomes++;return {};} assert.equal(name,'delete-player'); assert.equal(options.method,'DELETE'); deletes++; return {}; } } };
  vm.runInNewContext(source, { document: { getElementById: get, querySelectorAll: () => choices, documentElement: { lang: 'fr' } },
    window: { YOUTHSEIKO_COMMUNITY: configured ? { authEnabled: true, welcomeEnabled, turnstileSiteKey: protectedLogin ? 'public-test-site-key' : '', supabaseUrl: 'https://test.supabase.co', publishableKey: 'sb_publishable_test', newsletterUrls: {} } : {}, supabase: { createClient: () => client }, turnstile: { render: (selector,options) => { captchaCallback = options.callback; return 'test-widget'; }, reset() {} } },
    URL, Blob, Date, setTimeout() {} });
  await Promise.resolve();
  return { get, choices, action: async (id,event='submit') => get(id).callbacks[event]({ preventDefault() {} }), mode: value => { mode = value; }, captcha: token => captchaCallback(token), stats: () => ({ saved,sends,deletes,lastOtp,welcomes }) };
}
(async () => {
  const disabled = await setup(false);
  assert.equal(disabled.get('login-form').querySelector().disabled,true);
  await disabled.action('login-form'); assert.equal(disabled.stats().sends,0);
  assert.equal(disabled.get('newsletter-link').href,undefined);
  const protectedApp = await setup(true,true);
  await new Promise(resolve=>setImmediate(resolve));
  protectedApp.get('email').value='test@example.invalid';
  await protectedApp.action('login-form'); assert.equal(protectedApp.stats().sends,0,'no OTP without captcha token');
  protectedApp.captcha('verified-test-token'); await protectedApp.action('login-form');
  assert.equal(protectedApp.stats().lastOtp.options.captchaToken,'verified-test-token');
  const app = await setup(); app.get('email').value = 'test@example.invalid';
  await app.action('login-form'); assert.equal(app.stats().sends,1);
  await app.action('login-form'); assert.equal(app.stats().sends,1,'cooldown blocks duplicate OTP');
  app.get('otp').value = '000000'; await app.action('otp-form'); assert.equal(app.get('status').textContent,texts.badcode);
  app.get('otp').value = '123456'; await app.action('otp-form'); assert.equal(app.get('nickname').value,'Yu');
  assert.equal(app.get('avatar-preview').alt,'Hana');
  await app.choices[3].callbacks.click(); app.get('nickname').value = '<Yu>'; await app.action('profile-form');
  assert.equal(app.stats().saved.id,'user-a'); assert.equal(app.stats().saved.avatar_id,'mio');
  assert.equal(app.get('profile-label').textContent,'<Yu>','nickname is inserted as text');
  app.mode('save-error'); await app.action('profile-form'); assert.equal(app.get('status').textContent,texts.failure);
  app.mode('read-error'); await app.action('reload-profile','click'); assert.equal(app.get('profile-form').hidden,true);
  assert.equal(app.get('status').textContent,texts.profilefailure);
  await app.action('logout','click'); assert.equal(app.get('account-actions').hidden,true);
  assert.equal(app.get('avatar-preview').alt,'Yuki');
  const welcomed = await setup(true,false,true);
  welcomed.get('otp').value='123456'; await welcomed.action('otp-form');
  await welcomed.action('reload-profile','click');
  assert.equal(welcomed.stats().welcomes,1,'reloading a verified profile must not repeat the welcome call');
  const deletion = await setup(); deletion.get('email').value='test@example.invalid';
  await deletion.action('login-form'); deletion.get('otp').value='123456'; await deletion.action('otp-form');
  await deletion.action('delete','click'); assert.equal(deletion.stats().deletes,0,'opening dialog must not delete');
  await deletion.action('confirm-delete','click'); assert.equal(deletion.stats().deletes,1);
  assert.equal(deletion.get('status').textContent,texts.deleted);
  console.log('PASS: disabled configuration, OTP cooldown/error/success, avatar persistence, private profile failures, sign-out and explicit deletion (mock Supabase; no email sent).');
})().catch(error => { console.error(error); process.exitCode = 1; });
