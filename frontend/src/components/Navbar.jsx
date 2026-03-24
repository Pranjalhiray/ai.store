import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar({ onCartOpen, onAuthOpen }) {
  const { user, logout, cartCount } = useApp();
  const [search, setSearch]     = useState('');
  const [theme, setTheme]       = useState('dark');
  const [listening, setListening] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  /* ── Scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close menu on route change ── */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search needs Chrome or Edge!');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.onresult = (event) => {
      const t = event.results[0][0].transcript;
      setListening(false);
      setSearch(t);
      navigate(`/shop?search=${encodeURIComponent(t)}`);
    };
    recognition.onerror  = () => setListening(false);
    recognition.onend    = () => setListening(false);
    recognition.start();
  };

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  const navLinks = [
    { to: '/',               label: 'Home',          icon: '🏠' },
    { to: '/shop',           label: 'Shop',          icon: '🛍️' },
    { to: '/ai',             label: '🤖 AI',          icon: '🤖' },
    { to: '/ai-advanced',    label: '⚡ Advanced AI',  icon: '⚡' },
    { to: '/visualizations', label: '📊 Analytics',   icon: '📊' },
    { to: '/image-search',   label: '🖼️ Image Search', icon: '🖼️' },
    ...(user ? [
      { to: '/wishlist', label: 'Wishlist', icon: '❤️' },
      { to: '/orders',   label: 'Orders',   icon: '📦' },
      { to: '/profile',  label: 'Profile',  icon: '👤' },
    ] : []),
  ];

  return (
    <>
      {/* ── Voice listening overlay ── */}
      {listening && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            background: 'rgba(10,13,22,0.9)',
            border: '1px solid rgba(232,184,109,0.25)',
            borderRadius: 28, padding: '52px 72px',
            textAlign: 'center',
            boxShadow: '0 0 60px rgba(232,184,109,0.15)',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: 'voicePulse 1s ease-in-out infinite alternate' }}>🎤</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-d)' }}>Listening…</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>
              Say something like <em style={{ color: 'var(--accent)' }}>"running shoes under 5000"</em>
            </div>
            {/* Sound bars */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'flex-end', height: 32 }}>
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} style={{
                  width: 5, borderRadius: 3,
                  background: `linear-gradient(180deg, var(--accent) 0%, #d4a054 100%)`,
                  animation: `soundBar 0.6s ease ${i * 0.09}s infinite alternate`,
                  height: '100%',
                }} />
              ))}
            </div>
          </div>
          <style>{`
            @keyframes soundBar { from{transform:scaleY(0.2)} to{transform:scaleY(1)} }
            @keyframes voicePulse { from{transform:scale(0.95)} to{transform:scale(1.05)} }
          `}</style>
        </div>
      )}

      {/* ── Mobile Menu ── */}
      <div className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>ZYNC</span>
          <button
            onClick={() => setMenuOpen(false)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, width: 38, height: 38, color: 'var(--text)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >✕</button>
        </div>
        <input
          className="mobile-search"
          placeholder="🔍 Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { handleSearch(e); setMenuOpen(false); }}
        />
        {navLinks.map(l => (
          <Link
            key={l.to} to={l.to}
            onClick={() => setMenuOpen(false)}
            style={{ color: isActive(l.to) ? 'var(--accent)' : undefined }}
          >
            <span>{l.icon}</span> {l.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          {!user ? (
            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '14px' }}
              onClick={() => { onAuthOpen(); setMenuOpen(false); }}
            >
              Login / Register
            </button>
          ) : (
            <div
              style={{ color: 'var(--red)', fontWeight: 600, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}
              onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
            >
              🚪 Logout
            </div>
          )}
        </div>
      </div>

      {/* ── Navbar ── */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="logo">
              ZYNC<span>AI STORE</span>
            </Link>

            <div className="nav-links">
              <Link to="/"               className={`nav-link${isActive('/')        ? ' active' : ''}`}>Home</Link>
              <Link to="/shop"           className={`nav-link${isActive('/shop')    ? ' active' : ''}`}>Shop</Link>
              <Link to="/ai"             className={`nav-link${isActive('/ai')      ? ' active' : ''}`}>🤖 AI</Link>
              <Link to="/ai-advanced"    className={`nav-link${isActive('/ai-adv')  ? ' active' : ''}`}>⚡ Advanced</Link>
              <Link to="/visualizations" className={`nav-link${isActive('/visual')  ? ' active' : ''}`}>📊 Analytics</Link>
              <Link to="/image-search"   className={`nav-link${isActive('/image')   ? ' active' : ''}`}>🖼️ Image</Link>
              {user && <Link to="/wishlist" className={`nav-link${isActive('/wish') ? ' active' : ''}`}>❤️ Wishlist</Link>}
              {user && <Link to="/orders"   className={`nav-link${isActive('/ord')  ? ' active' : ''}`}>📦 Orders</Link>}
            </div>

            {/* Glowing search */}
            <div className="nav-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                style={{ paddingRight: 44 }}
              />
              <button
                onClick={startVoiceSearch}
                title="Voice Search"
                style={{
                  position: 'absolute', right: 10,
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16,
                  color: listening ? 'var(--accent)' : 'var(--text3)',
                  transition: 'color 0.2s, transform 0.2s',
                  transform: listening ? 'scale(1.3)' : 'scale(1)',
                }}
              >🎤</button>
            </div>

            <div className="nav-actions">
              <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>

              <NotificationCenter />

              <div className="nav-badge">
                <button
                  className="btn-icon"
                  onClick={onCartOpen}
                  style={{
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 10, width: 42, height: 42,
                    fontSize: 18, position: 'relative',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; e.currentTarget.style.background = 'var(--bg4)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}
                >
                  🛒
                  {cartCount > 0 && (
                    <span className="cart-count">{cartCount > 9 ? '9+' : cartCount}</span>
                  )}
                </button>
              </div>

              {user ? (
                <div className="nav-user-menu">
                  <img
                    src={user.avatar} alt={user.name}
                    className="nav-avatar"
                    onClick={() => navigate('/profile')}
                    onError={e => e.target.src = `https://ui-avatars.com/api/?name=${user.name}&size=96&background=e8b86d&color=0a0a0a`}
                  />
                  <div className="user-dropdown">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 12px' }}>
                      <img
                        src={user.avatar} alt={user.name}
                        style={{ width: 36, height: 36, borderRadius: 9, border: '2px solid var(--accent-bd)' }}
                        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${user.name}&size=96`}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user.email}</div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '0 4px 8px' }} />
                    <Link to="/orders"   className="dropdown-item">📦 Orders</Link>
                    <Link to="/wishlist" className="dropdown-item">❤️ Wishlist</Link>
                    <Link to="/profile"  className="dropdown-item">👤 Profile</Link>
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />
                    <div className="dropdown-item" onClick={logout} style={{ color: 'var(--red)' }}>🚪 Logout</div>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={onAuthOpen}>Login</button>
              )}

              <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}