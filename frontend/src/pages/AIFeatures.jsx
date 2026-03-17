import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function AIFeatures() {
  const { api, fmt, user, toast } = useApp();
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Hi! I'm ZYNC's AI shopping assistant 🛍️ Ask me anything — I can help you find products, suggest gifts, or compare items!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [styleResult, setStyleResult] = useState(null);
  const [styleLoading, setStyleLoading] = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [surpriseResult, setSurpriseResult] = useState(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [tasteProfile, setTasteProfile] = useState(null);
  const [tasteLoading, setTasteLoading] = useState(false);
  const [styleForm, setStyleForm] = useState({ style: 'casual', occasion: 'everyday', budget: '5000', gender: 'any' });

  const sendChat = async (msg) => {
    const message = msg || chatInput.trim();
    if (!message) return;
    setChatInput('');
    setChatHistory(h => [...h, { role: 'user', text: message }]);
    setChatLoading(true);
    const history = chatHistory.filter(m => m.role !== 'ai' || m !== chatHistory[0]).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    const r = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) });
    setChatLoading(false);
    if (r.success) {
      setChatHistory(h => [...h, { role: 'ai', text: r.data.reply, products: r.data.suggested_products }]);
    } else {
      setChatHistory(h => [...h, { role: 'ai', text: 'Sorry, something went wrong. Try again!' }]);
    }
  };

  const runSearch = async (q) => {
    const query = q || searchQuery;
    if (!query) return;
    setSearchLoading(true); setSearchResults(null);
    const r = await api('/api/ai/smart-search', { method: 'POST', body: JSON.stringify({ query }) });
    setSearchLoading(false);
    setSearchResults(r.success ? r.data : []);
  };

  const runStyle = async () => {
    setStyleLoading(true); setStyleResult(null);
    const r = await api('/api/ai/style-advisor', { method: 'POST', body: JSON.stringify(styleForm) });
    setStyleLoading(false);
    if (r.success) setStyleResult(r.data);
    else toast('Could not generate outfit', 'error');
  };

  const runPrice = async (pid) => {
    setPriceLoading(true); setPriceResult(null);
    const r = await api(`/api/ai/price-analyze/${pid}`);
    setPriceLoading(false);
    if (r.success) setPriceResult(r.data);
  };

  const runSurprise = async () => {
    setSurpriseLoading(true); setSurpriseResult(null);
    const r = await api('/api/ai/surprise');
    setSurpriseLoading(false);
    if (r.success) setSurpriseResult(r.data);
  };

  const runTaste = async () => {
    if (!user) { toast('Please login first', 'error'); return; }
    setTasteLoading(true); setTasteProfile(null);
    const r = await api('/api/ai/taste-profile');
    setTasteLoading(false);
    if (r.success) setTasteProfile(r.data);
  };

  const verdictColor = { 'Great Deal': '#3dd68c', 'Fair Price': '#4f9eff', 'Overpriced': '#ff5c5c', 'Buy Now': '#e8b86d' };

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 42, marginBottom: 12 }}>AI Shopping Features</h1>
        <p style={{ color: 'var(--text2)', fontSize: 16 }}>Experience the future of shopping with real AI</p>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 40 }}>
        {[
          { icon: '💬', title: 'AI Shopping Assistant', desc: 'Chat with AI to find perfect products', id: 'chat' },
          { icon: '🔍', title: 'AI Smart Search', desc: 'Search in natural language', id: 'search' },
          { icon: '✨', title: 'AI Style Advisor', desc: 'Get a complete outfit recommendation', id: 'style' },
          { icon: '🎲', title: 'Surprise Me!', desc: 'Let AI pick the perfect product for you', id: 'surprise' },
          { icon: '🎯', title: 'My Taste Profile', desc: 'Discover your shopping personality', id: 'taste' },
          { icon: '📊', title: 'AI Price Analyzer', desc: 'Is it a good deal?', id: 'price' },
        ].map(f => (
          <div key={f.id} className="ai-feature-card" onClick={() => document.getElementById(`ai-${f.id}`).scrollIntoView({ behavior: 'smooth' })}>
            <div className="ai-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="ai-feature-btn">Try it →</div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div id="ai-chat" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24, border: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 20 }}>💬 AI Shopping Assistant</h2>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, height: 320, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chatHistory.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%' }}>
                <div className={`chat-bubble ${m.role === 'user' ? 'user' : ''}`} style={{ background: m.role === 'user' ? 'var(--accent)' : 'var(--bg2)', color: m.role === 'user' ? '#000' : 'var(--text)', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', fontSize: 14 }}>
                  {m.text.replace(/\[ID:\d+\]/g, '')}
                </div>
                {m.products?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {m.products.map(p => (
                      <div key={p.id} onClick={() => window.location.href=`/product/${p.id}`} style={{ padding: '6px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: 'var(--accent)' }}>
                        {p.name} — {fmt(p.price)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && <div style={{ color: 'var(--text3)', fontSize: 13 }}>AI is typing...</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {['Find me running shoes', 'Gift ideas under ₹2000', 'Best laptop accessories', 'Trending products'].map(q => (
            <div key={q} onClick={() => sendChat(q)} style={{ padding: '5px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>{q}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask me anything..." style={{ flex: 1, padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 14 }} />
          <button className="btn btn-primary" onClick={() => sendChat()} disabled={chatLoading}>Send</button>
        </div>
      </div>

      {/* Smart Search */}
      <div id="ai-search" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24, border: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 8 }}>🔍 AI Smart Search</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Search in plain English — AI understands what you mean</p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} placeholder='Try: "comfortable shoes under ₹5000"' style={{ flex: 1, padding: '14px 18px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 14 }} />
          <button className="btn btn-primary" onClick={() => runSearch()} disabled={searchLoading}>{searchLoading ? '...' : 'Search with AI'}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {['comfortable shoes under ₹5000', 'wireless headphones for gym', 'gift for a techie under ₹3000', 'stylish bags for college'].map(q => (
            <div key={q} onClick={() => { setSearchQuery(q); runSearch(q); }} style={{ padding: '6px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>{q}</div>
          ))}
        </div>
        {searchLoading && <div className="loading-wrap"><div className="spinner"></div></div>}
        {searchResults !== null && (
          searchResults.length === 0
            ? <div className="empty-state"><div className="empty-icon">🔍</div><h3>No results found</h3></div>
            : <div className="products-grid stagger">{searchResults.map(p => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </div>

      {/* Style Advisor */}
      <div id="ai-style" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24, border: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 8 }}>✨ AI Style Advisor</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Tell us about yourself and we'll create your perfect outfit</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { id: 'style', label: 'Style Vibe', opts: [['casual','Casual'],['streetwear','Streetwear'],['formal','Formal'],['sporty','Sporty'],['minimalist','Minimalist']] },
            { id: 'occasion', label: 'Occasion', opts: [['everyday','Everyday'],['office','Office'],['party','Party'],['gym','Gym'],['date','Date Night'],['travel','Travel']] },
            { id: 'budget', label: 'Budget', opts: [['2000','Under ₹2,000'],['5000','Under ₹5,000'],['10000','Under ₹10,000'],['50000','No Limit']] },
            { id: 'gender', label: 'Gender', opts: [['any','Any'],['men','Men\'s'],['women','Women\'s']] },
          ].map(f => (
            <div key={f.id} className="form-group">
              <label>{f.label}</label>
              <select value={styleForm[f.id]} onChange={e => setStyleForm({ ...styleForm, [f.id]: e.target.value })} style={{ width: '100%', padding: 12, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)' }}>
                {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={runStyle} disabled={styleLoading}>
          {styleLoading ? '✨ Generating outfit...' : '✨ Generate My Outfit'}
        </button>
        {styleResult && (
          <div style={{ marginTop: 24, background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 24, marginBottom: 4 }}>{styleResult.outfit_name}</h3>
            <div style={{ color: 'var(--accent)', marginBottom: 12 }}>{styleResult.vibe}</div>
            <p style={{ color: 'var(--text2)', marginBottom: 20 }}>{styleResult.description}</p>
            <div className="products-grid stagger">
              {(styleResult.products || []).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {styleResult.styling_tip && <div style={{ marginTop: 16, padding: 14, background: 'var(--accent-bg)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>💡 {styleResult.styling_tip}</div>}
          </div>
        )}
      </div>

      {/* Surprise Me */}
      <div id="ai-surprise" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24, border: '1px solid var(--border)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 8 }}>🎲 Surprise Me!</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Let AI pick the perfect surprise product just for you</p>
        <button className="btn btn-primary btn-lg" onClick={runSurprise} disabled={surpriseLoading}>
          {surpriseLoading ? '🎲 Picking...' : '🎲 Surprise Me!'}
        </button>
        {surpriseResult && (
          <div style={{ marginTop: 24, maxWidth: 400, margin: '24px auto 0', background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 16 }}>{surpriseResult.surprise_message}</p>
            <ProductCard product={surpriseResult.product} />
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 12 }}>{surpriseResult.reason}</p>
          </div>
        )}
      </div>

      {/* Price Analyzer */}
      <div id="ai-price" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24, border: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 8 }}>📊 AI Price Analyzer</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Click any product to analyze if it's a good deal</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
          {[1, 5, 10, 15, 20, 25].map(id => (
            <div key={id} onClick={() => runPrice(id)} style={{ padding: 14, background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border2)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
              📊 Analyze Product #{id}
            </div>
          ))}
        </div>
        {priceLoading && <div className="loading-wrap"><div className="spinner"></div></div>}
        {priceResult && (
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ padding: '6px 16px', borderRadius: 50, fontSize: 13, fontWeight: 700, background: 'rgba(0,0,0,0.2)', color: verdictColor[priceResult.verdict] || '#fff', border: `1px solid ${verdictColor[priceResult.verdict] || '#fff'}` }}>{priceResult.verdict}</div>
              <div><div style={{ fontSize: 24, fontWeight: 700 }}>{priceResult.score}/100</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>Value Score</div></div>
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: 12 }}>{priceResult.reason}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, background: 'var(--bg2)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Discount</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{priceResult.discount}% OFF</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg2)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Category Avg</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>₹{priceResult.avg_category_price}</div>
              </div>
            </div>
            <div style={{ padding: 12, background: 'var(--accent-bg)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>💡 {priceResult.tip}</div>
          </div>
        )}
      </div>

      {/* Taste Profile */}
      <div id="ai-taste" style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, border: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 8 }}>🎯 My AI Taste Profile</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Browse products to build your taste profile</p>
        {!tasteProfile ? (
          <button className="btn btn-primary" onClick={runTaste} disabled={tasteLoading}>
            {tasteLoading ? 'Analyzing...' : 'Generate My Taste Profile'}
          </button>
        ) : (
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎯</div>
              <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 32, color: 'var(--accent)', marginBottom: 8 }}>{tasteProfile.personality}</h3>
              <p style={{ color: 'var(--text2)' }}>{tasteProfile.description}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              {(tasteProfile.traits || []).map(t => <div key={t} style={{ padding: '6px 16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{t}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[['Top Categories', tasteProfile.top_categories, '📦'], ['Top Brands', tasteProfile.top_brands, '⭐'], ['Style Tags', tasteProfile.style_tags, '🏷️']].map(([title, items, icon]) => (
                <div key={title} style={{ background: 'var(--bg2)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
                  {(items || []).map(item => <div key={item} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>{icon} {item}</div>)}
                </div>
              ))}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: 20 }} onClick={runTaste}>🔄 Refresh Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}