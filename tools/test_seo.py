"""Check generated SEO pages and public metadata without a browser."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,unittest,xml.etree.ElementTree as ET,zipfile
ROOT=Path(__file__).resolve().parents[1]
BASE='https://youthseiko.github.io'
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__();self.tags=[];self.titles=[];self.h1=0;self.in_title=False;self.in_schema=False;self.schemas=[];self.feed(path.read_text(encoding='utf-8'))
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);self.tags.append((tag,a));self.h1+=tag=='h1';self.in_title=tag=='title' or self.in_title
  if tag=='script' and a.get('type')=='application/ld+json':self.in_schema=True
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='script':self.in_schema=False
 def handle_data(self,data):
  if self.in_title:self.titles.append(data)
  if self.in_schema:self.schemas.extend(json.loads(data).get('@graph',[]))
class SeoTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
 def test_unique_pages_have_matching_canonical_and_reciprocal_languages(self):
  self.assertEqual(len(self.urls),51);titles=set()
  for url in self.urls:
   route=urlsplit(url).path;p=Page(ROOT/route.lstrip('/')/'index.html');lang=route.split('/')[1]
   self.assertEqual(p.h1,1,url)
   canonical=[a['href'] for t,a in p.tags if t=='link' and a.get('rel')=='canonical'];self.assertEqual(canonical,[url])
   desc=[a['content'] for t,a in p.tags if t=='meta' and a.get('name')=='description'];self.assertEqual(len(desc),1);self.assertGreater(len(desc[0]),15)
   title=''.join(p.titles);self.assertNotIn((lang,title),titles,url);titles.add((lang,title))
   alternate={a['hreflang']:a['href'] for t,a in p.tags if t=='link' and a.get('rel')=='alternate'}
   self.assertEqual(set(alternate),{'fr','en','ja','x-default'})
   for l in ['fr','en','ja']:
    expected=BASE+route.replace('/'+lang+'/', '/'+l+'/',1);self.assertEqual(alternate[l],expected);self.assertIn(expected,self.urls)
 def test_all_internal_assets_links_and_external_rel_are_valid(self):
  for url in self.urls:
   file=ROOT/urlsplit(url).path.lstrip('/')/'index.html';p=Page(file)
   for tag,a in p.tags:
    if a.get('target')=='_blank':self.assertTrue({'noopener','noreferrer'}<=set(a.get('rel','').split()))
    for attr in ['src','href','poster','data-poster']:
     value=a.get(attr,'')
     if not value or value.startswith(('#','https:','http:','mailto:','data:')):continue
     path=unquote(urlsplit(value).path);target=ROOT/path.lstrip('/') if path.startswith('/') else file.parent/path
     self.assertTrue(target.exists(),f'{file}: {attr}={value}')
 def test_structured_data_is_accurate_without_invented_ratings(self):
  for lang in ['fr','en','ja']:
   p=Page(ROOT/lang/'jeux/les-ex-de-lhaut-dela/index.html');game=next(g for g in p.schemas if g['@type']=='VideoGame')
   self.assertFalse(any('modal-body' in a.get('class','').split() for _,a in p.tags));self.assertEqual(sum('data-ex-lightbox' in a for t,a in p.tags),5);self.assertEqual(game['offers']['price'],'0');self.assertEqual(game['gamePlatform'],'PC');self.assertNotIn('aggregateRating',game)
   for slug in ['project-babylone','project-century']:
    page=Page(ROOT/lang/'jeux'/slug/'index.html');game=next(g for g in page.schemas if g['@type']=='VideoGame');self.assertNotIn('offers',game);self.assertNotIn('operatingSystem',game)
 def test_press_kit_has_public_assets_and_three_fact_sheets_only(self):
  with zipfile.ZipFile(ROOT/'assets/press/youthseiko-press-kit.zip') as z:
   self.assertEqual(len(z.namelist()),14);self.assertTrue({'facts-fr.txt','facts-en.txt','facts-ja.txt'}<=set(z.namelist()));self.assertTrue(all('/' not in n for n in z.namelist()))
 def test_itch_demo_and_store_are_available_in_three_languages(self):
  itch='https://youthseiko.itch.io/les-ex-de-lhaut-del-fr-demo-acte1'
  for lang,label in [('fr','Télécharger sur itch.io'),('en','Download on itch.io'),('ja','itch.ioでダウンロード')]:
   for route in ['', 'actualites/demo-itch-io', 'jeux/les-ex-de-lhaut-dela']:
    file=ROOT/lang/route/'index.html';page=Page(file)
    links=[a.get('href','') for tag,a in page.tags if tag=='a']
    self.assertIn(itch,links)
    self.assertTrue(any(h.startswith('https://apps.microsoft.com/detail/9NKH7Z996H68') for h in links))
    self.assertIn(label,file.read_text(encoding='utf-8'))
   article=Page(ROOT/lang/'actualites/demo-itch-io/index.html')
   self.assertTrue(any(s.get('datePublished')=='2026-11-20' for s in article.schemas))
if __name__=='__main__':unittest.main(verbosity=2)
