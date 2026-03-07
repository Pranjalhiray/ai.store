"""
AI Store — Flask Backend with MongoDB
"""

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from pymongo import MongoClient
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
CORS(app, supports_credentials=True, origins=['http://localhost:5000',
                                               'http://127.0.0.1:5000',
                                               'https://ai-store-1wcn.onrender.com'])

# ── MongoDB connection ─────────────────────────────────────────────────────────
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://pranjalhiray7_db_user:Pranjaljennie7@cluster0.mjpgnon.mongodb.net/zync?appName=Cluster0')
client = MongoClient(MONGO_URI)
db = client['zync']

users_col   = db['users']
orders_col  = db['orders']
reviews_col = db['reviews']

# ── Imports ────────────────────────────────────────────────────────────────────
from data.products import products as PRODUCTS
from ml.recommender import (
    get_recommendations, get_personalized_feed,
    get_trending, get_category_picks, search_products, track_event
)

# ── Utilities ──────────────────────────────────────────────────────────────────

def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _current_user():
    email = session.get('user_email')
    if not email:
        return None
    user = users_col.find_one({'email': email}, {'_id': 0})
    return user

def _ok(data=None, **kwargs):
    resp = {'success': True}
    if data is not None:
        resp['data'] = data
    resp.update(kwargs)
    return jsonify(resp)

def _err(msg: str, code: int = 400):
    return jsonify({'success': False, 'error': msg}), code

# ── Static frontend ────────────────────────────────────────────────────────────

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
    name  = (d.get('name', '') or '').strip()
    email = (d.get('email', '') or '').strip().lower()
    pwd   = d.get('password', '')

    if not name or not email or not pwd:
        return _err('All fields required.')
    if '@' not in email:
        return _err('Invalid email.')
    if len(pwd) < 6:
        return _err('Password must be at least 6 characters.')
    if users_col.find_one({'email': email}):
        return _err('An account with this email already exists.')

    user = {
        'id':        str(uuid.uuid4()),
        'name':      name,
        'email':     email,
        'password':  _hash(pwd),
        'avatar':    f"https://api.dicebear.com/8.x/initials/svg?seed={name}",
        'joined':    datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'wishlist':  [],
        'cart':      [],
        'addresses': [],
    }
    users_col.insert_one({**user})
    session['user_email'] = email
    user.pop('password')
    return _ok(user), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    d     = request.get_json() or {}
    email = (d.get('email', '') or '').strip().lower()
    pwd   = d.get('password', '')

    user = users_col.find_one({'email': email}, {'_id': 0})
    if not user or user['password'] != _hash(pwd):
        return _err('Invalid email or password.', 401)

    session['user_email'] = email
    safe = dict(user)
    safe.pop('password')
    return _ok(safe)


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return _ok('Logged out.')


@app.route('/api/auth/me', methods=['GET'])
def me():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    safe = dict(user)
    safe.pop('password', None)
    return _ok(safe)

# ══════════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/products', methods=['GET'])
def get_products():
    cat   = request.args.get('category', 'All')
    brand = request.args.get('brand', '')
    sort  = request.args.get('sort', 'popular')
    min_p = request.args.get('min_price', type=float)
    max_p = request.args.get('max_price', type=float)
    page  = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    items = list(PRODUCTS)
    if cat and cat != 'All':
        items = [p for p in items if p['category'] == cat]
    if brand:
        items = [p for p in items if p['brand'] == brand]
    if min_p is not None:
        items = [p for p in items if p['price'] >= min_p]
    if max_p is not None:
        items = [p for p in items if p['price'] <= max_p]

    sort_map = {
        'popular':    lambda x: -x['reviews'],
        'rating':     lambda x: -x['rating'],
        'price_asc':  lambda x:  x['price'],
        'price_desc': lambda x: -x['price'],
        'newest':     lambda x: -x['id'],
        'discount':   lambda x: -(x['original_price'] - x['price']),
    }
    items.sort(key=sort_map.get(sort, sort_map['popular']))

    total = len(items)
    start = (page - 1) * limit
    paged = items[start:start + limit]

    categories = sorted({p['category'] for p in PRODUCTS})
    brands     = sorted({p['brand']    for p in PRODUCTS})

    return _ok(paged, total=total, page=page,
               categories=categories, brands=brands)


@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product(pid):
    p = next((x for x in PRODUCTS if x['id'] == pid), None)
    if not p:
        return _err('Product not found.', 404)
    user = _current_user()
    if user:
        track_event(user['email'], pid, 'view')
    p_reviews = list(reviews_col.find({'product_id': pid}, {'_id': 0}))
    return _ok({**p, 'customer_reviews': p_reviews})


@app.route('/api/search', methods=['GET'])
def search():
    q     = request.args.get('q', '')
    cat   = request.args.get('category', 'All')
    sort  = request.args.get('sort', '')
    min_p = request.args.get('min_price', type=float)
    max_p = request.args.get('max_price', type=float)
    brand = request.args.get('brand', '')

    filters = {'category': cat, 'sort': sort,
               'min_price': min_p, 'max_price': max_p,
               'brand': brand if brand else None}
    results = search_products(q, filters)
    return _ok(results, total=len(results))

# ══════════════════════════════════════════════════════════════════════════════
# AI RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/recommendations/<int:pid>', methods=['GET'])
def recommendations(pid):
    user = _current_user()
    uid  = user['email'] if user else None
    num  = request.args.get('num', 6, type=int)
    recs = get_recommendations(pid, num=num, user_id=uid)
    return _ok(recs)


@app.route('/api/feed', methods=['GET'])
def personalized_feed():
    user = _current_user()
    uid  = user['email'] if user else 'anonymous'
    num  = request.args.get('num', 12, type=int)
    feed = get_personalized_feed(uid, num=num)
    return _ok(feed)


@app.route('/api/trending', methods=['GET'])
def trending():
    return _ok(get_trending(8))


@app.route('/api/category/<cat>/picks', methods=['GET'])
def category_picks(cat):
    return _ok(get_category_picks(cat, 6))


@app.route('/api/track', methods=['POST'])
def track():
    user = _current_user()
    if not user:
        return _err('Login to personalise.', 401)
    d   = request.get_json() or {}
    pid = d.get('product_id')
    evt = d.get('event', 'view')
    if pid:
        track_event(user['email'], int(pid), evt)
    return _ok('Tracked.')

# ══════════════════════════════════════════════════════════════════════════════
# CART
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/cart', methods=['GET'])
def get_cart():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    return _ok(user.get('cart', []))


@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    d   = request.get_json() or {}
    pid = d.get('product_id')
    qty = int(d.get('quantity', 1))
    clr = d.get('color', '')
    sz  = d.get('size', '')

    product = next((x for x in PRODUCTS if x['id'] == pid), None)
    if not product:
        return _err('Product not found.', 404)

    track_event(user['email'], pid, 'cart')

    cart = user.get('cart', [])
    existing = next((i for i in cart
                     if i['product_id'] == pid
                     and i.get('color') == clr
                     and i.get('size') == sz), None)
    if existing:
        existing['quantity'] += qty
    else:
        cart.append({'product_id': pid, 'quantity': qty,
                     'color': clr, 'size': sz,
                     'name':  product['name'],
                     'price': product['price'],
                     'image': product['images'][0]})

    users_col.update_one({'email': user['email']}, {'$set': {'cart': cart}})
    return _ok(cart)


@app.route('/api/cart/<int:pid>', methods=['DELETE'])
def remove_from_cart(pid):
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    cart = [i for i in user.get('cart', []) if i['product_id'] != pid]
    users_col.update_one({'email': user['email']}, {'$set': {'cart': cart}})
    return _ok(cart)


@app.route('/api/cart/<int:pid>', methods=['PATCH'])
def update_cart(pid):
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    d    = request.get_json() or {}
    qty  = int(d.get('quantity', 1))
    cart = user.get('cart', [])
    for item in cart:
        if item['product_id'] == pid:
            item['quantity'] = qty
    users_col.update_one({'email': user['email']}, {'$set': {'cart': cart}})
    return _ok(cart)

# ══════════════════════════════════════════════════════════════════════════════
# WISHLIST
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    return _ok(user.get('wishlist', []))


@app.route('/api/wishlist/<int:pid>', methods=['POST'])
def toggle_wishlist(pid):
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    track_event(user['email'], pid, 'like')
    wl = user.get('wishlist', [])
    if pid in wl:
        wl.remove(pid)
        wishlisted = False
    else:
        wl.append(pid)
        wishlisted = True
    users_col.update_one({'email': user['email']}, {'$set': {'wishlist': wl}})
    return _ok({'wishlisted': wishlisted, 'wishlist': wl})

# ══════════════════════════════════════════════════════════════════════════════
# ORDERS / CHECKOUT
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/orders', methods=['GET'])
def get_orders():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    orders = list(orders_col.find({'user_email': user['email']},
                                  {'_id': 0}).sort('date', -1))
    return _ok(orders)


@app.route('/api/checkout', methods=['POST'])
def checkout():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)

    d       = request.get_json() or {}
    address = d.get('address', {})
    payment = d.get('payment', {})
    cart    = user.get('cart', [])

    if not cart:
        return _err('Cart is empty.')

    method = payment.get('method', 'card')
    if method == 'card':
        card_num = str(payment.get('card_number', '')).replace(' ', '')
        if len(card_num) < 13:
            return _err('Invalid card number.')
    elif method == 'upi':
        upi_id = payment.get('upi_id', '')
        if '@' not in upi_id:
            return _err('Invalid UPI ID.')
    elif method == 'netbanking':
        bank = payment.get('bank', '')
        if not bank:
            return _err('Please select a bank.')

    total = sum(i['price'] * i['quantity'] for i in cart)

    order = {
        'order_id':       'ORD-' + str(uuid.uuid4())[:8].upper(),
        'user_email':     user['email'],
        'date':           datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'items':          list(cart),
        'total':          total,
        'address':        address,
        'payment_method': method,
        'status':         'Confirmed',
        'tracking':       'TRK-' + str(uuid.uuid4())[:10].upper(),
        'estimated':      (datetime.datetime.now(datetime.timezone.utc) +
                           datetime.timedelta(days=5)).strftime('%b %d, %Y'),
    }

    orders_col.insert_one({**order})

    for item in cart:
        track_event(user['email'], item['product_id'], 'buy')

    users_col.update_one({'email': user['email']}, {'$set': {'cart': []}})
    return _ok(order), 201

# ══════════════════════════════════════════════════════════════════════════════
# REVIEWS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/products/<int:pid>/reviews', methods=['POST'])
def add_review(pid):
    user = _current_user()
    if not user:
        return _err('Login to review.', 401)
    d = request.get_json() or {}
    review = {
        'id':         str(uuid.uuid4()),
        'product_id': pid,
        'user':       user['name'],
        'avatar':     user['avatar'],
        'rating':     int(d.get('rating', 5)),
        'title':      d.get('title', ''),
        'body':       d.get('body', ''),
        'date':       datetime.datetime.now(datetime.timezone.utc).strftime('%b %d, %Y'),
        'helpful':    0,
    }
    reviews_col.insert_one({**review})
    review.pop('_id', None)
    return _ok(review), 201

# ══════════════════════════════════════════════════════════════════════════════
# USER PROFILE
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/profile', methods=['PATCH'])
def update_profile():
    user = _current_user()
    if not user:
        return _err('Not authenticated.', 401)
    d = request.get_json() or {}
    update = {}
    for field in ('name', 'phone', 'avatar'):
        if field in d:
            update[field] = d[field]
    if 'address' in d:
        users_col.update_one({'email': user['email']},
                             {'$push': {'addresses': d['address']}})
    if update:
        users_col.update_one({'email': user['email']}, {'$set': update})
    safe = dict(_current_user())
    safe.pop('password', None)
    return _ok(safe)

# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    app.run(debug=True, port=5000)