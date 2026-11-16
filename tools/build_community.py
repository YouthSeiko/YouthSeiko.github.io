"""Generate private noindex player pages; no email collection until configured."""
from pathlib import Path
from html import escape
import json,argparse
ROOT=Path(__file__).resolve().parents[1]
TEXT=json.loads((ROOT/'assets/i18n/community.json').read_text(encoding='utf-8'))
def page(lang,t):
 def x(k):return escape(t[k])
 flags=''.join(f'<a href="/{l}/communaute/" lang="{l}"'+(' aria-current="page"' if l==lang else '')+f'>{label}</a>' for l,label in [('fr','🇫🇷 FR'),('en','🇬🇧 EN'),('ja','🇯🇵 JP')])
 avatars=''.join(f'<button class="avatar-choice" type="button" data-avatar="{key}" aria-pressed="{str(key=="yuki").lower()}"><img src="/assets/media/les-ex/characters/{key}.webp" alt="" width="120" height="120"><span>{name}</span></button>' for key,name in [('yuki','Yuki'),('hana','Hana'),('rei','Rei'),('mio','Mio')])
 return f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="strict-origin-when-cross-origin"><title>{x('page')} | Youthseiko</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/assets/css/community.css?v=20261116-1"><script src="/assets/js/community-config.js" defer></script><script src="/assets/vendor/supabase/supabase-2.119.0.js" defer></script><script src="/assets/js/community.js?v=20261116-1" defer></script></head>
<body><header><a href="/{lang}/">✦ YOUTHSEIKO</a><a href="/{lang}/">{x('home')}</a><nav aria-label="Language">{flags}</nav></header>
<main><div class="intro"><span class="eyebrow">YOUTHSEIKO / W1 · 2026–2027</span><h1>{x('intro')}</h1><p>{x('lead')}</p></div><p id="configuration-note" class="notice">{x('notready')}</p>
<div class="layout"><section class="panel newsletter"><img src="/assets/media/yuki/chibi-wave.png" width="100" height="100" alt="Yuki"><span class="eyebrow">01 / NEWSLETTER</span><h2>{x('news')}</h2><p>{x('newsbody')}</p><p><a class="button" id="newsletter-link" hidden target="_blank" rel="noopener noreferrer">{x('subscribe')} ↗</a><span id="newsletter-unavailable" class="muted">{x('newsnotready')}</span></p><p class="muted">{x('newsnote')}</p></section>
<section class="panel"><span class="eyebrow">02 / PLAYER</span><h2>{x('account')}</h2><p>{x('accountbody')}</p>
<form id="login-form"><label for="email">{x('email')}</label><input id="email" type="email" autocomplete="email" maxlength="254" required><button type="submit" disabled>{x('send')}</button></form>
<form id="otp-form" hidden><label for="otp">{x('code')}</label><input id="otp" type="text" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{{6,10}}" minlength="6" maxlength="10" required><button type="submit">{x('verify')}</button></form>
<p id="status" role="status" aria-live="polite"></p><button id="reload-profile" class="secondary" hidden>{x('retry')}</button></section>
<section class="panel" style="grid-column:1/-1"><div class="profile-heading"><img class="avatar-preview" id="avatar-preview" src="/assets/media/les-ex/characters/yuki.webp" width="116" height="116" alt="Yuki"><div><span class="eyebrow">03 / AVATAR</span><h2>{x('choose')}</h2><p id="profile-label" class="muted">{x('preview')}</p></div></div><div class="avatar-grid" role="group" aria-label="{x('choose')}">{avatars}</div>
<form id="profile-form" hidden><label for="nickname">{x('nick')}</label><input id="nickname" autocomplete="nickname" minlength="2" maxlength="32" required><button type="submit">{x('save')}</button></form><p class="muted">{x('private')}</p><div class="actions" id="account-actions" hidden><button class="secondary" id="logout">{x('logout')}</button><button class="secondary" id="export">{x('export')}</button><button class="secondary" id="delete">{x('delete')}</button></div></section></div></main>
<footer>© 2026 Youthseiko · <a href="mailto:youthseiko@gmail.com">youthseiko@gmail.com</a></footer>
<dialog id="delete-dialog" aria-labelledby="delete-title"><h2 id="delete-title">{x('deletetitle')}</h2><p>{x('deletebody')}</p><div class="actions"><button id="cancel-delete" class="secondary">{x('cancel')}</button><button id="confirm-delete" class="secondary">{x('confirm')}</button></div></dialog>
<script type="application/json" id="community-text">{json.dumps(t,ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></body></html>'''
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
 for lang,t in TEXT.items():
  dest=ROOT/lang/'communaute/index.html';content=page(lang,t)
  if args.check:
   assert dest.exists() and dest.read_text(encoding='utf-8')==content, str(dest)
  else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content,encoding='utf-8')
 print('3 community pages '+('current' if args.check else 'generated'))
