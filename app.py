"""
AI Store — Flask Backend with MongoDB + Memory Fallback
"""

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from dotenv import load_dotenv
import os, uuid, hashlib, datetime

load_dotenv()

# ── App setup ──────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder='static')
app.secret_key = os.getenv('SECRET_KEY', 'zync-ai-store-secret-2024')
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_HTTPONLY=True,
)
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://ai-store-1wcn.onrender.com'
])

# ── MongoDB with fallback ──────────────────────────────────────────────────────
MONGO_URI = os.getenv('MONGO_URI', '')
db = None
users_col = orders_col = reviews_col = None

try:
    if MONGO_URI:
        from pymongo import MongoClient
        client = MongoClient(MONGO_URI,
                     serverSelectionTimeoutMS=3000,
                     connectTimeoutMS=3000,
                     socketTimeoutMS=3000,
                     tls=True,
                     tlsAllowInvalidCertificates=True)
        client.admin.command('ping')  # test connection
        db = client['zync']
        users_col   = db['users']
        orders_col  = db['orders']
        reviews_col = db['reviews']
        print("✅ MongoDB connected!")
    else:
        print("⚠️ No MONGO_URI — using memory storage")
except Exception as e:
    print(f"⚠️ MongoDB failed: {e} — using memory storage")

# ── Memory fallback stores ─────────────────────────────────────────────────────
_users   = {}   # {email: user}
_orders  = {}   # {email: [orders]}
_reviews = {}   # {pid: [reviews]}

# ── Imports ────────────────────────────────────────────────────────────────────
from data.products import products as PRODUCTS
from ml.recommender import (
    get_recommendations, get_personalized_feed,
    get_trending, get_category_picks, search_products, track_event
)

# ── DB helpers (work with both MongoDB and memory) ─────────────────────────────

def _use_mongo():
    return users_col is not None

def _get_user(email):
    if _use_mongo():
        return users_col.find_one({'email': email}, {'_id': 0})
    return _users.get(email)

def _save_user(user):
    if _use_mongo():
        users_col.update_one({'email': user['email']},
                             {'$set': user}, upsert=True)
    else:
        _users[user['email']] = user

def _insert_user(user):
    if _use_mongo():
        users_col.insert_one(dict(user))
    else:
        _users[user['email']] = dict(user)

def _user_exists(email):
    if _use_mongo():
        return users_col.find_one({'email': email}) is not None
    return email in _users

def _get_orders(email):
    if _use_mongo():
        return list(orders_col.find({'user_email': email}, {'_id': 0}).sort('date', -1))
    return _orders.get(email, [])

def _insert_order(order):
    if _use_mongo():
        orders_col.insert_one(dict(order))
    else:
        _orders.setdefault(order['user_email'], []).insert(0, order)

def _get_reviews(pid):
    if _use_mongo():
        return list(reviews_col.find({'product_id': pid}, {'_id': 0}))
    return _reviews.get(pid, [])

def _insert_review(review):
    if _use_mongo():
        reviews_col.insert_one(dict(review))
    else:
        _reviews.setdefault(review['product_id'], []).insert(0, review)

def _update_cart(email, cart):
    if _use_mongo():
        users_col.update_one({'email': email}, {'$set': {'cart': cart}})
    else:
        if email in _users:
            _users[email]['cart'] = cart

def _update_wishlist(email, wishlist):
    if _use_mongo():
        users_col.update_one({'email': email}, {'$set': {'wishlist': wishlist}})
    else:
        if email in _users:
            _users[email]['wishlist'] = wishlist

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
@app.route('/')
@app.route('/app')
def frontend():
    return send_from_directory('static', 'index.html')

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
    cat   = request.args.get('category','All')
    brand = request.args.get('brand','')
    sort  = request.args.get('sort','popular')
    min_p = request.args.get('min_price', type=float)
    max_p = request.args.get('max_price', type=float)
    page  = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    items = list(PRODUCTS)
    if cat and cat != 'All': items = [p for p in items if p['category']==cat]
    if brand: items = [p for p in items if p['brand']==brand]
    if min_p is not None: items = [p for p in items if p['price']>=min_p]
    if max_p is not None: items = [p for p in items if p['price']<=max_p]

    sort_map = {
        'popular':   lambda x: -x['reviews'],
        'rating':    lambda x: -x['rating'],
        'price_asc': lambda x:  x['price'],
        'price_desc':lambda x: -x['price'],
        'newest':    lambda x: -x['id'],
        'discount':  lambda x: -(x['original_price']-x['price']),
    }
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)