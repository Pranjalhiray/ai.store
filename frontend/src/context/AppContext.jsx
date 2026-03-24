import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export const AppContext = createContext();

// ── Detect prod vs dev automatically ──────────────────────────────────────────
const BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';   // same origin in production (Render)

// ── In-memory cache (TTL-based) ───────────────────────────────────────────────
const _cache   = new Map();   // key → { data, ts }
const _pending = new Map();   // key → Promise  (deduplication)
const CACHE_TTL = {
  default:      30_000,   // 30s
  '/api/feed':  60_000,   // 1 min
  '/api/trending': 90_000,
};

function getTTL(url) {
  for (const [k, v] of Object.entries(CACHE_TTL)) {
    if (url.includes(k)) return v;
  }
  return CACHE_TTL.default;
}

function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) { _cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key, data, ttl) {
  _cache.set(key, { data, ts: Date.now(), ttl });
}
function cacheInvalidate(...prefixes) {
  for (const [k] of _cache) {
    if (prefixes.some(p => k.includes(p))) _cache.delete(k);
  }
}

// ── Core fetch with cache + dedup ─────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const fullUrl = BASE + url;
  const isGET   = !options.method || options.method === 'GET';

  if (isGET) {
    const cached = cacheGet(url);
    if (cached) return cached;

    // Deduplication: if the exact same GET is already in-flight, wait for it
    if (_pending.has(url)) return _pending.get(url);

    const promise = fetch(fullUrl, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) cacheSet(url, data, getTTL(url));
        _pending.delete(url);
        return data;
      })
      .catch(err => {
        _pending.delete(url);
        console.error('API error:', url, err);
        return { success: false, error: 'Network error' };
      });

    _pending.set(url, promise);
    return promise;
  }

  // Mutations — bypass cache
  const res = await fetch(fullUrl, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  return data;
}

// ── Toast helper (module-level so it's stable) ───────────────────────────────
let _toastCount = 0;
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = msg;
  const bottom = 24 + _toastCount * 62;
  const bg = type === 'error' ? '#ff5c6e'
           : type === 'info'  ? '#5badff'
           : '#3fdfaa';
  el.style.cssText = `
    position:fixed; bottom:${bottom}px; right:24px;
    background:${bg}; color:#fff;
    padding:13px 20px; border-radius:12px;
    font-size:14px; font-family:var(--font);
    z-index:9999; animation:slideIn 0.3s ease;
    max-width:320px; box-shadow:0 8px 32px rgba(0,0,0,0.4);
    backdrop-filter:blur(12px);
  `;
  _toastCount++;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); _toastCount = Math.max(0, _toastCount - 1); }, 3200);
}

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [cart,     setCart]     = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const initRef = useRef(false);

  /* ── Stable api helper (exposes the cached fetcher to pages) ── */
  const api = useCallback((url, options) => apiFetch(url, options), []);

  const fmt = (n) =>
    '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

  const toast = useCallback((msg, type = 'success') => showToast(msg, type), []);

  /* ── Cart & Wishlist loaders ── */
  const loadCart = useCallback(async () => {
    // Always fresh after mutations
    cacheInvalidate('/api/cart');
    const r = await api('/api/cart');
    if (r.success) setCart(r.data);
  }, [api]);

  const loadWishlist = useCallback(async () => {
    cacheInvalidate('/api/wishlist');
    const r = await api('/api/wishlist');
    if (r.success)
      setWishlist(Array.isArray(r.data)
        ? r.data.map(p => (typeof p === 'object' ? p.id : p))
        : []);
  }, [api]);

  /* ── Add to cart ── */
  const addToCart = async (productId, quantity = 1, color = '', size = '') => {
    const r = await api('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity, color, size }),
    });
    if (r.success) {
      setCart(r.data);
      toast('Added to cart! 🛒');
    } else {
      toast(r.error, 'error');
    }
    return r;
  };

  /* ── Remove from cart ── */
  const removeFromCart = async (productId) => {
    const r = await api(`/api/cart/${productId}`, { method: 'DELETE' });
    if (r.success) setCart(r.data);
  };

  /* ── Toggle wishlist ── */
  const toggleWishlist = async (productId) => {
    const r = await api(`/api/wishlist/${productId}`, { method: 'POST' });
    if (r.success) {
      setWishlist(r.data.wishlist);
      toast(r.data.wishlisted ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    }
  };

  /* ── Auth ── */
  const login = async (email, password) => {
    const r = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (r.success) {
      setUser(r.data);
      // Invalidate user-specific caches
      cacheInvalidate('/api/cart', '/api/wishlist', '/api/feed', '/api/orders');
      await Promise.all([loadCart(), loadWishlist()]);
      toast(`Welcome back, ${r.data.name}! 🎉`);
    }
    return r;
  };

  const register = async (name, email, password) => {
    const r = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (r.success) {
      setUser(r.data);
      toast(`Welcome to ZYNC, ${r.data.name}! 🎉`);
    }
    return r;
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null); setCart([]); setWishlist([]);
    // Clear all user-specific cache entries
    cacheInvalidate('/api/cart', '/api/wishlist', '/api/feed', '/api/orders', '/api/auth');
    toast('Logged out successfully');
  };

  /* ── Boot ── */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const r = await api('/api/auth/me');
      if (r.success) {
        setUser(r.data);
        await Promise.all([loadCart(), loadWishlist()]);
      }
      setLoading(false);
    })();
  }, [api, loadCart, loadWishlist]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <AppContext.Provider value={{
      user, cart, wishlist, loading,
      api, fmt, toast,
      addToCart, removeFromCart, toggleWishlist,
      login, register, logout,
      cartCount, cartTotal,
      loadCart, loadWishlist,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);