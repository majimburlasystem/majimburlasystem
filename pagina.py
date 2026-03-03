import hashlib
import hmac
import json
import base64
import mimetypes
import os
import secrets
import sqlite3
import subprocess
import time
import urllib.error
import urllib.request
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

try:
  import psycopg
except Exception:
  psycopg = None

try:
  import stripe
except Exception:
  stripe = None

HOST = os.getenv('HOST', '127.0.0.1').strip() or '127.0.0.1'
PORT = int(os.getenv('PORT', os.getenv('APP_PORT', '9898')))
ACTIVE_PORT = PORT
BASE = Path(__file__).resolve().parent
DB = BASE / 'clientes.db'
CFG = BASE / 'oauth_config.json'
PUBLIC_BASE_URL = os.getenv('PUBLIC_BASE_URL', '').strip().rstrip('/')
DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
USE_POSTGRES = bool(DATABASE_URL)
DB_INTEGRITY_ERROR = psycopg.IntegrityError if (USE_POSTGRES and psycopg is not None) else sqlite3.IntegrityError
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '').strip()
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '').strip()
STRIPE_MAX_UNIT_AMOUNT = 99_999_999  # centavos
ROBLOX_JSON_CACHE_TTL = 90
ROBLOX_JSON_CACHE = {}
ROBLOX_JSON_NEG_TTL = 8
ROBLOX_THUMB_BLOCK_SECONDS = 20
ROBLOX_THUMB_BLOCK_UNTIL = 0.0
PNG_PLACEHOLDER_BYTES = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9z7nQAAAAASUVORK5CYII=')

SESSIONS, CAPTCHAS, OTPS, STATES = {}, {}, {}, {}
SESSION_TTL, CAPTCHA_TTL, OTP_TTL, STATE_TTL = 28800, 180, 300, 300

OAUTH = {
  'google': {'auth':'https://accounts.google.com/o/oauth2/v2/auth','token':'https://oauth2.googleapis.com/token','user':'https://openidconnect.googleapis.com/v1/userinfo','scope':'openid email profile'},
  'discord': {'auth':'https://discord.com/oauth2/authorize','token':'https://discord.com/api/oauth2/token','user':'https://discord.com/api/users/@me','scope':'identify email'},
  'facebook': {'auth':'https://www.facebook.com/v20.0/dialog/oauth','token':'https://graph.facebook.com/v20.0/oauth/access_token','user':'https://graph.facebook.com/me?fields=id,name,email','scope':'email,public_profile'},
}

def read_file(name):
  p = BASE / name
  return p.read_text(encoding='utf-8') if p.exists() else ''

def db():
  if USE_POSTGRES:
    if psycopg is None:
      raise RuntimeError('DATABASE_URL definido, mas psycopg nao instalado.')
    return psycopg.connect(DATABASE_URL)
  c = sqlite3.connect(DB)
  c.row_factory = sqlite3.Row
  return c

def q(sql):
  return sql.replace('?', '%s') if USE_POSTGRES else sql

def q_exec(conn, sql, params=()):
  return conn.execute(q(sql), params)

def hpw(p,s): return hashlib.pbkdf2_hmac('sha256', p.encode(), bytes.fromhex(s), 120000).hex()
def ck(h): j=cookies.SimpleCookie(); j.load(h or ''); return j['session_id'].value if 'session_id' in j else None

def init_db():
  with db() as c:
    if USE_POSTGRES:
      q_exec(c, """CREATE TABLE IF NOT EXISTS clients(
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        oauth_provider TEXT,
        oauth_subject TEXT
      )""")
      cols = {row[0] for row in q_exec(c, "SELECT column_name FROM information_schema.columns WHERE table_name='clients'").fetchall()}
      if 'avatar_user_id' not in cols:
        q_exec(c, "ALTER TABLE clients ADD COLUMN avatar_user_id BIGINT")
      if 'gender' not in cols:
        q_exec(c, "ALTER TABLE clients ADD COLUMN gender TEXT DEFAULT 'masculino'")
    else:
      q_exec(c, """CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE,phone TEXT UNIQUE,password_hash TEXT NOT NULL,salt TEXT NOT NULL,created_at INTEGER NOT NULL,oauth_provider TEXT,oauth_subject TEXT)""")
      cols = {row[1] for row in q_exec(c, "PRAGMA table_info(clients)").fetchall()}
      if 'avatar_user_id' not in cols:
        q_exec(c, "ALTER TABLE clients ADD COLUMN avatar_user_id INTEGER")
      if 'gender' not in cols:
        q_exec(c, "ALTER TABLE clients ADD COLUMN gender TEXT DEFAULT 'masculino'")
    q_exec(c, "UPDATE clients SET gender='masculino' WHERE gender IS NULL OR TRIM(gender)=''")
    if USE_POSTGRES:
      q_exec(c, """CREATE TABLE IF NOT EXISTS orders(
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        items_json TEXT NOT NULL,
        total_amount BIGINT NOT NULL,
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_ref TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )""")
    else:
      q_exec(c, """CREATE TABLE IF NOT EXISTS orders(
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        items_json TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_ref TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )""")
    c.commit()

def stripe_ready():
  return bool(stripe is not None and STRIPE_SECRET_KEY)

def stripe_setup():
  if not stripe_ready():
    return False
  stripe.api_key = STRIPE_SECRET_KEY
  return True

def create_order(email, items, total_amount, provider='stripe'):
  now = int(time.time())
  oid = secrets.token_urlsafe(12)
  payload = json.dumps(items, ensure_ascii=False)
  with db() as c:
    q_exec(c, "INSERT INTO orders(id,email,items_json,total_amount,status,provider,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)", (oid, email, payload, int(total_amount), 'pending', provider, now, now))
    c.commit()
  return oid

def set_order_status(order_id, status, provider_ref=None):
  now = int(time.time())
  with db() as c:
    if provider_ref:
      q_exec(c, "UPDATE orders SET status=?,provider_ref=?,updated_at=? WHERE id=?", (status, provider_ref, now, order_id))
    else:
      q_exec(c, "UPDATE orders SET status=?,updated_at=? WHERE id=?", (status, now, order_id))
    c.commit()

def order_by_id(order_id):
  with db() as c:
    r = q_exec(c, "SELECT id,email,total_amount,status,provider,provider_ref,created_at,updated_at FROM orders WHERE id=?", (order_id,)).fetchone()
  if not r:
    return None
  return {'id':r[0], 'email':r[1], 'total_amount':int(r[2]), 'status':r[3], 'provider':r[4], 'provider_ref':r[5], 'created_at':int(r[6]), 'updated_at':int(r[7])}

AVATAR_POOL_M = [1,2,3,4,5,6,7,8,9,10,11,12,261,496,781,1024,1560,2048,3001,4096,7777,9001,12345]
AVATAR_POOL_F = [14,15,16,17,18,19,20,21,22,23,24,25,393,934,2456,5000,10000,11111,13555,15555]
ACCOUNT_USERS = [1,2,3,4,5,6,7,8,9,10,11,12,261,393,496,781,934,1024,1560,2048,2456,3001,4096,5000,7777,9001,10000,11111,12345,15555]

def catalog_map():
  out = {
    '1778004652': {'name':'Comando Ultra', 'price':999999999, 'quote_only':True},
    '48039287': {'name':'Fedora Sao Patricio', 'price':66999},
    '99641902': {'name':'NINJABART122', 'price':34999999, 'quote_only':True},
    '17402911590': {'name':'Dragon Fruit', 'price':120},
    '18915829198': {'name':'SHADOW DRAGON', 'price':500},
    '16613992677': {'name':'BEST DRAGON', 'price':359},
    '12357436568': {'name':'FROST DRAGON', 'price':500},
    'blox-fruit-accounts': {'name':'CONTAS BLOX FRUIT', 'price':10},
  }
  for i, uid in enumerate(ACCOUNT_USERS):
    out[f'bf-{uid}'] = {'name':f'Conta Max Blox Fruits #{i+1}', 'price':10+((i%4)*2)}
  return out

def asset_local_fallback(asset_id):
  p = BASE / 'imagens' / f'{asset_id}.png'
  return p if p.exists() else None

def default_thumb_fallback():
  # Usa imagens locais ja presentes no projeto como placeholder universal.
  for name in ('15505417413.png', '48039287.png', '17402911590.png'):
    p = BASE / 'imagens' / name
    if p.exists():
      return p
  return None

def norm_gender(v):
  x = str(v or '').strip().lower()
  return 'feminino' if x == 'feminino' else 'masculino'

def avatar_for_email(email, gender='masculino'):
  pool = AVATAR_POOL_F if norm_gender(gender) == 'feminino' else AVATAR_POOL_M
  hv = int(hashlib.sha256(email.encode('utf-8')).hexdigest()[:8], 16)
  return pool[hv % len(pool)]

def ensure_avatar(email, gender='masculino'):
  em = email.strip().lower()
  with db() as c:
    row = q_exec(c, "SELECT avatar_user_id FROM clients WHERE email=?", (em,)).fetchone()
    if not row:
      return 1
    if row[0]:
      return int(row[0])
    aid = avatar_for_email(em, gender)
    q_exec(c, "UPDATE clients SET avatar_user_id=? WHERE email=?", (aid, em))
    c.commit()
    return aid

def mk_user(email,pw,gender='masculino'):
  em = email.strip().lower()
  g = norm_gender(gender)
  aid = avatar_for_email(em, g)
  s=secrets.token_hex(16)
  with db() as c:
    q_exec(c, 'INSERT INTO clients(email,password_hash,salt,created_at,avatar_user_id,gender) VALUES(?,?,?,?,?,?)',(em, hpw(pw,s), s, int(time.time()), aid, g))
    c.commit()

def ok_user(email,pw):
  with db() as c: r=q_exec(c, 'SELECT password_hash,salt FROM clients WHERE email=?',(email.strip().lower(),)).fetchone()
  return bool(r and hmac.compare_digest(r[0], hpw(pw,r[1])))

def phone_user(phone):
  e='phone_'+''.join(ch for ch in phone if ch.isdigit())+'@phone.local'
  g = 'masculino'
  aid = avatar_for_email(e, g)
  with db() as c:
    r=q_exec(c, 'SELECT email FROM clients WHERE phone=?',(phone,)).fetchone()
    if r: return r[0]
    s=secrets.token_hex(16)
    q_exec(c, 'INSERT INTO clients(email,phone,password_hash,salt,created_at,avatar_user_id,gender) VALUES(?,?,?,?,?,?,?)',(e,phone,hpw(secrets.token_urlsafe(10),s),s,int(time.time()),aid,g))
    c.commit()
  return e

def issue(email):
  sid=secrets.token_urlsafe(24)
  SESSIONS[sid]=(email,time.time()+SESSION_TTL)
  return sid

def me(headers):
  sid=ck(headers.get('Cookie',''))
  row=SESSIONS.get(sid) if sid else None
  if not row: return None
  if row[1] < time.time(): SESSIONS.pop(sid,None); return None
  return row[0]

def captcha():
  a=secrets.randbelow(9)+1; b=secrets.randbelow(9)+1
  cid=secrets.token_urlsafe(8)
  CAPTCHAS[cid]=(str(a+b),time.time()+CAPTCHA_TTL)
  return cid, f"{a} + {b} = ?"

def cap_ok(cid,ans):
  r=CAPTCHAS.pop(cid,None)
  return bool(r and r[1]>=time.time() and str(ans).strip()==r[0])

def cfg_template():
  if CFG.exists(): return
  CFG.write_text(json.dumps({'google':{'client_id':'','client_secret':''},'discord':{'client_id':'','client_secret':''},'facebook':{'client_id':'','client_secret':''}},indent=2),encoding='utf-8')

def cfg_load():
  d={}
  if CFG.exists():
    try: d=json.loads(CFG.read_text(encoding='utf-8'))
    except Exception: d={}
  out={}
  for p in OAUTH:
    pd=d.get(p,{}) if isinstance(d,dict) else {}
    out[p]={'id':os.getenv(p.upper()+'_CLIENT_ID','').strip() or str(pd.get('client_id','')).strip(),'sec':os.getenv(p.upper()+'_CLIENT_SECRET','').strip() or str(pd.get('client_secret','')).strip()}
  return out

def app_base_url():
  if PUBLIC_BASE_URL:
    return PUBLIC_BASE_URL
  railway_domain = os.getenv('RAILWAY_PUBLIC_DOMAIN', '').strip()
  if railway_domain:
    return f'https://{railway_domain}'
  return f'http://{HOST}:{ACTIVE_PORT}'

def cb(provider): return f"{app_base_url()}/auth/{provider}/callback"
def oauth_client(p):
  if p not in OAUTH: return None
  c=cfg_load().get(p,{})
  if not c.get('id') or not c.get('sec'): return None
  x=OAUTH[p].copy(); x['id']=c['id']; x['sec']=c['sec']; return x

def oauth_start(p):
  c=oauth_client(p)
  if not c: return None,'OAuth nao configurado'
  st=secrets.token_urlsafe(16); STATES[st]=(p,time.time()+STATE_TTL)
  q={'client_id':c['id'],'redirect_uri':cb(p),'response_type':'code','scope':c['scope'],'state':st}
  return c['auth']+'?'+urlencode(q),None

def json_get(url, headers=None):
  global ROBLOX_THUMB_BLOCK_UNTIL
  now = time.time()
  is_thumb_api = 'thumbnails.roblox.com/' in url
  if is_thumb_api and now < ROBLOX_THUMB_BLOCK_UNTIL:
    return {}
  cached = ROBLOX_JSON_CACHE.get(url)
  if cached and cached[1] > now:
    return cached[0]
  req=urllib.request.Request(url,headers=headers or {'Accept':'application/json','User-Agent':'Mozilla/5.0'})
  backoff = 0.35
  for attempt in range(4):
    try:
      with urllib.request.urlopen(req,timeout=20) as r:
        data = json.loads(r.read().decode())
        ROBLOX_JSON_CACHE[url] = (data, time.time() + ROBLOX_JSON_CACHE_TTL)
        return data
    except urllib.error.HTTPError as e:
      retry_after = 0.0
      try:
        ra = (e.headers or {}).get('Retry-After')
        retry_after = float(ra) if ra is not None else 0.0
      except Exception:
        retry_after = 0.0
      if e.code == 429 and is_thumb_api:
        block_for = max(ROBLOX_THUMB_BLOCK_SECONDS, min(retry_after, 60.0))
        ROBLOX_THUMB_BLOCK_UNTIL = max(ROBLOX_THUMB_BLOCK_UNTIL, time.time() + block_for)
      should_retry = (e.code == 429 or 500 <= int(e.code) <= 599) and attempt < 3
      if should_retry:
        time.sleep(max(backoff, min(retry_after, 5.0)))
        backoff = min(backoff * 2.0, 2.5)
        continue
      print('JSON_GET_HTTP_ERR:', e.code, url, flush=True)
      ROBLOX_JSON_CACHE[url] = ({}, time.time() + ROBLOX_JSON_NEG_TTL)
      return {}
    except Exception as e:
      print('JSON_GET_ERR:', repr(e), url, flush=True)
      ROBLOX_JSON_CACHE[url] = ({}, time.time() + ROBLOX_JSON_NEG_TTL)
      return {}
  return {}

def thumb_json_get(url):
  try:
    return json_get(url)
  except Exception as e:
    print('THUMB_JSON_GET_ERR:', repr(e), url, flush=True)
    return {}

def oauth_token(p,code):
  c=oauth_client(p)
  if not c: return None
  if p=='facebook':
    u=c['token']+'?'+urlencode({'client_id':c['id'],'client_secret':c['sec'],'redirect_uri':cb(p),'code':code})
    return json_get(u).get('access_token')
  form=urlencode({'client_id':c['id'],'client_secret':c['sec'],'grant_type':'authorization_code','code':code,'redirect_uri':cb(p)}).encode()
  req=urllib.request.Request(c['token'],data=form,headers={'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},method='POST')
  with urllib.request.urlopen(req,timeout=20) as r: return json.loads(r.read().decode()).get('access_token')

def oauth_profile(p,t):
  c=oauth_client(p)
  if not c: return None,None
  if p=='facebook': d=json_get(c['user']+'&'+urlencode({'access_token':t}))
  else: d=json_get(c['user'],headers={'Authorization':'Bearer '+t,'Accept':'application/json','User-Agent':'Mozilla/5.0'})
  sub=str(d.get('sub') or d.get('id') or '')
  email=(d.get('email') or '').strip().lower() or f"{p}_{sub}@oauth.local"
  return sub,email

def oauth_user(p,sub,email):
  g = 'masculino'
  aid = avatar_for_email(email, g)
  with db() as c:
    r=q_exec(c, 'SELECT email FROM clients WHERE oauth_provider=? AND oauth_subject=?',(p,sub)).fetchone()
    if r: return r[0]
    e=q_exec(c, 'SELECT email FROM clients WHERE email=?',(email,)).fetchone()
    if e:
      q_exec(c, 'UPDATE clients SET oauth_provider=?,oauth_subject=?,avatar_user_id=COALESCE(avatar_user_id,?),gender=COALESCE(gender,?) WHERE email=?',(p,sub,aid,g,email))
      c.commit()
      return email
    s=secrets.token_hex(16)
    q_exec(c, 'INSERT INTO clients(email,password_hash,salt,created_at,oauth_provider,oauth_subject,avatar_user_id,gender) VALUES(?,?,?,?,?,?,?,?)',(email,hpw(secrets.token_urlsafe(10),s),s,int(time.time()),p,sub,aid,g))
    c.commit()
  return email

def user_profile(email):
  em = email.strip().lower()
  with db() as c:
    row = q_exec(c, "SELECT gender FROM clients WHERE email=?", (em,)).fetchone()
  g = norm_gender((row[0] if row and row[0] else 'masculino'))
  aid = ensure_avatar(em, g)
  return {
    'email': em,
    'gender': g,
    'avatar_user_id': aid,
    'avatar_url': f'/static/roblox/thumb/avatar/{aid}',
  }

def cleanup():
  now=time.time()
  for table in (SESSIONS,CAPTCHAS,OTPS,STATES):
    for k,v in list(table.items()):
      exp=v[1] if isinstance(v,tuple) else None
      if exp and exp<now: table.pop(k,None)

class H(BaseHTTPRequestHandler):
  def j(self,d,s=200,e=None):
    b=json.dumps(d,ensure_ascii=False).encode(); self.send_response(s); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(b))); 
    if e:
      for k,v in e.items(): self.send_header(k,v)
    self.end_headers(); self.wfile.write(b)
  def h(self,x,s=200):
    b=x.encode(); self.send_response(s); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
  def red(self,u,c=None): self.send_response(302); self.send_header('Location',u); c and self.send_header('Set-Cookie',c); self.end_headers()
  def body(self):
    try:n=int(self.headers.get('Content-Length','0'))
    except: n=0
    raw=self.rfile.read(n) if n>0 else b'{}'
    try:return json.loads(raw.decode())
    except:return {}
  def img_proxy(self,url):
    try:
      req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Accept':'image/*,*/*'})
      with urllib.request.urlopen(req,timeout=20) as r: d=r.read(); c=r.headers.get('Content-Type','image/png')
      self.send_response(200); self.send_header('Content-Type',c); self.send_header('Content-Length',str(len(d))); self.send_header('Cache-Control','public, max-age=300'); self.end_headers(); self.wfile.write(d)
      return True
    except Exception as e:
      print('IMG_PROXY_ERR:', url, repr(e), flush=True)
      return False
  def file_out(self, p):
    fp = Path(p)
    if not fp.exists() or not fp.is_file():
      self.send_error(404)
      return
    data = fp.read_bytes()
    ctype = mimetypes.guess_type(str(fp))[0] or 'application/octet-stream'
    self.send_response(200)
    self.send_header('Content-Type', ctype)
    self.send_header('Content-Length', str(len(data)))
    self.send_header('Cache-Control', 'public, max-age=3600')
    self.end_headers()
    self.wfile.write(data)
  def png_placeholder(self):
    d = PNG_PLACEHOLDER_BYTES
    self.send_response(200)
    self.send_header('Content-Type', 'image/png')
    self.send_header('Content-Length', str(len(d)))
    self.send_header('Cache-Control', 'public, max-age=300')
    self.end_headers()
    self.wfile.write(d)
  def do_GET(self):
    cleanup(); p=urlparse(self.path); path=p.path; qs=parse_qs(p.query)
    if path=='/static/app-market.js': return self.h(read_file('app-market.js'))
    if path == '/script.js':
      return self.file_out(BASE / 'script.js')
    if path.startswith('/imagens/'):
      safe = path.lstrip('/').replace('..', '')
      p = BASE / safe
      if p.exists() and p.is_file():
        return self.file_out(p)
      return self.png_placeholder()
    if path.startswith('/static/roblox/thumb/avatar/'):
      uid=path.rsplit('/',1)[-1]
      u = None
      try:
        d=thumb_json_get('https://thumbnails.roblox.com/v1/users/avatar-bust?'+urlencode({'userIds':uid,'size':'420x420','format':'Png','isCircular':'false'}))
        u=(d.get('data') or [{}])[0].get('imageUrl')
      except Exception:
        u = None
      if not u:
        d=thumb_json_get('https://thumbnails.roblox.com/v1/users/avatar-headshot?'+urlencode({'userIds':uid,'size':'420x420','format':'Png','isCircular':'false'}))
        u=(d.get('data') or [{}])[0].get('imageUrl')
      if u and self.img_proxy(u):
        return
      fb = default_thumb_fallback()
      if fb:
        return self.file_out(fb)
      return self.png_placeholder()
    if path.startswith('/static/roblox/thumb/asset/'):
      aid=path.rsplit('/',1)[-1]
      try:
        d=thumb_json_get('https://thumbnails.roblox.com/v1/assets?'+urlencode({'assetIds':aid,'returnPolicy':'PlaceHolder','size':'420x420','format':'Png','isCircular':'false'}))
        u=(d.get('data') or [{}])[0].get('imageUrl')
      except Exception:
        u = None
      if u and self.img_proxy(u):
        return
      fb = asset_local_fallback(aid) or default_thumb_fallback()
      if fb:
        return self.file_out(fb)
      return self.png_placeholder()
    if path.startswith('/static/roblox/thumb/user/'):
      uid=path.rsplit('/',1)[-1]
      d=thumb_json_get('https://thumbnails.roblox.com/v1/users/avatar-headshot?'+urlencode({'userIds':uid,'size':'420x420','format':'Png','isCircular':'false'}))
      u=(d.get('data') or [{}])[0].get('imageUrl')
      if u and self.img_proxy(u):
        return
      fb = default_thumb_fallback()
      if fb:
        return self.file_out(fb)
      return self.png_placeholder()
    if path=='/api/captcha':
      cid,q=captcha(); return self.j({'captcha_id':cid,'question':q})
    if path=='/api/oauth/providers':
      c=cfg_load(); return self.j({'providers':{k:{'configured':bool(c.get(k,{}).get('id') and c.get(k,{}).get('sec')),'callback':cb(k)} for k in OAUTH}})
    if path=='/api/me':
      em = me(self.headers)
      if not em: return self.j({'ok':False,'message':'Nao autenticado'},401)
      return self.j(user_profile(em))
    if path=='/api/version':
      return self.j({'version':'2026-03-03-v3'})
    if path=='/api/payments/health':
      base = app_base_url()
      return self.j({
        'ok': stripe_ready(),
        'provider': 'stripe',
        'public_base_url': base,
        'webhook_url': f'{base}/api/payments/stripe/webhook',
        'stripe_python_installed': bool(stripe is not None),
        'stripe_secret_key_set': bool(STRIPE_SECRET_KEY),
        'stripe_webhook_secret_set': bool(STRIPE_WEBHOOK_SECRET),
      })
    if path=='/api/order/status':
      em = me(self.headers)
      if not em: return self.j({'ok':False,'message':'Nao autenticado'},401)
      oid = (qs.get('order_id') or [''])[0].strip()
      if not oid: return self.j({'ok':False,'message':'order_id obrigatorio'},400)
      o = order_by_id(oid)
      if not o or o['email'] != em: return self.j({'ok':False,'message':'Pedido nao encontrado'},404)
      return self.j({'ok':True, 'order':o})
    if path=='/checkout/success':
      oid = (qs.get('order_id') or [''])[0].strip()
      sid = (qs.get('session_id') or [''])[0].strip()
      if oid and sid and stripe_setup():
        try:
          s = stripe.checkout.Session.retrieve(sid)
          if (s.get('payment_status') == 'paid') and (s.get('metadata') or {}).get('order_id') == oid:
            set_order_status(oid, 'paid', sid)
          else:
            set_order_status(oid, 'pending', sid)
        except Exception:
          set_order_status(oid, 'pending', sid)
      html = "<html><head><meta charset='utf-8'><meta http-equiv='refresh' content='1;url=/'></head><body style='font-family:Segoe UI,Arial;background:#070f1d;color:#e9f6ff;display:grid;place-items:center;height:100vh'><div><h2>Pagamento processado</h2><p>Voltando para o mercado...</p></div></body></html>"
      return self.h(html,200)
    if path=='/checkout/cancel':
      oid = (qs.get('order_id') or [''])[0].strip()
      if oid: set_order_status(oid, 'canceled')
      html = "<html><head><meta charset='utf-8'><meta http-equiv='refresh' content='1;url=/'></head><body style='font-family:Segoe UI,Arial;background:#070f1d;color:#e9f6ff;display:grid;place-items:center;height:100vh'><div><h2>Pagamento cancelado</h2><p>Voltando para o mercado...</p></div></body></html>"
      return self.h(html,200)
    if path.startswith('/auth/'):
      parts=[x for x in path.split('/') if x]
      if len(parts)==2:
        u,err=oauth_start(parts[1])
        if err: return self.h('<h3>'+err+'</h3>',400)
        return self.red(u)
      if len(parts)==3 and parts[2]=='callback':
        prv=parts[1]; code=(qs.get('code') or [''])[0]; st=(qs.get('state') or [''])[0]; sr=STATES.pop(st,None)
        if not sr or sr[0]!=prv or not code: return self.h('<h3>OAuth invalido</h3>',400)
        try:
          tk=oauth_token(prv,code); sub,em=oauth_profile(prv,tk)
          if not tk or not sub: return self.h('<h3>Falha OAuth</h3>',400)
          sid=issue(oauth_user(prv,sub,em)); return self.red('/',f'session_id={sid}; Path=/; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Lax')
        except: return self.h('<h3>Erro callback OAuth</h3>',400)
    if path=='/login':
      if me(self.headers): return self.red('/')
      return self.h(read_file('login.html'))
    if path=='/':
      if not me(self.headers): return self.red('/login')
      return self.h(read_file('index.html'))
    self.send_error(404)
  def do_POST(self):
    cleanup(); path=urlparse(self.path).path
    if path=='/api/payments/stripe/webhook':
      if not stripe_setup() or not STRIPE_WEBHOOK_SECRET:
        return self.j({'ok':False,'message':'Webhook Stripe nao configurado'},400)
      try:
        n = int(self.headers.get('Content-Length','0') or '0')
      except Exception:
        n = 0
      raw = self.rfile.read(n) if n > 0 else b''
      sig = self.headers.get('Stripe-Signature','')
      try:
        event = stripe.Webhook.construct_event(raw, sig, STRIPE_WEBHOOK_SECRET)
      except Exception:
        return self.j({'ok':False,'message':'Assinatura invalida'},400)
      et = event.get('type')
      obj = (event.get('data') or {}).get('object') or {}
      md = obj.get('metadata') or {}
      oid = md.get('order_id')
      sid = obj.get('id')
      if oid:
        if et in ('checkout.session.completed', 'checkout.session.async_payment_succeeded'):
          set_order_status(oid, 'paid', sid)
        elif et in ('checkout.session.expired', 'checkout.session.async_payment_failed'):
          set_order_status(oid, 'failed', sid)
      return self.j({'ok':True})
    d=self.body()
    if path=='/api/logout': sid=ck(self.headers.get('Cookie','')); sid and SESSIONS.pop(sid,None); return self.j({'ok':True,'message':'Logout'},e={'Set-Cookie':'session_id=; Path=/; Max-Age=0; HttpOnly'})
    if path=='/api/checkout/create':
      em = me(self.headers)
      if not em: return self.j({'ok':False,'message':'Nao autenticado'},401)
      if not stripe_setup():
        return self.j({'ok':False,'message':'Pagamento nao configurado. Defina STRIPE_SECRET_KEY.'},400)
      raw_items = d.get('items') or []
      if not isinstance(raw_items, list) or not raw_items:
        return self.j({'ok':False,'message':'Carrinho vazio'},400)
      catalog = catalog_map()
      safe_items, total = [], 0
      for x in raw_items:
        if not isinstance(x, dict):
          continue
        iid = str(x.get('id') or '').strip()
        qty = int(x.get('qty') or 0)
        if not iid or qty < 1 or qty > 99:
          continue
        entry = catalog.get(iid)
        if not entry:
          continue
        if entry.get('quote_only'):
          return self.j({'ok':False,'message':f"Item '{entry['name']}' e de cotacao manual e nao pode ir para checkout automatico."},400)
        unit = int(entry['price'])
        safe_items.append({'id':iid, 'name':entry['name'], 'unit_price':unit, 'qty':qty})
        total += unit * qty
      if not safe_items or total <= 0:
        return self.j({'ok':False,'message':'Itens invalidos no carrinho'},400)
      order_id = create_order(em, safe_items, total, 'stripe')
      base = app_base_url()
      line_items = []
      for it in safe_items:
        unit_amount = int(it['unit_price'] * 100)
        if unit_amount > STRIPE_MAX_UNIT_AMOUNT:
          return self.j({'ok':False,'message':f"Item '{it['name']}' excede o limite de valor do Stripe. Remova do carrinho para continuar."},400)
        line_items.append({
          'price_data': {
            'currency': 'brl',
            'product_data': {'name': it['name']},
            'unit_amount': unit_amount,
          },
          'quantity': int(it['qty']),
        })
      try:
        sess = stripe.checkout.Session.create(
          mode='payment',
          success_url=f"{base}/checkout/success?order_id={order_id}&session_id={{CHECKOUT_SESSION_ID}}",
          cancel_url=f"{base}/checkout/cancel?order_id={order_id}",
          line_items=line_items,
          metadata={'order_id': order_id, 'buyer_email': em},
        )
        set_order_status(order_id, 'pending', sess.get('id'))
        return self.j({'ok':True, 'order_id':order_id, 'checkout_url':sess.get('url')})
      except Exception as e:
        err_txt = str(e).strip() or repr(e)
        print('STRIPE_CREATE_ERR:', err_txt, flush=True)
        return self.j({'ok':False,'message':f'Falha ao iniciar pagamento: {err_txt[:240]}'},400)
    if path=='/api/phone/send':
      ph=(d.get('phone') or '').strip()
      if len(ph)<8: return self.j({'ok':False,'message':'Celular invalido'},400)
      if not cap_ok(d.get('captcha_id',''),d.get('captcha_answer','')): return self.j({'ok':False,'message':'Captcha invalido'},400)
      code=str(secrets.randbelow(900000)+100000); OTPS[ph]=(code,time.time()+OTP_TTL); print('OTP para',ph,':',code,flush=True)
      return self.j({'ok':True,'message':'Codigo enviado (demo). Veja o terminal.'})
    if path=='/api/phone/login':
      ph=(d.get('phone') or '').strip(); otp=(d.get('otp') or '').strip(); r=OTPS.pop(ph,None)
      if not cap_ok(d.get('captcha_id',''),d.get('captcha_answer','')): return self.j({'ok':False,'message':'Captcha invalido'},400)
      if not r or r[1]<time.time() or r[0]!=otp: return self.j({'ok':False,'message':'Codigo invalido/expirado'},400)
      sid=issue(phone_user(ph)); return self.j({'ok':True,'message':'Login por celular concluido'},e={'Set-Cookie':f'session_id={sid}; Path=/; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Lax'})
    if path in ('/api/register','/api/login'):
      em=(d.get('email') or '').strip().lower(); pw=d.get('senha') or ''
      gender = norm_gender(d.get('gender'))
      if '@' not in em: return self.j({'ok':False,'message':'Email invalido'},400)
      if len(pw)<4: return self.j({'ok':False,'message':'Senha minima 4'},400)
      if not cap_ok(d.get('captcha_id',''),d.get('captcha_answer','')): return self.j({'ok':False,'message':'Captcha invalido'},400)
      if path=='/api/register':
        try: mk_user(em,pw,gender); return self.j({'ok':True,'message':'Conta criada'})
        except DB_INTEGRITY_ERROR: return self.j({'ok':False,'message':'Email ja cadastrado'},409)
      if not ok_user(em,pw): return self.j({'ok':False,'message':'Credenciais invalidas'},401)
      ensure_avatar(em, gender)
      sid=issue(em); return self.j({'ok':True,'message':'Login realizado'},e={'Set-Cookie':f'session_id={sid}; Path=/; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Lax'})
    self.send_error(404)

def chrome_path():
  for p in [Path('C:/Program Files/Google/Chrome/Application/chrome.exe'),Path('C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'),Path.home()/'AppData/Local/Google/Chrome/Application/chrome.exe']:
    if p.exists(): return p

def open_browser(u):
  c=chrome_path()
  if c: subprocess.Popen([str(c),u])
  else: os.startfile(u)

def run():
  global ACTIVE_PORT
  init_db(); cfg_template()
  srv = None
  chosen = PORT
  for p in range(PORT, PORT + 20):
    try:
      srv = ThreadingHTTPServer((HOST, p), H)
      chosen = p
      break
    except OSError:
      continue
  if not srv:
    raise RuntimeError(f'Nenhuma porta livre entre {PORT} e {PORT+19}.')
  ACTIVE_PORT=chosen
  u=f'{app_base_url()}/login'
  print('Servidor:',u,flush=True)
  print('Callbacks OAuth:',flush=True)
  for p in OAUTH: print(p+': '+cb(p),flush=True)
  print('Webhook Stripe:', f'{app_base_url()}/api/payments/stripe/webhook', flush=True)
  try:
    if HOST in ('127.0.0.1', 'localhost'):
      open_browser(u)
  except Exception as e:
    print('BROWSER_OPEN_ERR:', repr(e), flush=True)
  srv.serve_forever()

if __name__=='__main__': run()
