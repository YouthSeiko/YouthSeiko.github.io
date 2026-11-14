"""Notify IndexNow of deployed public canonical URLs. No GitHub credentials required."""
import argparse,json,re,urllib.request,urllib.parse,xml.etree.ElementTree as ET
from pathlib import Path
BASE='https://youthseiko.github.io/'
def fetch(url):
 with urllib.request.urlopen(url,timeout=35) as r:return r.read()
def submit(dry_run=False):
 config=json.loads(fetch(BASE+'indexnow.json'))
 if config['host']!='youthseiko.github.io' or config['endpoint']!='https://api.indexnow.org/indexnow':raise ValueError('Unexpected IndexNow configuration')
 key_url=config['keyLocation'];parsed=urllib.parse.urlsplit(key_url)
 if parsed.scheme!='https' or parsed.netloc!=config['host'] or not parsed.path.endswith('.txt') or '/' in parsed.path[1:]:raise ValueError('Ownership key must be at the site root')
 key=fetch(key_url).decode('utf-8').strip()
 if not re.fullmatch(r'[a-zA-Z0-9-]{8,128}',key):raise ValueError('Invalid ownership key')
 urls=[n.text for n in ET.fromstring(fetch(BASE+'sitemap.xml')).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
 if not urls or len(urls)>10000:raise ValueError('Invalid URL count')
 for url in urls:
  u=urllib.parse.urlsplit(url)
  if u.scheme!='https' or u.netloc!=config['host'] or u.query or u.fragment:raise ValueError('Only public canonical site URLs may be submitted')
 if dry_run:
  print('Public ownership key and sitemap verified:',len(urls),'URLs; no submission');return
 payload=json.dumps({'host':config['host'],'key':key,'keyLocation':key_url,'urlList':urls}).encode()
 req=urllib.request.Request(config['endpoint'],payload,{'Content-Type':'application/json; charset=utf-8'},method='POST')
 with urllib.request.urlopen(req,timeout=60) as r:
  if r.status not in (200,202):raise RuntimeError('Unexpected IndexNow status '+str(r.status))
  print(json.dumps({'urls':len(urls),'http_status':r.status,'meaning':'received' if r.status==200 else 'received, key validation pending','indexed':False}))
if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--dry-run',action='store_true');args=parser.parse_args();submit(args.dry_run)
