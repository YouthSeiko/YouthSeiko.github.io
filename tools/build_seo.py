"""Generate crawlable FR/EN/JA pages from public index.html and the translation catalogue.
No dependencies. Run after build_i18n.py; --check detects stale published artifacts.
"""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
from copy import deepcopy
import argparse,json,re,io,zipfile
ROOT=Path(__file__).resolve().parents[1]
BASE='https://youthseiko.github.io'
LANGS=('fr','en','ja')
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
CAT={re.sub(r'\s+',' ',r[0]).strip():r for r in json.loads((ROOT/'assets/i18n/catalogue.json').read_text(encoding='utf-8'))}
def norm(s):return re.sub(r'\s+',' ',s).strip()
def tr(s,lang):
 key=norm(s)
 if key not in CAT:return s
 return re.sub(r'\S(?:.*\S)?',lambda m:CAT[key][LANGS.index(lang)],s,flags=re.S) if key else s
class Node:
 def __init__(self,tag,attrs=(),children=()):self.tag=tag;self.attrs=dict(attrs);self.children=list(children)
 def walk(self):
  yield self
  for c in self.children:
   if isinstance(c,Node):yield from c.walk()
 def text(self):return ''.join(c.text() if isinstance(c,Node) else c for c in self.children)
 def html(self):
  if self.tag=='root':return ''.join(render(c) for c in self.children)
  a=''.join(' '+k+(('="'+escape(v,quote=True)+'"') if v is not None else '') for k,v in self.attrs.items())
  if self.tag in VOID:return '<'+self.tag+a+'>'
  body=''.join(self.children) if self.tag in ('script','style') else ''.join(render(c) for c in self.children)
  return '<'+self.tag+a+'>'+body+'</'+self.tag+'>'
def render(n):return n.html() if isinstance(n,Node) else escape(n,quote=False)
class Tree(HTMLParser):
 def __init__(self,s):super().__init__(convert_charrefs=True);self.root=Node('root');self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in VOID:self.stack.append(n)
 def handle_startendtag(self,t,a):self.handle_starttag(t,a);self.handle_endtag(t) if t not in VOID else None
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,s):self.stack[-1].children.append(s)
def find(root,**attrs):return next(n for n in root.walk() if all(n.attrs.get(k)==v for k,v in attrs.items()))
def remove(root,pred):
 for n in list(root.walk()):n.children=[c for c in n.children if not(isinstance(c,Node) and pred(c))]
def absolute(root):
 for n in root.walk():
  for k,v in list(n.attrs.items()):
   if not isinstance(v,str):continue
   if v.startswith('assets/'):n.attrs[k]='/'+v
   elif k=='srcset':n.attrs[k]=re.sub(r'(^|,\s*)assets/',r'\1/assets/',v)
   elif k=='style':n.attrs[k]=v.replace('url(assets/','url(/assets/').replace("url('assets/","url('/assets/")
  if n.attrs.get('target')=='_blank':n.attrs['rel']='noopener noreferrer'
def localize(root,lang,blocked=False):
 blocked=blocked or root.tag in ('script','style','noscript') or 'data-no-i18n' in root.attrs
 if blocked:return
 for k in ['aria-label','title','alt','data-alt']:
  if root.attrs.get(k):root.attrs[k]=tr(root.attrs[k],lang)
 for i,c in enumerate(root.children):
  if isinstance(c,Node):localize(c,lang)
  else:root.children[i]=tr(c,lang)
def link(route,lang):return '/'+lang+'/'+(route+'/' if route else '')
def alternates(route):return '\n'.join(f'<link rel="alternate" hreflang="{l}" href="{BASE+link(route,t)}">' for l,t in [('fr','fr'),('en','en'),('ja','ja'),('x-default','fr')])
def flags(lang,route):
 switch=deepcopy(find(SOURCE,id='language-switcher'));switch.attrs.pop('hidden',None)
 for n in switch.children:
  if not isinstance(n,Node) or 'data-language' not in n.attrs:continue
  target=n.attrs['data-language'];n.tag='a';n.attrs.pop('type',None);n.attrs.pop('aria-pressed',None);n.attrs['href']=link(route,target)
  if target==lang:n.attrs['aria-current']='page'
 return switch.html()
def org():return {'@type':'Organization','@id':BASE+'/#organization','name':'Youthseiko','url':BASE+'/','logo':BASE+'/assets/img/studio-mark.png'}
def metadata(title,desc,lang,route,graph,kind='website',image='/assets/img/og-image.png'):
 url=BASE+link(route,lang);schema={'@context':'https://schema.org','@graph':[org(),*graph]}
 return f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title>
<meta name="description" content="{escape(desc,quote=True)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{url}">{alternates(route)}
<meta property="og:site_name" content="Youthseiko"><meta property="og:title" content="{escape(title,quote=True)}"><meta property="og:description" content="{escape(desc,quote=True)}"><meta property="og:type" content="{kind}"><meta property="og:url" content="{url}"><meta property="og:locale" content="{dict(fr='fr_FR',en='en_GB',ja='ja_JP')[lang]}"><meta property="og:image" content="{BASE+image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(title,quote=True)}"><meta name="twitter:description" content="{escape(desc,quote=True)}"><meta name="twitter:image" content="{BASE+image}"><meta name="theme-color" content="#FFB6D5">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&amp;family=Nunito:wght@400;600;700;800&amp;display=swap" rel="stylesheet"><link rel="icon" href="/favicon.ico"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/assets/css/style.css?v=20261028-3"><link rel="stylesheet" href="/assets/css/i18n.css?v=20261114-1"><link rel="stylesheet" href="/assets/css/acte1-release.css?v=20261112-1"><link rel="stylesheet" href="/assets/css/yuki-launch.css?v=20261029-1"><link rel="stylesheet" href="/assets/css/seo.css?v=20261114-2">
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('<', chr(92)+'u003c')}</script>'''
SOURCE=Tree((ROOT/'index.html').read_text(encoding='utf-8')).root
GAMES=[('mirai','project-mirai','PROJECT MIRAI'),('heart','les-ex-de-lhaut-dela','Les EX de l’haut delà'),('babylone','project-babylone','PROJECT BABYLONE'),('century','project-century','PROJECT CENTURY')]
NOTES=[('bienvenue','un-masque-plusieurs-univers'),('mirai','mirai-le-confort-en-portrait'),('heart','quatre-rencontres-beaucoup-de-repartie')]
NEWS=[('acte1-release','demo-acte-1-microsoft-store'),('yuki-halloween','yuki-desktop-halloween'),('yuki-life','yuki-3d-et-desktop'),('mirai-android','mirai-premiers-tests-android')]
ROUTES=['']+['jeux/'+x[1] for x in GAMES]+['carnet']+['carnet/'+x[1] for x in NOTES]+['actualites']+['actualites/'+x[1] for x in NEWS]+['presse','pages']
TITLES={}
PUBLIC={}
for key,slug,name in GAMES:
 body=deepcopy(next(n for n in find(SOURCE,id='modal-'+key).walk() if n.attrs.get('class')=='modal-body'));body.tag='div';body.attrs={'class':'seo-content project--'+key};remove(body,lambda n:'data-close' in n.attrs or 'data-secret-control' in n.attrs)
 for n in body.walk():
  if n.tag=='button' and 'data-lightbox' in n.attrs:
   n.tag='a';n.attrs['href']='/'+n.attrs.pop('data-lightbox').lstrip('/');n.attrs.pop('type',None)
 heading=next(n for n in body.walk() if n.tag=='h2');heading.tag='h1'
 for n in body.walk():
  if n.tag=='h3':n.tag='h2'
 lead=[n for n in body.children if isinstance(n,Node) and (n.tag=='h1' or n.attrs.get('class') in ('modal-status','modal-sub'))]
 body.children=lead+[n for n in body.children if not any(n is h for h in lead)]
 PUBLIC['jeux/'+slug]=body
for prefix,items in [('carnet',NOTES),('actualites',NEWS)]:
 for key,slug in items:
  body=deepcopy(find(SOURCE,id=('note-yu-' if prefix=='carnet' else 'news-')+key));body.attrs['class']='seo-content';remove(body,lambda n:n.attrs.get('class')=='seo-detail-link')
  h=next(n for n in body.walk() if n.tag in ('h3','h4'));h.tag='h1'
  # The homepage heading links to this page; the page heading itself is plain text.
  if len(h.children)==1 and isinstance(h.children[0],Node) and h.children[0].tag=='a':h.children=h.children[0].children
  PUBLIC[prefix+'/'+slug]=body

def title_for(route,lang):
 if route in PUBLIC:
  h=next(n for n in PUBLIC[route].walk() if n.tag=='h1');name=norm(localized(h,lang).text())
  if route=='jeux/les-ex-de-lhaut-dela':name+=' — '+{'fr':'Visual novel romance · Démo gratuite PC Windows','en':'Romance visual novel · Free Windows PC demo','ja':'恋愛ビジュアルノベル · Windows PC無料体験版'}[lang]
  elif route=='jeux/project-mirai':name+=' — '+{'fr':'Shooter arcade · Prototype Android','en':'Arcade shooter · Android prototype','ja':'アーケードシューティング · Androidプロトタイプ'}[lang]
  if route in ('jeux/project-babylone','jeux/project-century'):
   tags=[norm(n.text()) for n in localized(PUBLIC[route],lang).walk() if n.tag=='li']
   if tags:name+=' — '+' · '.join(tags[:2])
  return name+' | Youthseiko'
 return {'carnet':tr('Le Carnet de YU',lang),'actualites':tr('Actualités',lang),'presse':tr('Presse et médias',lang),'pages':tr('Toutes les pages',lang)}.get(route,'Youthseiko')+' | Youthseiko'
def localized(node,lang):
 n=deepcopy(node);localize(n,lang);return n

def adapt_body(body,lang):
 body=localized(body,lang);absolute(body)
 for n in body.walk():
  cls=n.attrs.get('class','').split();n.attrs['class']=' '.join(c for c in cls if c!='reveal') if cls else n.attrs.get('class','')
  href=n.attrs.get('href','')
  if 'data-seo-key' in n.attrs:n.attrs['href']=link(n.attrs['data-seo-key'],lang)
  elif href.startswith('#project-'):
   key=href.removeprefix('#project-');slug=next((s for k,s,_ in GAMES if k==key),None)
   n.attrs['href']=link('jeux/'+slug,lang) if slug else link('',lang)+href
  elif href.startswith('#'):n.attrs['href']=link('',lang)+href
 return body

def list_html(routes,lang):return '<ul class="seo-list">'+''.join(f'<li><a href="{link(r,lang)}">{escape(title_for(r,lang).removesuffix(" | Youthseiko"))}</a></li>' for r in routes)+'</ul>'
PRESS={
 'fr':('Logos, visuels publics et liens officiels pour découvrir les jeux indépendants de Youthseiko.','Quatre projets, une première salve : W1 · 2026–2027. La démo ACTE 1 de Les EX de l’haut delà est disponible sur Microsoft Store pour PC Windows. MIRAI est un prototype Android en test ; BABYLONE et CENTURY sont en conception.','Le dossier contient uniquement des éléments déjà publics : logos du studio, illustrations de MIRAI et des EX, cinq captures de gameplay (0.2.13-dev), miniature officielle du trailer et fiches de présentation FR/EN/JA.','Crédits : Youthseiko. Pour les interviews et les conditions de réutilisation des visuels, contactez le studio.'),
 'en':('Logos, public artwork and official links to discover Youthseiko’s independent games.','Four projects, one first wave: W1 · 2026–2027. The ACT 1 demo of Les EX de l’haut delà is available on Microsoft Store for Windows PC. MIRAI is an Android prototype in testing; BABYLONE and CENTURY are in concept development.','The kit contains public materials only: studio logos, MIRAI and Les EX artwork, five gameplay screenshots (0.2.13-dev), the official trailer thumbnail and FR/EN/JA fact sheets.','Credits: Youthseiko. Contact the studio for interviews and terms for reusing the artwork.'),
 'ja':('Youthseikoのインディーゲームを紹介する、ロゴ、公開ビジュアル、公式リンク。','4つのプロジェクトによる第一弾、W1 · 2026–2027。「Les EX de l’haut delà」のACTE 1体験版は、Windows PC向けにMicrosoft Storeで配信中。MIRAIはAndroidでテスト中のプロトタイプ、BABYLONEとCENTURYは構想段階です。','キットには公開済みの素材のみを収録しています。スタジオロゴ、MIRAIとLes EXのイラスト、ゲーム画面5点（0.2.13-dev）、公式トレーラーのサムネイル、仏・英・日の紹介資料が含まれます。','クレジット：Youthseiko。取材や画像の再利用条件については、スタジオにお問い合わせください。')}

def page(route,lang):
 title=title_for(route,lang);url=BASE+link(route,lang);graph=[];image='/assets/img/og-image.png';kind='website'
 game=next((key for key,slug,_ in GAMES if route=='jeux/'+slug),'')
 theme='<link rel="stylesheet" href="/assets/css/game-pages.css?v=20261114-1">' if game else ''
 if game=='heart':theme+='<script src="/assets/js/heart-page.js?v=20261114-1" defer></script>'
 body_class='seo-page'+(' game-page' if game else '')+(' ex-page' if game=='heart' else '')
 if route in PUBLIC:
  body=adapt_body(PUBLIC[route],lang)
  paragraphs=[norm(n.text()) for n in body.walk() if n.tag=='p' and len(norm(n.text()))>70]
  desc=(paragraphs[0] if paragraphs else title)[:180]
  pic=next((n.attrs['src'] for n in body.walk() if n.tag=='img' and n.attrs.get('src')),None)
  if pic:image=pic
  if game=='heart':image='/assets/media/les-ex/screens/heroines-1600.webp'
  h=norm(next(n for n in body.walk() if n.tag=='h1').text())
  if route.startswith('jeux/'):
   schema={'@type':'VideoGame','@id':url+'#game','name':h,'url':url,'description':desc,'inLanguage':lang,'publisher':{'@id':BASE+'/#organization'},'genre':[norm(n.text()) for n in body.walk() if n.tag=='li']}
   if route.endswith('les-ex-de-lhaut-dela'):schema.update(operatingSystem='Windows',gamePlatform='PC',offers={'@type':'Offer','price':'0','priceCurrency':'EUR','url':'https://apps.microsoft.com/detail/9NKH7Z996H68'},sameAs=['https://apps.microsoft.com/detail/9NKH7Z996H68'])
   if route.endswith('project-mirai'):schema.update(operatingSystem='Android',creativeWorkStatus='In development')
   if route.endswith(('project-babylone','project-century')):schema['creativeWorkStatus']='In development'
   graph.append(schema)
  else:
   kind='article';time=next((n.attrs.get('datetime') for n in body.walk() if n.tag=='time'),None)
   schema={'@type':'BlogPosting' if route.startswith('carnet/') else 'NewsArticle','headline':h,'description':desc,'url':url,'mainEntityOfPage':url,'inLanguage':lang,'image':BASE+image,'publisher':{'@id':BASE+'/#organization'},'author':{'@type':'Person','name':'YU'} if route.startswith('carnet/') else {'@id':BASE+'/#organization'}}
   if time:schema['datePublished']=time
   graph.append(schema)
  content=body.html()
  if game=='heart':
   from heart_page import render as render_heart
   content=render_heart(lang)
 elif route=='presse':
  desc=PRESS[lang][0]
  content=f'<h1>{escape(tr("Presse et médias",lang))}</h1>'+''.join('<p>'+escape(t)+'</p>' for t in PRESS[lang])+f'<p><a class="btn btn-primary" href="/assets/press/youthseiko-press-kit.zip" download>{escape(tr("Télécharger le dossier de presse",lang))}</a></p><p><a href="mailto:youthseiko@gmail.com">youthseiko@gmail.com</a></p>'+list_html(['jeux/'+s for _,s,_ in GAMES],lang)+'<p><a href="https://youtu.be/mtY2pzi8atQ" target="_blank" rel="noopener noreferrer">YouTube · Les EX de l’haut delà</a></p>'
  labels={'fr':['Logo du studio Youthseiko','Illustration publique de MIRAI','Illustration publique des EX de l’haut delà'],'en':['Youthseiko studio logo','Public MIRAI artwork','Public Les EX de l’haut delà artwork'],'ja':['Youthseikoスタジオのロゴ','MIRAIの公開イラスト','Les EX de l’haut delàの公開イラスト']}[lang]
  gallery='<div class="seo-press-grid">'+''.join(f'<figure><a href="/assets/img/{name}" download><img src="/assets/img/{name}" alt="{escape(label,quote=True)}" width="600" height="400" loading="lazy"><figcaption>{escape(label)}</figcaption></a></figure>' for name,label in zip(['studio-mark.png','project-mirai-1200.webp','project-heart-1200.webp'],labels))+'</div>'
  content+=gallery
 else:
  routes=([r for r in PUBLIC if r.startswith(route+'/')] if route in ('carnet','actualites') else [r for r in ROUTES if r and r!='pages'])
  desc=title.removesuffix(' | Youthseiko')+' — Youthseiko · W1 · 2026–2027'
  content='<h1>'+escape(title.removesuffix(' | Youthseiko'))+'</h1>'+list_html(routes,lang)
 graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':tr('Accueil',lang),'item':BASE+link('',lang)},{'@type':'ListItem','position':2,'name':title.removesuffix(' | Youthseiko'),'item':url}]})
 nav=''.join(f'<a href="{href}">{escape(label)}</a>' for href,label in [(link('',lang)+'#projets',tr('Jeux',lang)),(link('carnet',lang),tr('Le Carnet de YU',lang)),(link('presse',lang),tr('Presse et médias',lang))])
 return f'''<!doctype html><html lang="{lang}" data-static-language><head>{metadata(title,desc,lang,route,graph,kind,image)}{theme}</head><body class="{body_class}" data-game="{game}"><a class="skip-link" href="#content">{escape(tr('Aller au contenu',lang))}</a><header class="site-header"><div class="nav-inner"><a class="brand" href="{link('',lang)}"><span class="brand-mark" aria-hidden="true">✦</span> YOUTHSEIKO</a><nav class="seo-nav">{nav}</nav>{flags(lang,route)}</div></header><main id="content" class="seo-main"><nav aria-label="{escape(tr('Accueil',lang))}"><a href="{link('',lang)}">{escape(tr('Accueil',lang))}</a> / <span>W1 · 2026–2027</span></nav>{content}</main><footer class="site-footer"><div class="container"><a href="{link('pages',lang)}">{escape(tr('Toutes les pages',lang))}</a> · <a href="mailto:youthseiko@gmail.com">youthseiko@gmail.com</a><p>© 2026 Youthseiko</p></div></footer><p id="language-status" class="language-status" data-no-i18n></p><script src="/assets/js/seo-page.js?v=20261114-1" defer></script><script src="/assets/js/acte1-release.js?v=20261112-1" defer></script><script src="/assets/js/yuki-launch.js?v=20261029-1" defer></script><script src="/assets/js/i18n-catalogue.js?v=20261114-2" defer></script><script src="/assets/js/i18n.js?v=20261114-1" defer></script></body></html>'''

def homepage(lang):
 doc=deepcopy(SOURCE);absolute(doc);localize(doc,lang);html=find(doc,lang='fr');html.attrs.update(lang=lang,**{'data-static-language':'','data-home':'true'})
 head=next(n for n in doc.walk() if n.tag=='head')
 for n in head.walk():
  if n.tag=='link' and n.attrs.get('rel')=='canonical':n.attrs['href']=BASE+link('',lang)
  if n.tag=='meta' and n.attrs.get('property')=='og:url':n.attrs['content']=BASE+link('',lang)
  if n.tag=='meta' and n.attrs.get('property')=='og:locale':n.attrs['content']={'fr':'fr_FR','en':'en_GB','ja':'ja_JP'}[lang]
  if n.tag=='meta' and n.attrs.get('name',n.attrs.get('property')) in ['description','og:title','og:description','og:image:alt','twitter:title','twitter:description']:n.attrs['content']=tr(n.attrs['content'],lang)
  if n.tag=='script' and n.attrs.get('type')=='application/ld+json':
   data=json.loads(n.text())
   def local_schema(v,key=''):
    if isinstance(v,dict):return {k:local_schema(x,k) for k,x in v.items()}
    if isinstance(v,list):return [local_schema(x,key) for x in v]
    if key=='inLanguage':return lang
    return tr(v,lang) if isinstance(v,str) and key in ('description','slogan','knowsAbout') else v
   n.children=[json.dumps(local_schema(data),ensure_ascii=False)]
 old=find(doc,id='language-switcher');new=Tree(flags(lang,'')).root.children[0]
 for n in doc.walk():n.children=[new if c is old else c for c in n.children]
 for n in doc.walk():
  if 'data-seo-key' in n.attrs:n.attrs['href']=link(n.attrs['data-seo-key'],lang)
 return '<!DOCTYPE html>\n'+doc.html()

def build():
 out={}
 for lang in LANGS:
  for route in ROUTES:out[link(route,lang).strip('/')+'/index.html']=(homepage(lang) if not route else page(route,lang)).encode('utf-8')
 urls=[BASE+link(r,l) for l in LANGS for r in ROUTES]
 out['sitemap.xml']=('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc><lastmod>2026-11-14</lastmod></url>\n' for u in urls)+'</urlset>\n').encode()
 kit=io.BytesIO()
 with zipfile.ZipFile(kit,'w',zipfile.ZIP_DEFLATED) as archive:
  selected=['assets/img/studio-mark.svg','assets/img/studio-mark.png','assets/img/og-image.png','assets/img/project-mirai-1200.webp','assets/img/project-heart-1200.webp','assets/img/acte1-trailer.jpg','assets/media/les-ex/screens/heroines.png','assets/media/les-ex/screens/hana.png','assets/media/les-ex/screens/rei.png','assets/media/les-ex/screens/boutique.png','assets/media/les-ex/screens/mystere.png']
  for source in selected:
   info=zipfile.ZipInfo(Path(source).name,date_time=(2026,11,14,0,0,0));payload=(ROOT/source).read_bytes()
   if source.endswith('.svg'):payload=payload.replace(b'\r\n',b'\n')
   archive.writestr(info,payload)
  for lang in LANGS:
   text='Youthseiko — W1 · 2026–2027\n\n'+'\n\n'.join(PRESS[lang])+'\n\n'+ '\n'.join(BASE+link('jeux/'+s,lang) for _,s,_ in GAMES)+'\nhttps://apps.microsoft.com/detail/9NKH7Z996H68\nhttps://youtu.be/mtY2pzi8atQ\nContact: youthseiko@gmail.com\n'
   archive.writestr(zipfile.ZipInfo('facts-'+lang+'.txt',date_time=(2026,11,14,0,0,0)),text.encode('utf-8'))
 out['assets/press/youthseiko-press-kit.zip']=kit.getvalue()
 return out
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args();outputs=build();stale=[]
 for name,data in outputs.items():
  dest=ROOT/name
  if args.check:
   actual=dest.read_bytes() if dest.exists() else None
   if actual is not None and dest.suffix in ('.html','.xml'):actual=actual.replace(b'\r\n',b'\n')
   if actual!=data:stale.append(name)
  else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 if stale:raise SystemExit('Regenerate SEO pages: '+', '.join(stale))
 print(f'{len(LANGS)*len(ROUTES)} static pages, sitemap and press kit '+('current' if args.check else 'generated'))
