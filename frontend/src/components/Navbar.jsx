import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar({ onCartOpen, onAuthOpen }) {
  const { user, logout, cartCount } = useApp();
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('dark');
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();

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
      alert('Voice search is not supported in your browser. Try Chrome!');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      setSearch(transcript);
      navigate(`/shop?search=${encodeURIComponent(transcript)}`);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <>
      {/* Voice listening overlay */}
      {listening && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent-bd)', borderRadius: 24, padding: '48px 64px', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 24, animation: 'pulse 1s infinite' }}>🎤</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Listening...</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Speak now — e.g. "running shoes under 5000"</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: 6, height: 24, background: 'var(--accent)', borderRadius: 3, animation: `soundBar 0.8s ease ${i * 0.1}s infinite alternate` }} />
              ))}
            </div>
          </div>
          <style>{`
            @keyframes soundBar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
          `}</style>
        </div>
      )}

      <nav className="navbar">
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="logo">ZYNC<span>AI STORE</span></Link>

            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/shop" className="nav-link">Shop</Link>
              <Link to="/ai" className="nav-link">🤖 AI</Link>
              <Link to="/ai-advanced" className="nav-link">⚡ Advanced AI</Link>
              {user && <Link to="/wishlist" className="nav-link">Wishlist</Link>}
              {user && <Link to="/orders" className="nav-link">Orders</Link>}
            </div>

            <div className="nav-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                style={{ paddingRight: 40 }}
              />
              <button
                onClick={startVoiceSearch}
                title="Voice Search"
                style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: listening ? 'var(--accent)' : 'var(--text3)', transition: 'color 0.2s' }}
              >
                🎤
              </button>
            </div>

            <div className="nav-actions">
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
              <div className="nav-badge">
                <button className="btn-icon" onClick={onCartOpen}>
                  🛒 <span className="cart-count">{cartCount > 0 ? cartCount : ''}</span>
                </button>
              </div>
              {user ? (
                <div className="nav-user-menu">
                  <img src={user.avatar} alt={user.name} className="nav-avatar" onClick={() => navigate('/profile')} />
                  <div className="user-dropdown">
                    <div style={{ fontWeight: 600, padding: '4px 12px' }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', padding: '0 12px 8px' }}>{user.email}</div>
                    <Link to="/orders" className="dropdown-item">📦 Orders</Link>
                    <Link to="/wishlist" className="dropdown-item">❤️ Wishlist</Link>
                    <Link to="/profile" className="dropdown-item">👤 Profile</Link>
                    <div className="dropdown-item" onClick={logout} style={{ color: 'var(--red)', cursor: 'pointer' }}>🚪 Logout</div>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={onAuthOpen}>Login</button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}