"""
ZYNC AI Store — Flask Backend with PostgreSQL
"""

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from dotenv import load_dotenv
import os, uuid, hashlib, datetime, json

load_dotenv()

# ── App setup ──────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
app.secret_key = os.getenv('SECRET_KEY', 'zync-ai-store-secret-2024')
app.config.update(
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_HTTPONLY=True,
)
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5173',
    'https://ai-store-1wcn.onrender.com'
])

# ── PostgreSQL setup ────────────────────────────────────────────────────────────
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv('DATABASE_URL', '')
_pg_conn = None

def get_db():
    global _pg_conn
    try:
        if _pg_conn is None or _pg_conn.closed:
            _pg_conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            _pg_conn.autocommit = True
        return _pg_conn
    except Exception as e:
        print(f"⚠️ DB connection error: {e}")
        return None

def init_db():
    conn = get_db()
    if not conn:
        print("⚠️ No DATABASE_URL — using memory storage")
        return False
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    email TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    password TEXT NOT NULL,
                    avatar TEXT,
                    phone TEXT DEFAULT '',
                    cart JSONB DEFAULT '[]',
                    wishlist JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    user_email TEXT NOT NULL,
                    order_id TEXT UNIQUE NOT NULL,
                    items JSONB,
                    address JSONB,
                    payment JSONB,
                    total FLOAT,
                    status TEXT DEFAULT 'confirmed',
                    tracking TEXT,
                    estimated TEXT,
                    date TIMESTAMP DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS reviews (
                    id TEXT PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    user_email TEXT,
                    user_name TEXT,
                    avatar TEXT,
                    rating INTEGER,
                    title TEXT,
                    body TEXT,
                    helpful INTEGER DEFAULT 0,
                    date TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
        print("✅ PostgreSQL connected & tables ready!")
        return True
    except Exception as e:
        print(f"⚠️ DB init error: {e}")
        return False

USE_PG = init_db()

# ── Memory fallback ─────────────────────────────────────────────────────────────
_users   = {}
_orders  = {}
_reviews = {}

# ── Imports ────────────────────────────────────────────────────────────────────
from data.products import products as PRODUCTS
from ml.recommender import (
    get_recommendations, get_personalized_feed,
    get_trending, get_category_picks, search_products, track_event
)

# ── DB helpers ─────────────────────────────────────────────────────────────────

def _get_user(email):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
                if row:
                    u = dict(row)
                    u['cart'] = u.get('cart') or []
                    u['wishlist'] = u.get('wishlist') or []
                    return u
            return None
        except: return _users.get(email)
    return _users.get(email)

def _save_user(user):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE users SET name=%s, avatar=%s, phone=%s, cart=%s, wishlist=%s
                    WHERE email=%s
                """, (user['name'], user.get('avatar',''), user.get('phone',''),
                      json.dumps(user.get('cart',[])), json.dumps(user.get('wishlist',[])),
                      user['email']))
            return
        except: pass
    _users[user['email']] = user

def _insert_user(user):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO users (email, name, password, avatar, phone, cart, wishlist)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (user['email'], user['name'], user['password'],
                      user.get('avatar',''), user.get('phone',''),
                      json.dumps([]), json.dumps([])))
            return
        except: pass
    _users[user['email']] = dict(user)

def _user_exists(email):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM users WHERE email = %s", (email,))
                return cur.fetchone() is not None
        except: pass
    return email in _users

def _get_orders(email):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM orders WHERE user_email = %s ORDER BY date DESC", (email,))
                return [dict(r) for r in cur.fetchall()]
        except: pass
    return _orders.get(email, [])

def _insert_order(order):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO orders (user_email, order_id, items, address, payment, total, status, tracking, estimated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (order['user_email'], order['order_id'],
                      json.dumps(order.get('items',[])),
                      json.dumps(order.get('address',{})),
                      json.dumps(order.get('payment',{})),
                      order.get('total', 0), order.get('status','confirmed'),
                      order.get('tracking',''), order.get('estimated','')))
            return
        except: pass
    _orders.setdefault(order['user_email'], []).insert(0, order)

def _get_reviews(pid):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM reviews WHERE product_id = %s ORDER BY created_at DESC", (pid,))
                return [dict(r) for r in cur.fetchall()]
        except: pass
    return _reviews.get(pid, [])

def _insert_review(review):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO reviews (id, product_id, user_email, user_name, avatar, rating, title, body, date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (review['id'], review['product_id'], review.get('user_email',''),
                      review.get('user',''), review.get('avatar',''),
                      review.get('rating',5), review.get('title',''),
                      review.get('body',''), review.get('date','')))
            return
        except: pass
    _reviews.setdefault(review['product_id'], []).insert(0, review)

def _update_cart(email, cart):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET cart = %s WHERE email = %s", (json.dumps(cart), email))
            return
        except: pass
    if email in _users: _users[email]['cart'] = cart

def _update_wishlist(email, wishlist):
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET wishlist = %s WHERE email = %s", (json.dumps(wishlist), email))
            return
        except: pass
    if email in _users: _users[email]['wishlist'] = wishlist

# ── Utilities ──────────────────────────────────────────────────────────────────

def _hash(pwd): return hashlib.sha256(pwd.encode()).hexdigest()

def _current_user():
    email = session.get('user_email')
    return _get_user(email) if email else None

def _ok(data=None, **kwargs):
    resp = {'success': True}
    if data is not None: resp['data'] = data
    resp.update(kwargs)
    return jsonify(resp)

def _err(msg, code=400):
    return jsonify({'success': False, 'error': msg}), code

def _safe(user):
    u = dict(user)
    u.pop('password', None)
    u.pop('_id', None)
    return u

# ── Static ─────────────────────────────────────────────────────────────────────
# To this:
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def frontend(path):
    if path and os.path.exists(os.path.join('frontend/dist', path)):
        return send_from_directory('frontend/dist', path)
    return send_from_directory('frontend/dist', 'index.html')

# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    d     = request.get_json() or {}
    name  = (d.get('name','') or '').strip()
    email = (d.get('email','') or '').strip().lower()
    pwd   = d.get('password','')
    if not name or not email or not pwd: return _err('All fields required.')
    if '@' not in email: return _err('Invalid email.')
    if len(pwd) < 6: return _err('Password must be at least 6 characters.')
    if _user_exists(email): return _err('Account already exists.')
    user = {
        'id':        str(uuid.uuid4()),
        'name':      name, 'email': email,
        'password':  _hash(pwd),
        'avatar':    f"https://api.dicebear.com/8.x/initials/svg?seed={name}",
        'joined':    datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'wishlist':  [], 'cart': [], 'addresses': [],
    }
    _insert_user(user)
    session['user_email'] = email
    return _ok(_safe(user)), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    d     = request.get_json() or {}
    email = (d.get('email','') or '').strip().lower()
    pwd   = d.get('password','')
    user  = _get_user(email)
    if not user or user['password'] != _hash(pwd):
        return _err('Invalid email or password.', 401)
    session['user_email'] = email
    return _ok(_safe(user))


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return _ok('Logged out.')


@app.route('/api/auth/me', methods=['GET'])
def me():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    return _ok(_safe(user))

# ══════════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/products', methods=['GET'])
def get_products():
    cat    = request.args.get('category','All')
    brand  = request.args.get('brand','')
    sort   = request.args.get('sort','popular')
    min_p  = request.args.get('min_price', type=float)
    max_p  = request.args.get('max_price', type=float)
    page   = request.args.get('page', 1, type=int)
    limit  = request.args.get('limit', 20, type=int)
    search = request.args.get('search','').lower().strip()

    items = list(PRODUCTS)
    if cat and cat != 'All': items = [p for p in items if p['category']==cat]
    if brand: items = [p for p in items if p['brand']==brand]
    if min_p is not None: items = [p for p in items if p['price']>=min_p]
    if max_p is not None: items = [p for p in items if p['price']<=max_p]

    # Smart natural language search
    if search:
        # Extract price from query like "under 5000" or "below 5000"
        import re
        price_match = re.search(r'(?:under|below|less than|upto|up to)\s*[₹rs]?\s*(\d+)', search)
        if price_match:
            max_price = float(price_match.group(1))
            items = [p for p in items if p['price'] <= max_price]
            # Remove price part from search
            search = re.sub(r'(?:under|below|less than|upto|up to)\s*[₹rs]?\s*\d+', '', search).strip()

        if search:
            def score(p):
                s = 0
                name = p['name'].lower()
                brand_l = p['brand'].lower()
                cat_l = p['category'].lower()
                tags = ' '.join(p.get('tags', [])).lower()
                words = search.split()
                for word in words:
                    if len(word) < 2: continue
                    if word in name: s += 10
                    if word in brand_l: s += 8
                    if word in cat_l: s += 6
                    if word in tags: s += 4
                    # Partial match
                    if any(word in t for t in name.split()): s += 3
                return s

            scored = [(p, score(p)) for p in items]
            scored = [(p, s) for p, s in scored if s > 0]
            if scored:
                scored.sort(key=lambda x: -x[1])
                items = [p for p, _ in scored]
            else:
                # Fallback — return nothing matched
                items = []

    sort_map = {
        'popular':   lambda x: -x['reviews'],
        'rating':    lambda x: -x['rating'],
        'price_asc': lambda x:  x['price'],
        'price_desc':lambda x: -x['price'],
        'newest':    lambda x: -x['id'],
        'discount':  lambda x: -(x['original_price']-x['price']),
    }
    if not search:
        items.sort(key=sort_map.get(sort, sort_map['popular']))

    total = len(items)
    paged = items[(page-1)*limit : page*limit]
    return _ok(paged, total=total, page=page,
               categories=sorted({p['category'] for p in PRODUCTS}),
               brands=sorted({p['brand'] for p in PRODUCTS}))


@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product(pid):
    p = next((x for x in PRODUCTS if x['id']==pid), None)
    if not p: return _err('Product not found.', 404)
    user = _current_user()
    if user: track_event(user['email'], pid, 'view')
    return _ok({**p, 'customer_reviews': _get_reviews(pid)})


@app.route('/api/search', methods=['GET'])
def search():
    q     = request.args.get('q','')
    cat   = request.args.get('category','All')
    sort  = request.args.get('sort','')
    min_p = request.args.get('min_price', type=float)
    max_p = request.args.get('max_price', type=float)
    brand = request.args.get('brand','')
    results = search_products(q, {'category':cat,'sort':sort,
                                   'min_price':min_p,'max_price':max_p,
                                   'brand':brand or None})
    return _ok(results, total=len(results))

# ══════════════════════════════════════════════════════════════════════════════
# AI
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/recommendations/<int:pid>')
def recommendations(pid):
    user = _current_user()
    return _ok(get_recommendations(pid, num=request.args.get('num',6,type=int),
                                   user_id=user['email'] if user else None))

@app.route('/api/feed')
def feed():
    user = _current_user()
    return _ok(get_personalized_feed(user['email'] if user else 'anon',
                                     num=request.args.get('num',12,type=int)))

@app.route('/api/trending')
def trending():
    return _ok(get_trending(8))

@app.route('/api/category/<cat>/picks')
def category_picks(cat):
    return _ok(get_category_picks(cat, 6))

@app.route('/api/track', methods=['POST'])
def track():
    user = _current_user()
    if not user: return _err('Login required.', 401)
    d = request.get_json() or {}
    if d.get('product_id'):
        track_event(user['email'], int(d['product_id']), d.get('event','view'))
    return _ok('Tracked.')

# ══════════════════════════════════════════════════════════════════════════════
# CART
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/cart', methods=['GET'])
def get_cart():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    return _ok(user.get('cart', []))

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    d   = request.get_json() or {}
    pid = d.get('product_id')
    qty = int(d.get('quantity', 1))
    clr = d.get('color','')
    sz  = d.get('size','')
    product = next((x for x in PRODUCTS if x['id']==pid), None)
    if not product: return _err('Product not found.', 404)
    track_event(user['email'], pid, 'cart')
    cart = user.get('cart', [])
    existing = next((i for i in cart if i['product_id']==pid
                     and i.get('color')==clr and i.get('size')==sz), None)
    if existing:
        existing['quantity'] += qty
    else:
        cart.append({'product_id':pid,'quantity':qty,'color':clr,'size':sz,
                     'name':product['name'],'price':product['price'],
                     'image':product['images'][0]})
    _update_cart(user['email'], cart)
    return _ok(cart)

@app.route('/api/cart/<int:pid>', methods=['DELETE'])
def remove_from_cart(pid):
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    cart = [i for i in user.get('cart',[]) if i['product_id']!=pid]
    _update_cart(user['email'], cart)
    return _ok(cart)

@app.route('/api/cart/<int:pid>', methods=['PATCH'])
def update_cart(pid):
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    qty  = int((request.get_json() or {}).get('quantity', 1))
    cart = user.get('cart', [])
    for item in cart:
        if item['product_id'] == pid: item['quantity'] = qty
    _update_cart(user['email'], cart)
    return _ok(cart)

# ══════════════════════════════════════════════════════════════════════════════
# WISHLIST
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    return _ok(user.get('wishlist', []))

@app.route('/api/wishlist/<int:pid>', methods=['POST'])
def toggle_wishlist(pid):
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    track_event(user['email'], pid, 'like')
    wl = user.get('wishlist', [])
    if pid in wl: wl.remove(pid); wished = False
    else: wl.append(pid); wished = True
    _update_wishlist(user['email'], wl)
    return _ok({'wishlisted': wished, 'wishlist': wl})

# ══════════════════════════════════════════════════════════════════════════════
# ORDERS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/orders', methods=['GET'])
def get_orders():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    return _ok(_get_orders(user['email']))

@app.route('/api/checkout', methods=['POST'])
def checkout():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    d       = request.get_json() or {}
    payment = d.get('payment', {})
    cart    = user.get('cart', [])
    if not cart: return _err('Cart is empty.')

    method = payment.get('method','card')
    if method == 'card':
        card = str(payment.get('card_number','')).replace(' ','')
        if len(card) < 13: return _err('Invalid card number.')
    elif method == 'upi':
        if '@' not in payment.get('upi_id',''): return _err('Invalid UPI ID.')
    elif method == 'netbanking':
        if not payment.get('bank',''): return _err('Please select a bank.')

    total = sum(i['price']*i['quantity'] for i in cart)
    order = {
        'order_id':       'ORD-'+str(uuid.uuid4())[:8].upper(),
        'user_email':     user['email'],
        'date':           datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'items':          list(cart),
        'total':          total,
        'address':        d.get('address',{}),
        'payment_method': method,
        'status':         'Confirmed',
        'tracking':       'TRK-'+str(uuid.uuid4())[:10].upper(),
        'estimated':      (datetime.datetime.now(datetime.timezone.utc)+
                           datetime.timedelta(days=5)).strftime('%b %d, %Y'),
    }
    _insert_order(order)
    for item in cart: track_event(user['email'], item['product_id'], 'buy')
    _update_cart(user['email'], [])
    return _ok(order), 201

# ══════════════════════════════════════════════════════════════════════════════
# REVIEWS & PROFILE
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/products/<int:pid>/reviews', methods=['POST'])
def add_review(pid):
    user = _current_user()
    if not user: return _err('Login to review.', 401)
    d = request.get_json() or {}
    review = {
        'id':str(uuid.uuid4()), 'product_id':pid,
        'user':user['name'], 'avatar':user['avatar'],
        'rating':int(d.get('rating',5)),
        'title':d.get('title',''), 'body':d.get('body',''),
        'date':datetime.datetime.now(datetime.timezone.utc).strftime('%b %d, %Y'),
        'helpful':0,
    }
    _insert_review(review)
    return _ok(review), 201

@app.route('/api/profile', methods=['PATCH'])
def update_profile():
    user = _current_user()
    if not user: return _err('Not authenticated.', 401)
    d = request.get_json() or {}
    for f in ('name','phone','avatar'):
        if f in d: user[f] = d[f]
    _save_user(user)
    return _ok(_safe(_current_user()))

# ══════════════════════════════════════════════════════════════════════════════
# AI FEATURES — Powered by Gemini
# ══════════════════════════════════════════════════════════════════════════════

from groq import Groq as _Groq
import random as _random

# ── Smart product list builder ───────────────────────────────────────────────
def _product_list(category=None, limit=80, sort_by='reviews'):
    items = list(PRODUCTS)
    if category:
        cat_items = [p for p in items if p['category'] == category]
        items = cat_items if cat_items else items
    items = sorted(items, key=lambda x: -x.get(sort_by, 0))[:limit]
    return '\n'.join([
        f"ID:{p['id']}|{p['name']}|{p['category']}|₹{p['price']}|{p['brand']}|{','.join(p['tags'][:4])}"
        for p in items
    ])

def _product_list_by_budget(budget, limit=60):
    items = [p for p in PRODUCTS if p['price'] <= int(budget or 999999)]
    items = sorted(items, key=lambda x: -x['rating'])[:limit]
    return '\n'.join([
        f"ID:{p['id']}|{p['name']}|{p['category']}|₹{p['price']}|{p['brand']}"
        for p in items
    ])

# ── AI response cache ────────────────────────
import hashlib as _hashlib, time as _time
_ai_cache = {}
_AI_TTL   = 300

def _cache_key(*parts):
    return _hashlib.md5('|'.join(str(p) for p in parts).encode()).hexdigest()

def _cache_get(key):
    entry = _ai_cache.get(key)
    if not entry: return None
    result, ts = entry
    if _time.time() - ts > _AI_TTL:
        del _ai_cache[key]; return None
    return result

def _cache_set(key, value):
    _ai_cache[key] = (value, _time.time())
    if len(_ai_cache) > 200:
        del _ai_cache[min(_ai_cache, key=lambda k: _ai_cache[k][1])]

def _gemini(system, user_msg, max_tokens=1024):
    key = os.getenv('GROQ_API_KEY', '')
    if not key: return None
    cache_key = _cache_key(_hashlib.md5(system.encode()).hexdigest()[:16], user_msg[:200])
    cached = _cache_get(cache_key)
    if cached is not None: return cached
    try:
        client = _Groq(api_key=key)
        resp = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role':'system','content':system},{'role':'user','content':user_msg}],
            max_tokens=max_tokens, temperature=0.7,
        )
        result = resp.choices[0].message.content
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f'⚠️ Groq error: {e}'); return None

def _smart_fallback(category='general', query=''):
    """Smart pre-built responses when Gemini is unavailable."""
    if 'shoe' in query.lower() or 'shoe' in category.lower():
        return f"Based on your interest in shoes, I recommend checking our Nike Air Max 270 and Adidas Ultraboost — both are top sellers with excellent reviews. Nike offers superior cushioning while Adidas gives better energy return for running. For casual wear, the Air Jordan 1 or Converse Chuck 70 are iconic choices. What style are you looking for — running, casual, or formal?"
    if 'phone' in query.lower() or 'mobile' in query.lower() or 'iphone' in query.lower():
        return f"For smartphones, the iPhone 15 Pro is our top pick for iOS users with its titanium build and A17 Pro chip. For Android, the Samsung Galaxy S24 Ultra offers the best camera system with 200MP and built-in S Pen. If budget is a concern, the Samsung Galaxy S24 FE gives flagship features at a lower price. Which ecosystem do you prefer — iOS or Android?"
    if 'laptop' in query.lower():
        return f"For laptops, the MacBook Air M3 is unbeatable for battery life and performance. For Windows, the Dell XPS 13 Plus offers premium build quality. If gaming is your priority, the ASUS ROG Strix G16 with RTX 4070 delivers excellent performance. What's your primary use case?"
    if 'gift' in query.lower():
        return f"Great gift ideas from ZYNC! 🎁 For tech lovers: Apple AirPods Pro or Sony WH-1000XM5 headphones. For fitness enthusiasts: Garmin GPS watch or Hydro Flask. For bookworms: Atomic Habits or Psychology of Money. For gamers: PS5 DualSense Controller or Nintendo Switch. What's the recipient's age and interests?"
    if 'protein' in query.lower() or 'gym' in query.lower() or 'fitness' in query.lower():
        return f"For fitness goals, Optimum Nutrition Gold Standard Whey is the world's best-selling protein — 24g protein per serving with NSF certification. If you prefer Indian brands, MuscleBlaze Biozyme has excellent absorption with digestive enzymes. For plant-based options, OZiva Plant Protein is great. What are your fitness goals — muscle building, weight loss, or general health?"
    if 'book' in query.lower() or 'read' in query.lower():
        return f"Top book recommendations from ZYNC! 📚 For self-improvement: Atomic Habits by James Clear. For finance: Psychology of Money by Morgan Housel. For productivity: Deep Work by Cal Newport. For inspiration: Can't Hurt Me by David Goggins. For business: Zero to One by Peter Thiel. What genre interests you most?"
    
    # General fallback
    responses = [
        f"I found several great options matching '{query}'! Our AI recommendation engine suggests checking the trending section and using the smart filters on the Shop page. You can also try our Voice Search feature or the AI Smart Search for natural language queries like 'shoes under 5000' or 'best laptop for students'.",
        f"Great question! Based on current trends on ZYNC, I'd recommend exploring our top-rated products in that category. Use the 🎛️ Filters on the Shop page to narrow by price, brand, and rating. Our Deal Sniper feature in Advanced AI can also find the best value products for you!",
        f"I'm here to help you shop smarter! 🛍️ Try our Advanced AI features — the Personal Shopper 'Alex' can remember your preferences, the Gift Finder helps with presents, and the Deal Sniper finds the best value products across all 470+ items in our catalog.",
    ]
    return _random.choice(responses)


# ── 1. AI Shopping Assistant ───────────────────────────────────────────────────
@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    d       = request.get_json() or {}
    message = d.get('message','')
    history = d.get('history', [])[-6:]
    user    = _current_user()

    product_list = _product_list(limit=80)

    system = f"""You are ZYNC's friendly AI shopping assistant. You help customers find perfect products.
You have access to {len(PRODUCTS)} products. Here are the top ones:
{product_list}

Rules:
- Be conversational, fun and helpful
- When recommending products, always mention their ID like [ID:5]
- Keep responses concise (2-4 sentences max)
- If asked about price, suggest products within their budget
- Use emojis occasionally to be friendly
- Current user: {user['name'] if user else 'Guest'}"""

    messages = history + [{'role':'user','content':message}]
    conv = '\n'.join([f"{m['role'].upper()}: {m['content']}" for m in messages])
    reply = _gemini(system, conv, max_tokens=512)
    if not reply:
        reply = _smart_fallback(query=message)

    import re
    ids = [int(x) for x in re.findall(r'\[ID:(\d+)\]', reply)]
    suggested = [p for p in PRODUCTS if p['id'] in ids]

    return _ok({'reply': reply, 'suggested_products': suggested})


# ── 2. AI Smart Search ────────────────────────────────────────────────────────
@app.route('/api/ai/smart-search', methods=['POST'])
def ai_smart_search():
    d     = request.get_json() or {}
    query = d.get('query', '')

    product_list = '\n'.join([
        f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']} | tags:{','.join(p['tags'])}"
        for p in sorted(PRODUCTS, key=lambda x: -x['reviews'])[:80]
    ])

    system = """You are a smart product search engine. Given a natural language query, find matching products.
Return ONLY a JSON array of product IDs that match, ordered by relevance. Example: [5, 12, 3]
Return empty array [] if nothing matches. No explanation, just the JSON array."""

    result = _gemini(system, f"Products:\n{product_list}\n\nQuery: {query}")
    if not result:
        result = _smart_fallback(query='')

    import re, json
    match = re.search(r'\[[\d,\s]*\]', result)
    ids = json.loads(match.group()) if match else []
    products = [p for p in PRODUCTS if p['id'] in ids]
    return _ok(products, query=query, total=len(products))


# ── 3. AI Style Advisor ────────────────────────────────────────────────────────
@app.route('/api/ai/style-advisor', methods=['POST'])
def ai_style_advisor():
    d         = request.get_json() or {}
    style     = d.get('style', '')
    occasion  = d.get('occasion', '')
    budget    = d.get('budget', '')
    gender    = d.get('gender', '')

    product_list = '\n'.join([
        f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']}"
        for p in PRODUCTS if p['category'] in ['Shoes','Clothing','Bags','Beauty']
    ])

    system = """You are ZYNC's personal AI style advisor. Create complete outfit recommendations.
Always respond in this exact JSON format:
{
  "outfit_name": "...",
  "vibe": "...",
  "description": "...",
  "items": [ID1, ID2, ID3, ID4],
  "styling_tip": "...",
  "total_price": 0
}
Only include IDs from the provided product list. No extra text outside JSON."""

    prompt = f"""Products available:
{product_list}

Customer wants:
- Style: {style}
- Occasion: {occasion}
- Budget: ₹{budget}
- Gender preference: {gender}

Create a complete outfit."""

    result = _gemini(system, prompt, max_tokens=512)

    import json, re
    if result:
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                data = json.loads(match.group())
                items = [p for p in PRODUCTS if p['id'] in data.get('items',[])]
                data['products'] = items
                data['total_price'] = sum(p['price'] for p in items)
                return _ok(data)
        except: pass

    # Fallback outfit
    fashion = [p for p in PRODUCTS if p['category'] in ['Clothing','Shoes','Bags']][:4]
    return _ok({
        'outfit_name': f'{style or "Casual"} Outfit',
        'vibe': style or 'Casual',
        'description': f'A perfect {occasion or "everyday"} outfit within your budget.',
        'products': fashion,
        'total_price': sum(p['price'] for p in fashion),
        'styling_tip': 'Mix and match these pieces for a complete look!'
    })


# ── 4. AI Price Analyzer ──────────────────────────────────────────────────────
@app.route('/api/ai/price-analyze/<int:pid>', methods=['GET'])
def ai_price_analyze(pid):
    product = next((p for p in PRODUCTS if p['id'] == pid), None)
    if not product: return _err('Product not found.', 404)

    similar = [p for p in PRODUCTS if p['category'] == product['category'] and p['id'] != pid]
    avg_price = sum(p['price'] for p in similar) / len(similar) if similar else product['price']
    discount  = round((product['original_price'] - product['price']) / product['original_price'] * 100)

    system = """You are a price analysis AI. Analyze if a product is good value.
Respond in JSON format only:
{
  "verdict": "Great Deal" | "Fair Price" | "Overpriced" | "Buy Now",
  "score": 0-100,
  "reason": "one sentence explanation",
  "tip": "one actionable tip for the buyer"
}
No text outside JSON."""

    prompt = f"""Product: {product['name']}
Price: ₹{product['price']} (was ₹{product['original_price']})
Discount: {discount}%
Rating: {product['rating']}/5 from {product['reviews']} reviews
Category avg price: ₹{avg_price:.0f}
Brand: {product['brand']}"""

    result = _gemini(system, prompt, max_tokens=256)
    if not result:
        result = _smart_fallback(query='')

    import json, re
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        data  = json.loads(match.group())
        data['discount'] = discount
        data['avg_category_price'] = round(avg_price)
        return _ok(data)
    except:
        return _err('Could not analyze price.')


# ── 5. AI Review Summarizer ───────────────────────────────────────────────────
@app.route('/api/ai/review-summary/<int:pid>', methods=['GET'])
def ai_review_summary(pid):
    product = next((p for p in PRODUCTS if p['id'] == pid), None)
    if not product: return _err('Product not found.', 404)

    reviews = _get_reviews(pid)

    system = """You are a review analysis AI. Summarize product reviews.
Respond in JSON only:
{
  "summary": "2 sentence overall summary",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "verdict": "one word verdict",
  "recommend": true or false
}"""

    if not reviews:
        prompt = f"Product: {product['name']}, Rating: {product['rating']}/5, {product['reviews']} reviews. No written reviews yet — give a general assessment based on the rating and product type."
    else:
        review_text = '\n'.join([f"- {r['rating']}/5: {r['body']}" for r in reviews[:10]])
        prompt = f"Product: {product['name']}\nReviews:\n{review_text}"

    result = _gemini(system, prompt, max_tokens=256)
    if not result:
        result = _smart_fallback(query='')

    import json, re
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return _ok(json.loads(match.group()))
    except:
        return _err('Could not summarize reviews.')


# ── 6. AI Surprise Me ─────────────────────────────────────────────────────────
@app.route('/api/ai/surprise', methods=['GET'])
def ai_surprise():
    user = _current_user()

    behavior_str = ''
    if user:
        from ml.recommender import user_behavior
        behavior = user_behavior.get(user['email'], {})
        if behavior:
            top = sorted(behavior.items(), key=lambda x: x[1], reverse=True)[:5]
            viewed = [next((p for p in PRODUCTS if p['id']==pid), None) for pid,_ in top]
            viewed = [p for p in viewed if p]
            behavior_str = f"User recently liked: {', '.join(p['name'] for p in viewed)}"

    product_list = '\n'.join([f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']}" for p in sorted(PRODUCTS, key=lambda x: -x['reviews'])[:50]])

    system = """You are a fun AI shopper. Pick ONE perfect surprise product.
Respond in JSON only:
{
  "product_id": 0,
  "reason": "fun 1-sentence reason why this is perfect for them",
  "surprise_message": "exciting 1-sentence message to show the user"
}"""

    prompt = f"{behavior_str}\n\nProducts:\n{product_list}\n\nPick the most surprising yet perfect product!"

    result = _gemini(system, prompt, max_tokens=200)
    if not result:
        result = _smart_fallback(query='')

    import json, re
    try:
        match   = re.search(r'\{.*\}', result, re.DOTALL)
        data    = json.loads(match.group())
        pid     = int(data.get('product_id', 0))
        product = next((p for p in PRODUCTS if p['id'] == pid), PRODUCTS[0])
        data['product'] = product
        return _ok(data)
    except:
        return _err('Could not pick surprise.')


# ── 7. AI Taste Profile ───────────────────────────────────────────────────────
@app.route('/api/ai/taste-profile', methods=['GET'])
def ai_taste_profile():
    user = _current_user()
    if not user: return _err('Login required.', 401)

    from ml.recommender import user_behavior
    behavior = user_behavior.get(user['email'], {})

    if not behavior:
        return _ok({
            'personality': 'Explorer',
            'description': 'You\'re just getting started! Browse products to build your taste profile.',
            'traits': ['Curious', 'Open-minded', 'Adventurous'],
            'top_categories': [],
            'top_brands': [],
            'style_tags': [],
            'empty': True
        })

    interacted = [next((p for p in PRODUCTS if p['id']==pid), None) for pid in behavior]
    interacted = [p for p in interacted if p]

    cats   = {}
    brands = {}
    tags   = {}
    for p in interacted:
        cats[p['category']]   = cats.get(p['category'], 0) + behavior.get(p['id'], 0)
        brands[p['brand']]    = brands.get(p['brand'], 0) + behavior.get(p['id'], 0)
        for t in p['tags']:
            tags[t] = tags.get(t, 0) + 1

    top_cats   = sorted(cats.items(),   key=lambda x: x[1], reverse=True)[:3]
    top_brands = sorted(brands.items(), key=lambda x: x[1], reverse=True)[:3]
    top_tags   = sorted(tags.items(),   key=lambda x: x[1], reverse=True)[:6]

    system = """You are a personality analyzer for a shopping app.
Respond in JSON only:
{
  "personality": "one word personality type (e.g. Trendsetter, Minimalist, Explorer, Tech Geek, Fashionista, Athlete)",
  "description": "2 sentence fun description of their shopping personality",
  "traits": ["trait1", "trait2", "trait3"]
}"""

    prompt = f"""Shopping behavior:
Top categories: {[c for c,_ in top_cats]}
Top brands: {[b for b,_ in top_brands]}
Top interests: {[t for t,_ in top_tags]}"""

    result = _gemini(system, prompt, max_tokens=200)

    import json, re
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        data  = json.loads(match.group()) if result and match else {
            'personality': 'Explorer',
            'description': 'You have eclectic taste across multiple categories!',
            'traits': ['Curious', 'Diverse', 'Adventurous']
        }
        data['top_categories'] = [c for c,_ in top_cats]
        data['top_brands']     = [b for b,_ in top_brands]
        data['style_tags']     = [t for t,_ in top_tags]
        data['empty']          = False
        return _ok(data)
    except:
        return _err('Could not build taste profile.')

# ══════════════════════════════════════════════════════════════════════════════
# ADVANCED AI FEATURES
# ══════════════════════════════════════════════════════════════════════════════

# ── 8. AI Gift Finder ─────────────────────────────────────────────────────────
@app.route('/api/ai/gift-finder', methods=['POST'])
def ai_gift_finder():
    d = request.get_json() or {}
    person = d.get('person', '')
    age = d.get('age', '')
    interests = d.get('interests', '')
    budget = d.get('budget', '')
    occasion = d.get('occasion', '')

    product_list = '\n'.join([
        f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']} | tags:{','.join(p['tags'])}"
        for p in PRODUCTS
    ])

    system = """You are an expert gift advisor AI. Find perfect gift recommendations.
Respond in JSON only:
{
  "gift_message": "warm personalized message about why these gifts are perfect",
  "top_pick_id": 0,
  "top_pick_reason": "why this is THE perfect gift",
  "other_ids": [0, 0, 0],
  "gift_tip": "one thoughtful tip for presenting the gift"
}"""

    prompt = f"""Person: {person}
Age: {age}
Interests: {interests}
Budget: ₹{budget}
Occasion: {occasion}

Products:
{product_list}

Find the most thoughtful gift options."""

    result = _gemini(system, prompt)

    import json, re
    if result:
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                data = json.loads(match.group())
                top = next((p for p in PRODUCTS if p['id'] == int(data.get('top_pick_id', 0))), None)
                others = [p for p in PRODUCTS if p['id'] in data.get('other_ids', [])]
                data['top_pick'] = top
                data['other_products'] = others
                return _ok(data)
        except: pass

    # Fallback gift suggestions
    budget_int = int(budget) if str(budget).isdigit() else 5000
    gifts = [p for p in PRODUCTS if p['price'] <= budget_int]
    gifts = sorted(gifts, key=lambda x: -x['rating'])[:4]
    return _ok({
        'gift_message': f'Perfect gifts for {person or "your loved one"} on {occasion or "any occasion"}!',
        'top_pick': gifts[0] if gifts else None,
        'top_pick_reason': 'Highly rated and great value for money',
        'other_products': gifts[1:],
        'gift_tip': 'Add a personal note to make the gift extra special!'
    })


# ── 9. AI Personal Shopper ────────────────────────────────────────────────────
@app.route('/api/ai/personal-shopper', methods=['POST'])
def ai_personal_shopper():
    d = request.get_json() or {}
    message = d.get('message', '')
    history = d.get('history', [])
    preferences = d.get('preferences', {})
    user = _current_user()

    # Only send top 50 products to avoid prompt overload
    top_products = sorted(PRODUCTS, key=lambda x: -x['reviews'])[:50]
    product_list = '\n'.join([
        f"- ID:{p['id']} {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']} | Rating:{p['rating']} | tags:{','.join(p['tags'])}"
        for p in top_products
    ])

    prefs_str = ', '.join([f"{k}: {v}" for k, v in preferences.items()]) if preferences else 'none yet'

    system = f"""You are Alex, a warm and witty personal shopping friend — not a bot. You're knowledgeable, fun, and genuinely care about helping people find great products.

You remember everything shared in this conversation. You use the person's name when you know it, make jokes, give honest opinions, and push back if something isn't right for them.

Known preferences: {prefs_str}
Current user: {user['name'] if user else 'friend'}

Products you can recommend:
{product_list}

Rules:
- Talk like a real friend, not a corporate assistant
- When recommending, mention product IDs like [ID:5]
- Remember what was discussed earlier in the chat
- Be opinionated — say things like "honestly, skip that one" or "this is SO good"
- Keep responses to 3-5 sentences max
- Extract preferences naturally (budget, style, brands they like) and remember them"""

    conv = '\n'.join([f"{m['role'].upper()}: {m['content']}" for m in history[-8:]])
    if conv:
        prompt = f"Previous conversation:\n{conv}\n\nUSER: {message}"
    else:
        prompt = f"USER: {message}"

    reply = _gemini(system, prompt)
    if not reply:
        alex_responses = [
            f"Hey! I'm Alex, your personal shopping buddy at ZYNC! 👋 I'm having a tiny tech hiccup right now but I'm still here to help! Tell me what you're looking for — budget, style, occasion — and I'll dig through our 470+ products to find you something amazing. What's on your shopping list today? 🛍️",
            f"Oops, my AI brain took a quick coffee break ☕ — but I'm still Alex and I've got you! What kind of products are you hunting for? Drop me some details like your budget and style preferences, and I'll find the perfect match from our catalog!",
            f"Hey bestie! Alex here! 🌟 Quick heads up — my smart responses are loading but I can still chat! What brings you to ZYNC today? Looking for something specific or just browsing? Tell me your vibe and I'll curate something special for you!",
        ]
        import random as _r
        reply = _r.choice(alex_responses)

    import re
    ids = [int(x) for x in re.findall(r'\[ID:(\d+)\]', reply)]
    suggested = [p for p in PRODUCTS if p['id'] in ids]

    # Extract preferences from conversation
    new_prefs = {}
    if 'budget' in message.lower() or '₹' in message:
        nums = re.findall(r'[\d,]+', message.replace(',', ''))
        if nums:
            new_prefs['budget'] = f"₹{nums[-1]}"

    return _ok({'reply': reply, 'suggested_products': suggested, 'extracted_preferences': new_prefs})


# ── 10. AI Shopping Goals ─────────────────────────────────────────────────────
@app.route('/api/ai/shopping-goals', methods=['POST'])
def ai_shopping_goals():
    d = request.get_json() or {}
    goal = d.get('goal', '')
    budget = d.get('budget', '')
    timeline = d.get('timeline', '')

    product_list = '\n'.join([
        f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']}"
        for p in PRODUCTS
    ])

    system = """You are a smart shopping planner AI. Create a complete shopping plan to achieve the user's goal.
Respond in JSON only:
{
  "plan_title": "catchy title for this shopping plan",
  "summary": "2 sentence overview of the plan",
  "phases": [
    {
      "phase": "Phase 1",
      "title": "phase title",
      "description": "what this phase achieves",
      "product_ids": [1, 2, 3],
      "phase_budget": 0
    }
  ],
  "total_cost": 0,
  "savings_tip": "one money-saving tip",
  "success_metric": "how to know when goal is achieved"
}"""

    prompt = f"""Goal: {goal}
Total Budget: ₹{budget}
Timeline: {timeline}

Available Products:
{product_list}

Create a detailed phased shopping plan."""

    result = _gemini(system, prompt, max_tokens=1024)

    import json, re
    if result:
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                data = json.loads(match.group())
                for phase in data.get('phases', []):
                    phase['products'] = [p for p in PRODUCTS if p['id'] in phase.get('product_ids', [])]
                return _ok(data)
        except: pass

    # Fallback plan
    budget_int = int(budget) if str(budget).isdigit() else 10000
    top = sorted(PRODUCTS, key=lambda x: -x['rating'])[:6]
    affordable = [p for p in top if p['price'] <= budget_int // 2][:3]
    return _ok({
        'plan_title': f'Your {goal or "Shopping"} Plan',
        'summary': f'A smart phased plan to achieve your goal within ₹{budget or "your budget"}.',
        'phases': [
            {'phase': 'Phase 1', 'title': 'Essentials First', 'description': 'Start with the must-haves', 'products': affordable[:2], 'phase_budget': budget_int // 2},
            {'phase': 'Phase 2', 'title': 'Complete the Setup', 'description': 'Add complementary items', 'products': affordable[2:], 'phase_budget': budget_int // 2},
        ],
        'total_cost': sum(p['price'] for p in affordable),
        'savings_tip': 'Buy Phase 1 first and wait for sales on Phase 2 items!',
        'success_metric': f"You've achieved your {goal or 'goal'} within budget!"
        }) 

     


# ── 11. AI Occasion Planner ───────────────────────────────────────────────────
@app.route('/api/ai/occasion-planner', methods=['POST'])
def ai_occasion_planner():
    d = request.get_json() or {}
    occasion = d.get('occasion', '')
    timeline = d.get('timeline', '')
    budget = d.get('budget', '')
    details = d.get('details', '')

    product_list = '\n'.join([
        f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']}"
        for p in PRODUCTS
    ])

    system = """You are an expert occasion planning AI. Create a complete preparation plan.
Respond in JSON only:
{
  "occasion_title": "title",
  "urgency": "Urgent" | "Comfortable" | "Plenty of Time",
  "overview": "2 sentence overview",
  "checklist": [
    {
      "category": "category name",
      "items_needed": ["item1", "item2"],
      "product_ids": [1, 2],
      "priority": "Must Have" | "Nice to Have"
    }
  ],
  "timeline_tip": "when to buy what",
  "budget_breakdown": {"essentials": 0, "accessories": 0, "extras": 0},
  "pro_tip": "one expert tip for this occasion"
}"""

    prompt = f"""Occasion: {occasion}
Timeline: {timeline}
Budget: ₹{budget}
Details: {details}

Products:
{product_list}

Create a complete preparation checklist."""

    result = _gemini(system, prompt, max_tokens=1024)
    if not result:
        result = _smart_fallback(query='')

    import json, re
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        data = json.loads(match.group())
        for item in data.get('checklist', []):
            item['products'] = [p for p in PRODUCTS if p['id'] in item.get('product_ids', [])]
        return _ok(data)
    except:
        return _err('Could not create plan.')


# ── 12. AI Review Emotion Analyzer ───────────────────────────────────────────
@app.route('/api/ai/emotion-analysis/<int:pid>', methods=['GET'])
def ai_emotion_analysis(pid):
    product = next((p for p in PRODUCTS if p['id'] == pid), None)
    if not product:
        return _err('Product not found.', 404)

    reviews = _get_reviews(pid)

    system = """You are an emotion analysis AI for product reviews. Analyze the emotional tone.
Respond in JSON only:
{
  "overall_sentiment": "Positive" | "Mixed" | "Negative",
  "sentiment_score": 0-100,
  "emotions": {
    "happiness": 0-100,
    "trust": 0-100,
    "excitement": 0-100,
    "frustration": 0-100,
    "disappointment": 0-100,
    "satisfaction": 0-100
  },
  "top_positive_aspect": "what customers love most",
  "top_concern": "what bothers customers most",
  "buyer_confidence": "High" | "Medium" | "Low",
  "emotional_summary": "2 sentence human summary of the emotional landscape"
}"""

    if not reviews:
        prompt = f"Product: {product['name']}, Rating: {product['rating']}/5 from {product['reviews']} reviews. No written reviews — analyze based on rating and product type."
    else:
        review_text = '\n'.join([f"- {r['rating']}/5: {r['body']}" for r in reviews[:15]])
        prompt = f"Product: {product['name']}\nReviews:\n{review_text}"

    result = _gemini(system, prompt)
    if not result:
        result = _smart_fallback(query='')

    import json, re
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        return _ok(json.loads(match.group()))
    except:
        return _err('Could not analyze emotions.')


# ── 13. AI Style DNA ──────────────────────────────────────────────────────────
@app.route('/api/ai/style-dna', methods=['POST'])
def ai_style_dna():
    d = request.get_json() or {}
    vibe = d.get('vibe', '')
    inspirations = d.get('inspirations', '')
    lifestyle = d.get('lifestyle', '')
    avoid = d.get('avoid', '')

    product_list = '\n'.join([
        f"ID:{p['id']} | {p['name']} | {p['category']} | ₹{p['price']} | {p['brand']} | tags:{','.join(p['tags'])}"
        for p in PRODUCTS if p['category'] in ['Shoes','Clothing','Bags','Beauty']
    ])

    system = """You are a fashion DNA analyst AI. Build a complete style identity profile.
Respond in JSON only:
{
  "style_name": "unique name for their style (e.g. 'Urban Minimalist', 'Bold Explorer')",
  "style_tagline": "one sentence that captures their essence",
  "dna_traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "color_palette": ["color1", "color2", "color3"],
  "signature_pieces": [product_id1, product_id2, product_id3, product_id4],
  "style_rules": ["rule1", "rule2", "rule3"],
  "avoid_list": ["thing1", "thing2"],
  "style_icon": "a famous person or character with similar style",
  "evolution_tip": "how to evolve this style further"
}"""

    prompt = f"""Vibe description: {vibe}
Style inspirations: {inspirations}
Lifestyle: {lifestyle}
What to avoid: {avoid}

Fashion products:
{product_list}

Build their complete style DNA."""

    result = _gemini(system, prompt, max_tokens=512)
    if not result:
        result = _smart_fallback(query='')

    import json, re
    try:
        match = re.search(r'\{.*\}', result, re.DOTALL)
        data = json.loads(match.group())
        data['signature_products'] = [p for p in PRODUCTS if p['id'] in data.get('signature_pieces', [])]
        return _ok(data)
    except:
        return _err('Could not build style DNA.')


# ── 14. AI Deal Sniper ────────────────────────────────────────────────────────
@app.route('/api/ai/deal-sniper', methods=['GET'])
def ai_deal_sniper():
    import statistics

    # Calculate value scores for all products
    scored = []
    for p in PRODUCTS:
        if p['original_price'] > p['price']:
            discount = (p['original_price'] - p['price']) / p['original_price'] * 100
        else:
            discount = 0

        # Get category average price
        cat_prices = [x['price'] for x in PRODUCTS if x['category'] == p['category'] and x['id'] != p['id']]
        avg = statistics.mean(cat_prices) if cat_prices else p['price']
        price_vs_avg = (avg - p['price']) / avg * 100 if avg > 0 else 0

        value_score = (
            discount * 0.35 +
            p['rating'] * 10 * 0.30 +
            max(0, price_vs_avg) * 0.20 +
            min(p['reviews'] / 1000 * 100, 100) * 0.15
        )
        scored.append({**p, 'value_score': round(value_score, 1), 'discount': round(discount), 'price_vs_avg': round(price_vs_avg, 1)})

    top_deals = sorted(scored, key=lambda x: x['value_score'], reverse=True)[:8]

    product_summary = '\n'.join([
        f"ID:{p['id']} {p['name']} | Score:{p['value_score']} | Discount:{p['discount']}% | vs avg:{p['price_vs_avg']}%"
        for p in top_deals
    ])

    system = """You are a deals analyst AI. Review these top value products and give insights.
Respond in JSON only:
{
  "sniper_report": "2 sentence overview of today's best deals",
  "top_deal_id": 0,
  "top_deal_reason": "why this is the absolute best deal right now",
  "hidden_gem_id": 0,
  "hidden_gem_reason": "why this underrated product is worth attention",
  "market_insight": "one insight about pricing trends in these products"
}"""

    result = _gemini(system, product_summary)

    import json, re
    ai_insights = {}
    if result:
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            ai_insights = json.loads(match.group())
        except:
            pass

    return _ok({
        'deals': top_deals,
        'insights': ai_insights
    })


# ── 15. AI Shopping Coach ─────────────────────────────────────────────────────
@app.route('/api/ai/shopping-coach', methods=['POST'])
def ai_shopping_coach():
    user = _current_user()
    if not user:
        return _err('Login required.', 401)

    cart_items = _get_user(user['email']).get('cart', [])
    if not cart_items:
        return _ok({
            'score': 0,
            'verdict': 'Empty Cart',
            'message': 'Your cart is empty! Start shopping and I\'ll coach you.',
            'items_analysis': [],
            'empty': True
        })

    cart_products = []
    for item in cart_items:
        product = next((p for p in PRODUCTS if p['id'] == item['id']), None)
        if product:
            cart_products.append({**product, 'quantity': item['quantity']})

    total = sum(p['price'] * p['quantity'] for p in cart_products)
    cart_summary = '\n'.join([
        f"- {p['name']} | ₹{p['price']} x{p['quantity']} | Rating:{p['rating']} | Discount:{round((p['original_price']-p['price'])/p['original_price']*100)}%"
        for p in cart_products
    ])

    system = """You are a brutally honest but kind shopping coach AI. Analyze the cart and give real advice.
Respond in JSON only:
{
  "score": 0-100,
  "verdict": "Smart Shopper" | "Decent Choices" | "Needs Review" | "Impulse Alert",
  "overall_message": "2 sentence honest assessment",
  "items_analysis": [
    {
      "name": "product name",
      "judgment": "Smart Buy" | "Good Value" | "Consider Twice" | "Impulse Buy",
      "reason": "one honest sentence",
      "keep": true or false
    }
  ],
  "best_item": "name of best value item in cart",
  "questionable_item": "name of most questionable item",
  "money_saving_tip": "specific tip to save money on this exact cart",
  "total_verdict": "is this total worth it?"
}"""

    prompt = f"""Cart items:
{cart_summary}
Total: ₹{total}

Analyze this cart honestly."""

    result = _gemini(system, prompt)

    import json, re
    if result:
        try:
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                data = json.loads(match.group())
                data['total'] = total
                data['empty'] = False
                return _ok(data)
        except: pass

    # Fallback cart analysis
    avg_rating = sum(p['rating'] for p in cart_products) / len(cart_products) if cart_products else 0
    score = min(100, int(avg_rating * 20))
    return _ok({
        'score': score,
        'verdict': 'Smart Shopper' if score >= 80 else 'Decent Choices',
        'overall_message': f'Your cart has {len(cart_products)} items worth ₹{total:,}. Overall a solid selection!',
        'items_analysis': [{'name': p['name'], 'judgment': 'Good Value', 'reason': f'Rated {p["rating"]}/5 with great reviews.', 'keep': True} for p in cart_products],
        'best_item': cart_products[0]['name'] if cart_products else '',
        'questionable_item': '',
        'money_saving_tip': 'Check our Deal Sniper for even better value alternatives!',
        'total_verdict': f'₹{total:,} is a reasonable spend for these quality products.',
        'total': total,
        'empty': False
    })

# ══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ══════════════════════════════════════════════════════════════════════════════


# ── Image Search ───────────────────────────────────────────────────────────────
@app.route('/api/ai/image-search', methods=['POST'])
def ai_image_search():
    d = request.get_json() or {}
    label = d.get('label', '').lower().strip()

    # Smart keyword-based category detection
    detected_cat = None
    keywords = []

    if any(w in label for w in ['shoe','sneaker','boot','sandal','heel','trainer','jordan','nike shoe','adidas shoe']):
        detected_cat, keywords = 'Shoes', label.split()
    elif any(w in label for w in ['shirt','jeans','dress','jacket','hoodie','trouser','kurta','tshirt','t-shirt','blazer']):
        detected_cat, keywords = 'Clothing', label.split()
    elif any(w in label for w in ['phone','iphone','samsung','laptop','macbook','headphone','earphone','watch','tablet','tv','camera','speaker','earbuds']):
        detected_cat, keywords = 'Electronics', label.split()
    elif any(w in label for w in ['bag','backpack','wallet','purse','luggage','sling','tote','briefcase']):
        detected_cat, keywords = 'Bags', label.split()
    elif any(w in label for w in ['yoga','gym','dumbbell','fitness','cricket','football','tennis','badminton','running shoe','sports']):
        detected_cat, keywords = 'Sports', label.split()
    elif any(w in label for w in ['cream','serum','shampoo','lipstick','makeup','skincare','moisturiser','foundation','sunscreen']):
        detected_cat, keywords = 'Beauty', label.split()
    elif any(w in label for w in ['game','gaming','controller','console','keyboard','mouse','monitor','ps5','xbox','nintendo']):
        detected_cat, keywords = 'Gaming', label.split()
    elif any(w in label for w in ['book','novel','author','read']):
        detected_cat, keywords = 'Books', label.split()
    elif any(w in label for w in ['protein','vitamin','supplement','whey','health','nutrition','multivitamin']):
        detected_cat, keywords = 'Health', label.split()
    elif any(w in label for w in ['cooker','mixer','fridge','washing','vacuum','iron','mattress','coffee','air fryer']):
        detected_cat, keywords = 'Home', label.split()
    else:
        keywords = label.split() if label else ['trending']

    # Find matching products
    items = list(PRODUCTS)
    if detected_cat:
        cat_items = [p for p in items if p['category'] == detected_cat]
        items = cat_items if cat_items else items

    # Score by keyword match
    def score(p):
        s = 0
        text = (p['name'] + ' ' + p['brand'] + ' ' + ' '.join(p.get('tags', []))).lower()
        for kw in keywords:
            if len(kw) > 2 and kw in text:
                s += 10
        return s

    scored = sorted(items, key=lambda p: -score(p))
    results = scored[:8]

    return _ok({
        'products': results,
        'analysis': {
            'detected': detected_cat or label or 'Products',
            'confidence': 88,
            'tags': keywords[:5],
        }
    })


ADMIN_EMAILS = ['admin@zync.com', 'pranjal@zync.com']  # Add your email here

def _is_admin():
    user = _current_user()
    if not user: return False
    return user.get('email','') in ADMIN_EMAILS or user.get('is_admin', False)

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    if not _is_admin(): return _err('Unauthorized', 403)
    
    all_users = []
    all_orders = []
    
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users")
                all_users = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT * FROM orders ORDER BY date DESC")
                all_orders = [dict(r) for r in cur.fetchall()]
        except: pass
    else:
        all_users = list(_users.values())
        all_orders = [o for orders in _orders.values() for o in orders]

    total_revenue = sum(float(o.get('total', 0)) for o in all_orders)
    
    # Orders by status
    status_counts = {}
    for o in all_orders:
        s = o.get('status', 'confirmed')
        status_counts[s] = status_counts.get(s, 0) + 1

    # Revenue by day (last 7 days)
    from datetime import datetime, timedelta
    today = datetime.now()
    daily_revenue = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime('%a')
        day_orders = [o for o in all_orders if o.get('date') and str(o['date'])[:10] == day.strftime('%Y-%m-%d')]
        daily_revenue.append({'day': day_str, 'revenue': sum(float(o.get('total',0)) for o in day_orders), 'orders': len(day_orders)})

    # Top products
    from collections import Counter
    all_items = []
    for o in all_orders:
        items = o.get('items', [])
        if isinstance(items, str):
            import json as _j
            try: items = _j.loads(items)
            except: items = []
        for item in items:
            all_items.append(item.get('name', ''))
    top_products = Counter(all_items).most_common(5)

    return _ok({
        'total_users': len(all_users),
        'total_orders': len(all_orders),
        'total_revenue': round(total_revenue, 2),
        'total_products': len(PRODUCTS),
        'status_counts': status_counts,
        'daily_revenue': daily_revenue,
        'top_products': [{'name': n, 'count': c} for n, c in top_products],
        'recent_orders': all_orders[:10],
        'recent_users': [{'name': u.get('name'), 'email': u.get('email'), 'created_at': str(u.get('created_at',''))} for u in all_users[-5:]],
    })

@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    if not _is_admin(): return _err('Unauthorized', 403)
    all_users = []
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT email, name, phone, created_at FROM users ORDER BY created_at DESC")
                all_users = [dict(r) for r in cur.fetchall()]
        except: pass
    else:
        all_users = [{'email': u['email'], 'name': u['name'], 'phone': u.get('phone','')} for u in _users.values()]
    return _ok(all_users, total=len(all_users))

@app.route('/api/admin/orders', methods=['GET'])
def admin_orders():
    if not _is_admin(): return _err('Unauthorized', 403)
    all_orders = []
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM orders ORDER BY date DESC LIMIT 100")
                all_orders = [dict(r) for r in cur.fetchall()]
        except: pass
    else:
        all_orders = [o for orders in _orders.values() for o in orders]
        all_orders.sort(key=lambda x: x.get('date',''), reverse=True)
    return _ok(all_orders, total=len(all_orders))

@app.route('/api/admin/orders/<order_id>/status', methods=['PATCH'])
def admin_update_order(order_id):
    if not _is_admin(): return _err('Unauthorized', 403)
    d = request.get_json() or {}
    status = d.get('status', 'confirmed')
    if USE_PG:
        try:
            conn = get_db()
            with conn.cursor() as cur:
                cur.execute("UPDATE orders SET status=%s WHERE order_id=%s", (status, order_id))
            return _ok({'order_id': order_id, 'status': status})
        except Exception as e:
            return _err(str(e))
    return _ok({'order_id': order_id, 'status': status})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    d = request.get_json() or {}
    email = d.get('email','').lower().strip()
    password = d.get('password','')
    user = _get_user(email)
    if not user: return _err('Invalid credentials', 401)
    if user['password'] != hashlib.sha256(password.encode()).hexdigest():
        return _err('Invalid credentials', 401)
    if email not in ADMIN_EMAILS and not user.get('is_admin'):
        return _err('Not an admin account', 403)
    session['user_email'] = email
    return _ok({'name': user['name'], 'email': email, 'is_admin': True})


if __name__ == '__main__':
    app.run(debug=True, port=5000)