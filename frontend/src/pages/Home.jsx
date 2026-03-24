import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const SLIDES = [
  {
    id: 1,
    tag: '🔥 NEW ARRIVALS',
    title: 'Nike Air Max 270',
    subtitle: 'Step into the future of comfort',
    cta: 'Shop Shoes',
    link: '/shop?category=Shoes',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accent: '#e8b86d',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    badge: 'UP TO 40% OFF',
  },
  {
    id: 2,
    tag: '⚡ JUST LAUNCHED',
    title: 'iPhone 15 Pro',
    subtitle: 'Titanium. So strong. So light.',
    cta: 'Explore Electronics',
    link: '/shop?category=Electronics',
    bg: 'linear-gradient(135deg, #0f0f1a 0%, #1a0533 50%, #2d1b69 100%)',
    accent: '#a78bfa',
    image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aXBob25lfGVufDB8fDB8fHww',
    badge: 'JUST LAUNCHED',
  },
  {
    id: 3,
    tag: '🤖 AI PICKS',
    title: 'Your Style, Curated',
    subtitle: 'AI-powered recommendations just for you',
    cta: 'See AI Features',
    link: '/ai',
    bg: 'linear-gradient(135deg, #0d1117 0%, #1a2332 50%, #0f2027 100%)',
    accent: '#3dd68c',
    image: 'https://plus.unsplash.com/premium_photo-1677269465314-d5d2247a0b0c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDcyfHx8ZW58MHx8fHx8',
    badge: '15+ AI FEATURES',
  },
  {
    id: 4,
    tag: '💰 MEGA SALE',
    title: 'Up to 60% Off',
    subtitle: 'Biggest sale of the season — limited time',
    cta: 'Grab Deals',
    link: '/shop',
    bg: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 50%, #3d1f00 100%)',
    accent: '#ff6b35',
    image: 'https://plus.unsplash.com/premium_photo-1683746792239-6ce8cdd3ac78?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    badge: 'ENDS SOON',
  },
];

const CATEGORIES = [
  { name: 'Shoes', icon: '👟', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', color: '#e8b86d', desc: '50+ styles' },
  { name: 'Clothing', icon: '👕', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', color: '#4f9eff', desc: '70+ items' },
  { name: 'Electronics', icon: '📱', image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400', color: '#a78bfa', desc: '60+ gadgets' },
  { name: 'Sports', icon: '⚽', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', color: '#3dd68c', desc: '50+ gear' },
  { name: 'Bags', icon: '👜', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', color: '#f59e0b', desc: '30+ bags' },
  { name: 'Beauty', icon: '✨', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', color: '#ec4899', desc: '40+ products' },
  { name: 'Gaming', icon: '🎮', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', color: '#22d3ee', desc: '30+ items' },
  { name: 'Books', icon: '📚', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', color: '#fb923c', desc: '40+ titles' },
  { name: 'Health', icon: '💪', image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400', color: '#34d399', desc: '40+ items' },
  { name: 'Home', icon: '🏠', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', color: '#60a5fa', desc: '40+ items' },
];

const BANNERS = [
  {
    title: 'Premium Gaming Setup',
    sub: 'Build your dream battlestation',
    cta: 'Shop Gaming',
    link: '/shop?category=Gaming',
    bg: 'linear-gradient(120deg, #0f0f1a, #1a0533)',
    accent: '#a78bfa',
    image: 'https://images.unsplash.com/photo-1593640408182-31c228e30b8b?w=600',
  },
  {
    title: 'Beauty Essentials',
    sub: 'Glow up with premium skincare',
    cta: 'Shop Beauty',
    link: '/shop?category=Beauty',
    bg: 'linear-gradient(120deg, #1a0015, #2d0033)',
    accent: '#ec4899',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
  },
];

export default function Home() {
  const { api, fmt } = useApp();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [trending, setTrending] = useState([]);
  const [shoes, setShoes] = useState([]);
  const [electronics, setElectronics] = useState([]);
  const [books, setBooks] = useState([]);
  const [health, setHealth] = useState([]);
  const [feed, setFeed] = useState([]);
  const [dealIdx, setDealIdx] = useState(0);
  const [dealTime, setDealTime] = useState(3 * 3600 + 24 * 60 + 59);
  const timerRef = useRef();

  useEffect(() => {
    api('/api/trending?num=8').then(r => r.success && setTrending(r.data));
    api('/api/feed?num=8').then(r => r.success && setFeed(r.data));
    api('/api/products?category=Shoes&limit=6&sort=popular').then(r => r.success && setShoes(r.data));
    api('/api/products?category=Electronics&limit=6&sort=popular').then(r => r.success && setElectronics(r.data));
    api('/api/products?category=Books&limit=6&sort=popular').then(r => r.success && setBooks(r.data));
    api('/api/products?category=Health&limit=6&sort=popular').then(r => r.success && setHealth(r.data));
  }, []);

  // Auto slide
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDealTime(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fmtTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return { h, m, sec };
  };
  const { h, m, sec } = fmtTime(dealTime);

  const SectionHeader = ({ icon, title, sub, link, linkLabel }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{icon} {title}</h2>
        {sub && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
      </div>
      {link && (
        <button className="btn btn-outline btn-sm" onClick={() => navigate(link)}>
          {linkLabel || 'View All →'}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── HERO SLIDER ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        {SLIDES.map((s, i) => (
          <div key={s.id} style={{
            position: 'absolute', inset: 0, background: s.bg,
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            opacity: i === slide ? 1 : 0,
            transform: i === slide ? 'scale(1)' : 'scale(1.03)',
            pointerEvents: i === slide ? 'auto' : 'none',
            display: 'flex', alignItems: 'center',
          }}>
            {/* Background image */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', overflow: 'hidden' }}>
              <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, filter: 'blur(1px)' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${s.bg.split(',')[0].replace('linear-gradient(135deg, ', '')}, transparent)` }} />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ maxWidth: 560 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${s.accent}20`, border: `1px solid ${s.accent}40`, borderRadius: 50, padding: '6px 16px', marginBottom: 20, fontSize: 12, fontWeight: 700, color: s.accent, letterSpacing: 1 }}>
                  {s.tag}
                </div>
                <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: -2 }}>
                  {s.title}
                </h1>
                <p style={{ fontSize: 18, color: 'var(--text2)', marginBottom: 32, lineHeight: 1.5 }}>
                  {s.subtitle}
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button className="btn btn-primary btn-lg" style={{ background: s.accent, color: '#000', border: 'none' }} onClick={() => navigate(s.link)}>
                    {s.cta} →
                  </button>
                  <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 50, fontSize: 12, fontWeight: 700, color: s.accent, border: `1px solid ${s.accent}60` }}>
                    {s.badge}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide indicators */}
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 32 : 8, height: 8, borderRadius: 4, background: i === slide ? 'var(--accent)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Prev/Next arrows */}
        {['←','→'].map((arrow, i) => (
          <button key={arrow} onClick={() => setSlide(s => (s + (i === 0 ? -1 : 1) + SLIDES.length) % SLIDES.length)}
            style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [i === 0 ? 'left' : 'right']: 20, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {arrow}
          </button>
        ))}
      </section>

      {/* ── FLASH SALE BANNER ─────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(90deg, #ff4e00, #ec9f05, #ff4e00)', backgroundSize: '200% 100%', padding: '14px 0', animation: 'shimmer 3s linear infinite' }}>
        <style>{`@keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }`}</style>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#000' }}>FLASH SALE — Ends in:</span>
            {[h, m, sec].map((t, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ background: '#000', color: '#fff', fontWeight: 900, fontSize: 20, padding: '4px 10px', borderRadius: 6, fontFamily: 'monospace' }}>{t}</span>
                {i < 2 && <span style={{ fontWeight: 900, fontSize: 18, color: '#000' }}>:</span>}
              </span>
            ))}
          </div>
          <button className="btn btn-sm" style={{ background: '#000', color: '#fff', fontWeight: 700, borderRadius: 50, padding: '8px 20px', border: 'none' }} onClick={() => navigate('/shop')}>
            Shop Now →
          </button>
        </div>
      </div>

      {/* ── CATEGORIES GRID ───────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <SectionHeader icon="🛍️" title="Shop by Category" sub="Explore our curated collections" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.name} onClick={() => navigate(`/shop?category=${cat.name}`)}
                style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', aspectRatio: i < 2 ? '1.2' : '0.9', transition: 'all 0.3s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${cat.color}40`; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)` }} />
                <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: `${cat.color}30`, border: `1px solid ${cat.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {cat.icon}
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING ──────────────────────────────────────────────────────────── */}
      {trending.length > 0 && (
        <section style={{ padding: '48px 0', background: 'var(--bg2)' }}>
          <div className="container">
            <SectionHeader icon="🔥" title="Trending Right Now" sub="What everyone is buying today" link="/shop" />
            <div className="products-grid stagger">
              {trending.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── DUAL BANNER ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {BANNERS.map(b => (
              <div key={b.title} onClick={() => navigate(b.link)}
                style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: 220, background: b.bg, transition: 'transform 0.3s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <img src={b.image} alt={b.title} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '55%', objectFit: 'cover', opacity: 0.5 }} />
                <div style={{ position: 'absolute', inset: 0, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>{b.sub}</div>
                  <button className="btn btn-sm" style={{ background: b.accent, color: '#000', fontWeight: 700, borderRadius: 50, padding: '8px 20px', border: 'none', alignSelf: 'flex-start' }}>
                    {b.cta} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI PICKS ──────────────────────────────────────────────────────────── */}
      {feed.length > 0 && (
        <section style={{ padding: '48px 0', background: 'var(--bg2)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, padding: '4px 14px', marginBottom: 10, fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
                  AI CURATED FOR YOU
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>✨ Personalised Picks</h2>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Our AI selected these based on trending patterns</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/ai')}>See AI Features →</button>
            </div>
            <div className="products-grid stagger">
              {feed.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── SHOES ROW ─────────────────────────────────────────────────────────── */}
      {shoes.length > 0 && (
        <section style={{ padding: '48px 0' }}>
          <div className="container">
            <SectionHeader icon="👟" title="Trending Shoes" sub="Top picks in footwear" link="/shop?category=Shoes" />
            <div className="products-grid stagger">
              {shoes.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── WIDE PROMO BANNER ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 0 48px' }}>
        <div className="container">
          <div onClick={() => navigate('/ai-advanced')} style={{ borderRadius: 24, overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(135deg, #0d0221 0%, #1a0533 40%, #0f3460 100%)', padding: '48px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', transition: 'transform 0.3s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', fontSize: 120, opacity: 0.1 }}>🤖</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 2, marginBottom: 12 }}>⚡ POWERED BY GEMINI AI</div>
              <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 12, color: '#fff' }}>Meet Alex — Your Personal AI Shopper</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 24, maxWidth: 480 }}>Gift finder, style DNA, deal sniper, occasion planner — 15+ AI features to transform how you shop</p>
              <button className="btn btn-primary btn-lg" style={{ background: '#a78bfa', color: '#000', border: 'none' }}>Try Advanced AI →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── ELECTRONICS ROW ───────────────────────────────────────────────────── */}
      {electronics.length > 0 && (
        <section style={{ padding: '48px 0', background: 'var(--bg2)' }}>
          <div className="container">
            <SectionHeader icon="⚡" title="Top Electronics" sub="Latest gadgets and tech" link="/shop?category=Electronics" />
            <div className="products-grid stagger">
              {electronics.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── BOOKS + HEALTH SIDE BY SIDE ───────────────────────────────────────── */}
      <section style={{ padding: '48px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {books.length > 0 && (
              <div>
                <SectionHeader icon="📚" title="Top Books" sub="Bestsellers & must-reads" link="/shop?category=Books" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {books.slice(0, 4).map(p => (
                    <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--bg2)', borderRadius: 12, padding: 12, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-bd)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <img src={p.images?.[0]} alt={p.name} style={{ width: 56, height: 72, objectFit: 'cover', borderRadius: 6 }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{p.brand}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>₹{p.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {health.length > 0 && (
              <div>
                <SectionHeader icon="💪" title="Health & Fitness" sub="Supplements & wellness" link="/shop?category=Health" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {health.slice(0, 4).map(p => (
                    <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--bg2)', borderRadius: 12, padding: 12, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-bd)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <img src={p.images?.[0]} alt={p.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=100'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{p.brand}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>₹{p.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ANALYTICS PROMO ───────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 0', background: 'var(--bg2)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { icon: '🚚', title: 'Free Delivery', sub: 'On orders above ₹999' },
              { icon: '↩️', title: '7-Day Returns', sub: 'Hassle-free returns' },
              { icon: '🔒', title: 'Secure Payments', sub: 'SSL encrypted checkout' },
              { icon: '🤖', title: 'AI Powered', sub: 'Smart recommendations' },
            ].map(f => (
              <div key={f.title} style={{ background: 'var(--bg3)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '48px 0 24px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)', letterSpacing: -1, marginBottom: 12 }}>ZYNC</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, maxWidth: 260 }}>India's smartest AI-powered ecommerce store. Discover products curated just for you with the power of artificial intelligence.</div>
            </div>
            {[
              { title: 'Shop', links: ['Shoes','Clothing','Electronics','Gaming','Sports'] },
              { title: 'Company', links: ['About Us','Careers','Press','Blog'] },
              { title: 'Support', links: ['Help Centre','Returns','Track Order','Contact Us'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text3)'}
                    onClick={() => col.title === 'Shop' ? navigate(`/shop?category=${l}`) : null}>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text3)' }}>
            <div>© 2026 ZYNC AI Store. Made with 💜 in India</div>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy','Terms of Service','Cookie Policy'].map(l => (
                <span key={l} style={{ cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}