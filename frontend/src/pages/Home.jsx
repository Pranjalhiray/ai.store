import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { api, fmt } = useApp();
  const [trending, setTrending] = useState([]);
  const [feed, setFeed] = useState([]);
  const [electronics, setElectronics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api('/api/trending?num=8').then(r => r.success && setTrending(r.data));
    api('/api/feed?num=8').then(r => r.success && setFeed(r.data));
    api('/api/category/Electronics/picks').then(r => r.success && setElectronics(r.data));
  }, []);

  const categories = ['Shoes','Clothing','Electronics','Sports','Bags','Beauty','Gaming','Health'];

  return (
    <div>
      {/* Hero */}
      <section id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">🤖 <span>AI-Powered Recommendations</span></div>
            <h1 className="hero-title">Shop Smarter with <em>Artificial Intelligence</em></h1>
            <p className="hero-sub">ZYNC learns your taste and curates the perfect products just for you.</p>
            <div className="hero-btns">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>Explore Store →</button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/ai')}>See AI Features ✨</button>
            </div>
            <div className="hero-stats">
              <div className="stat-item"><div className="stat-num">51+</div><div className="stat-label">Products</div></div>
              <div className="stat-item"><div className="stat-num">8</div><div className="stat-label">Categories</div></div>
              <div className="stat-item"><div className="stat-num">AI</div><div className="stat-label">Powered</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Browse Categories</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {categories.map(c => (
              <div key={c} className="cat-tab" onClick={() => navigate(`/shop?category=${c}`)}>{c}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div><h2 className="section-title">🔥 Trending Now</h2><div className="section-sub">Most popular products</div></div>
              <button className="btn btn-outline" onClick={() => navigate('/shop')}>View All →</button>
            </div>
            <div className="products-grid stagger">
              {trending.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* AI Picks */}
      {feed.length > 0 && (
        <section className="section" style={{ background: 'var(--bg2)', padding: '60px 0' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <div className="ai-section-tag"><div className="ai-pulse"></div>AI CURATED FOR YOU</div>
                <h2 className="section-title">✨ Your AI Picks</h2>
              </div>
            </div>
            <div className="products-grid stagger">
              {feed.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Electronics */}
      {electronics.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div><h2 className="section-title">⚡ Electronics</h2></div>
              <button className="btn btn-outline" onClick={() => navigate('/shop?category=Electronics')}>View All →</button>
            </div>
            <div className="products-grid stagger">
              {electronics.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}