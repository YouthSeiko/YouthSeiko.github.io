(() => {
  'use strict';
  const config = window.YOUTHSEIKO_COMMUNITY || {};
  if (config.authEnabled !== true || !config.publishableKey?.startsWith('sb_publishable_')) return;
  let url;
  try { url = new URL(config.supabaseUrl); if (url.protocol !== 'https:') return; } catch { return; }
  const entry = document.querySelector('.community-entry');
  if (!entry) return;
  const script = document.createElement('script');
  script.src = '/assets/vendor/supabase/supabase-2.119.0.js';
  script.onload = async () => {
    const client = window.supabase.createClient(url.href, config.publishableKey, { auth: { detectSessionInUrl: false } });
    let epoch = 0;
    const refresh = async () => {
      const request = ++epoch;
      try {
        const { data } = await client.auth.getSession();
        if (request !== epoch) return;
        if (!data.session) { entry.querySelector('img')?.remove(); return; }
        const verified = await client.auth.getUser();
        if (!verified.data.user) return;
        const result = await client.from('player_profiles').select('avatar_id').eq('id', verified.data.user.id).maybeSingle();
        if (request !== epoch) return;
        entry.querySelector('img')?.remove();
        const avatar = result.data?.avatar_id;
        if (!['yuki', 'hana', 'rei', 'mio'].includes(avatar)) return;
        const image = document.createElement('img'); image.src = `/assets/media/les-ex/characters/${avatar}.webp`;
        image.alt = ''; image.width = 28; image.height = 28;
        image.style.cssText = 'width:28px;height:28px;object-fit:cover;border-radius:50%;vertical-align:middle;background:#f5ddea;margin-right:6px';
        entry.prepend(image);
      } catch { /* A private account error must not disrupt public pages. */ }
    };
    client.auth.onAuthStateChange(() => setTimeout(refresh, 0));
    await refresh();
  };
  document.head.append(script);
})();
