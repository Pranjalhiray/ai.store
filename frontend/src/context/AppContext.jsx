import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();
const BASE = 'http://localhost:5000';

export function AppProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [cart, setCart]       = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const api = useCallback(async (url, options = {}) => {
    const res = await fetch(BASE + url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return res.json();
  }, []);

  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

  const toast = (msg, type = 'success') => {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = msg;
    el.style.cssText = `position:fixed;bottom:${80 + document.querySelectorAll('.toast').length * 60}px;right:24px;background:${type==='error'?'#ff5c5c':type==='info'?'#4f9eff':'#3dd68c'};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;animation:slideIn 0.3s ease;max-width:300px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const loadCart = useCallback(async () => {
    const r = await api('/api/cart');
    if (r.success) setCart(r.data);
  }, [api]);

  const loadWishlist = useCallback(async () => {
    const r = await api('/api/wishlist');
    if (r.success) setWishlist(Array.isArray(r.data) ? r.data.map(p => typeof p === 'object' ? p.id : p) : []);
  }, [api]);

  const addToCart = async (productId, quantity = 1) => {
    const r = await api('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (r.success) { setCart(r.data); toast('Added to cart! 🛒'); }
    else toast(r.error, 'error');
    return r;
  };

  const removeFromCart = async (productId) => {
    const r = await api('/api/cart', {
      method: 'DELETE',
      body: JSON.stringify({ product_id: productId }),
    });
    if (r.success) setCart(r.data);
  };

  const toggleWishlist = async (productId) => {
    const r = await api(`/api/wishlist/${productId}`, { method: 'POST' });
    if (r.success) {
      const inWish = r.data.wishlisted;
      setWishlist(r.data.wishlist);
      toast(inWish ? 'Added to wishlist! ❤️' : 'Removed from wishlist');
    }
  };

  const login = async (email, password) => {
    const r = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (r.success) {
      setUser(r.data);
      await loadCart();
      await loadWishlist();
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
    setUser(null);
    setCart([]);
    setWishlist([]);
    toast('Logged out successfully');
  };

  useEffect(() => {
    (async () => {
      const r = await api('/api/auth/me');
      if (r.success) {
        setUser(r.data);
        await loadCart();
        await loadWishlist();
      }
      setLoading(false);
    })();
  }, [api, loadCart, loadWishlist]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <AppContext.Provider value={{
      user, cart, wishlist, loading, api, fmt, toast,
      addToCart, removeFromCart, toggleWishlist,
      login, register, logout,
      cartCount, cartTotal, loadCart, loadWishlist,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);