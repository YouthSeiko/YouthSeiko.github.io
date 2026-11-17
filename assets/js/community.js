(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const text = JSON.parse($('community-text').textContent);
  const config = window.YOUTHSEIKO_COMMUNITY || {};
  const lang = document.documentElement.lang;
  const welcomeRequests = new Set();
  const names = { yuki: 'Yuki', hana: 'Hana', rei: 'Rei', mio: 'Mio' };
  const captchaRequired = Boolean(config.turnstileSiteKey);
  let captchaToken = '', captchaWidget, captchaLoading = false;
  let avatar = 'yuki', client, user, profile, email, busy = false, cooldown = 0, generation = 0;
  const message = (key) => { $('status').textContent = text[key] || ''; };
  const https = (value) => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u : null; } catch { return null; } };
  const pick = (id) => {
    if (!Object.hasOwn(names, id)) return;
    avatar = id;
    $('avatar-preview').src = `/assets/media/les-ex/characters/${id}.webp`;
    $('avatar-preview').alt = names[id];
    document.querySelectorAll('[data-avatar]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.avatar === id)));
  };
  document.querySelectorAll('[data-avatar]').forEach((button) => button.addEventListener('click', () => pick(button.dataset.avatar)));
  const newsletter = https(config.newsletterUrls?.[lang]);
  if (newsletter) {
    $('newsletter-link').href = newsletter.href;
    $('newsletter-link').hidden = false;
    $('newsletter-unavailable').hidden = true;
  }
  const controls = () => {
    $('login-form').querySelector('button').disabled = !client || busy || Date.now() < cooldown || (captchaRequired && !captchaToken);
    $('otp-form').querySelector('button').disabled = busy;
    $('profile-form').querySelector('button').disabled = busy;
    $('confirm-delete').disabled = busy;
  };
  const ensureCaptcha = () => {
    if (!captchaRequired || captchaWidget !== undefined || captchaLoading) return;
    captchaLoading = true; $('captcha-note').hidden = false;
    const render = () => {
      try {
        captchaWidget = window.turnstile.render('#login-captcha', {
          sitekey: config.turnstileSiteKey, language: lang === 'ja' ? 'ja' : lang,
          callback: token => { captchaToken = token; controls(); },
          'expired-callback': () => { captchaToken = ''; controls(); },
          'error-callback': () => { captchaToken = ''; controls(); message('captchaFailure'); }
        });
      } catch { message('captchaFailure'); }
    };
    if (window.turnstile) render();
    else {
      const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.onload = render; script.onerror = () => message('captchaFailure'); document.head.append(script);
    }
  };
  const signedOut = () => {
    generation++; user = undefined; profile = undefined;
    $('login-form').hidden = false; $('otp-form').hidden = true;
    $('profile-form').hidden = true; $('account-actions').hidden = true;
    $('reload-profile').hidden = true; $('nickname').value = '';
    $('profile-label').textContent = text.preview; pick('yuki'); ensureCaptcha();
  };
  const loadProfile = async () => {
    const request = ++generation;
    const { data, error } = await client.auth.getUser();
    if (request !== generation) return;
    if (error || !data.user) { signedOut(); return; }
    user = data.user;
    if (config.welcomeEnabled === true && !welcomeRequests.has(user.id)) {
      welcomeRequests.add(user.id);
      // Delivery is optional to the sign-in flow and deduplicated on the server.
      client.functions.invoke('welcome-player', { body: { language: lang } }).catch(() => {});
    }
    $('login-form').hidden = true; $('otp-form').hidden = true;
    $('account-actions').hidden = false; $('profile-form').hidden = true;
    const result = await client.from('player_profiles').select('id,display_name,avatar_id,language,updated_at').eq('id', user.id).maybeSingle();
    if (request !== generation) return;
    if (result.error) { $('reload-profile').hidden = false; message('profilefailure'); return; }
    profile = result.data;
    $('reload-profile').hidden = true; $('profile-form').hidden = false;
    $('nickname').value = profile?.display_name || '';
    $('profile-label').textContent = profile?.display_name || text.preview;
    pick(profile?.avatar_id || avatar); message('');
  };
  const guarded = (fn) => async (event) => {
    event?.preventDefault();
    if (!client || busy) return;
    busy = true; controls();
    try { await fn(); } catch { message('failure'); }
    finally { busy = false; controls(); }
  };
  $('login-form').addEventListener('submit', guarded(async () => {
    if (Date.now() < cooldown) return;
    if (captchaRequired && !captchaToken) { message('captchaFailure'); return; }
    email = $('email').value.trim();
    let result;
    try { result = await client.auth.signInWithOtp({ email, ...(captchaRequired ? { options: { captchaToken } } : {}) }); }
    finally { if (captchaRequired) { captchaToken = ''; window.turnstile?.reset(captchaWidget); } }
    const { error } = result;
    if (error) { message('failure'); return; }
    cooldown = Date.now() + 60000; setTimeout(controls, 60100);
    $('otp-form').hidden = false; $('otp').value = ''; $('otp').focus(); message('sent');
  }));
  $('otp-form').addEventListener('submit', guarded(async () => {
    const { error } = await client.auth.verifyOtp({ email, token: $('otp').value.trim(), type: 'email' });
    if (error) { message('badcode'); return; }
    $('otp').value = ''; await loadProfile();
  }));
  $('profile-form').addEventListener('submit', guarded(async () => {
    const name = $('nickname').value.trim();
    if ([...name].length < 2 || [...name].length > 32) { message('badnick'); return; }
    const { data, error: authError } = await client.auth.getUser();
    if (authError || !data.user) { signedOut(); message('signedout'); return; }
    const { error } = await client.from('player_profiles').upsert({ id: data.user.id, display_name: name, avatar_id: avatar, language: lang, updated_at: new Date().toISOString() });
    if (error) { message('failure'); return; }
    profile = { display_name: name, avatar_id: avatar, language: lang };
    $('profile-label').textContent = name; message('saved');
  }));
  $('reload-profile').addEventListener('click', guarded(loadProfile));
  $('logout').addEventListener('click', guarded(async () => {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) { message('failure'); return; }
    signedOut(); message('signedout');
  }));
  $('export').addEventListener('click', guarded(async () => {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) { signedOut(); return; }
    const result = await client.from('player_profiles').select('display_name,avatar_id,language,updated_at').eq('id', data.user.id).maybeSingle();
    if (result.error) { message('failure'); return; }
    const blob = new Blob([JSON.stringify({ email: data.user.email, profile: result.data, newsletter: text.newsnote }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'youthseiko-profile.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  $('delete').addEventListener('click', () => $('delete-dialog').showModal());
  $('cancel-delete').addEventListener('click', () => $('delete-dialog').close());
  $('confirm-delete').addEventListener('click', guarded(async () => {
    const { error } = await client.functions.invoke('delete-player', { method: 'DELETE' });
    if (error) { message('failure'); $('delete-dialog').close(); return; }
    await client.auth.signOut({ scope: 'local' }); signedOut();
    $('delete-dialog').close(); message('deleted');
  }));
  const key = config.publishableKey || '';
  // Accept the modern public key only: no privileged credential in static files.
  if (config.authEnabled === true && https(config.supabaseUrl) && key.startsWith('sb_publishable_') && window.supabase?.createClient) {
    try {
      client = window.supabase.createClient(config.supabaseUrl, key, { auth: { detectSessionInUrl: false } });
      $('configuration-note').hidden = true; controls();
      client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') signedOut();
        else if (event === 'SIGNED_IN' && session?.user?.id !== user?.id) setTimeout(() => loadProfile().catch(() => message('failure')), 0);
      });
      client.auth.getSession().then(({ data }) => { if (data.session) return loadProfile(); ensureCaptcha(); }).catch(() => message('failure'));
    } catch { client = undefined; controls(); message('failure'); }
  }
})();
