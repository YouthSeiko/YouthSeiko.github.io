// Server only. No service secret is ever returned to the browser.
Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin') ?? '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://youthseiko.github.io').split(',');
  const headers = { 'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'null',
    'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const reply = (status: number, error?: string) => new Response(JSON.stringify(error ? { error } : { deleted: true }), { status, headers });
  if (!allowed.includes(origin)) return reply(403, 'forbidden');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'DELETE') return reply(405, 'method');
  const bearer = request.headers.get('authorization') ?? '';
  if (!bearer.startsWith('Bearer ')) return reply(401, 'unauthorized');
  const url = Deno.env.get('SUPABASE_URL');
  let key: string | undefined;
  try { key = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); }
  catch { return reply(503, 'unavailable'); }
  if (!url || !key) return reply(503, 'unavailable');
  try {
    const verified = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: bearer }, signal: AbortSignal.timeout(15000) });
    if (!verified.ok) return reply(401, 'unauthorized');
    const user = await verified.json();
    if (!user.id || !user.email_confirmed_at) return reply(401, 'unauthorized');
    const deletion = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'DELETE', headers: key.startsWith('sb_secret_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000)
    });
    return deletion.ok ? reply(200) : reply(502, 'delete_failed');
  } catch { return reply(502, 'unavailable'); }
});
