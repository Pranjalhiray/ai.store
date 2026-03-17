import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function AIAdvanced() {
  const { api, fmt, user, toast } = useApp();
  const [activeTab, setActiveTab] = useState('personal-shopper');

  // Personal Shopper
  const [shopperHistory, setShopperHistory] = useState([
    { role: 'assistant', content: "Hey! I'm Alex, your personal shopping friend 👋 I'm not like those boring chatbots — I'll give you honest opinions, remember what you tell me, and actually help you find stuff you'll love. What are you looking for today?" }
  ]);
  const [shopperInput, setShopperInput] = useState('');
  const [shopperLoading, setShopperLoading] = useState(false);
  const [shopperPrefs, setShopperPrefs] = useState({});

  // Gift Finder
  const [giftForm, setGiftForm] = useState({ person: '', age: '', interests: '', budget: '', occasion: '' });
  const [giftResult, setGiftResult] = useState(null);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftStep, setGiftStep] = useState(1);

  // Shopping Goals
  const [goalForm, setGoalForm] = useState({ goal: '', budget: '', timeline: '' });
  const [goalResult, setGoalResult] = useState(null);
  const [goalLoading, setGoalLoading] = useState(false);

  // Occasion Planner
  const [occasionForm, setOccasionForm] = useState({ occasion: '', timeline: '', budget: '', details: '' });
  const [occasionResult, setOccasionResult] = useState(null);
  const [occasionLoading, setOccasionLoading] = useState(false);

  // Emotion Analyzer
  const [emotionPid, setEmotionPid] = useState('');
  const [emotionResult, setEmotionResult] = useState(null);
  const [emotionLoading, setEmotionLoading] = useState(false);

  // Style DNA
  const [dnaForm, setDnaForm] = useState({ vibe: '', inspirations: '', lifestyle: '', avoid: '' });
  const [dnaResult, setDnaResult] = useState(null);
  const [dnaLoading, setDnaLoading] = useState(false);

  // Deal Sniper
  const [deals, setDeals] = useState(null);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Shopping Coach
  const [coachResult, setCoachResult] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const sendShopper = async (msg) => {
    const message = msg || shopperInput.trim();
    if (!message) return;
    setShopperInput('');
    const newHistory = [...shopperHistory, { role: 'user', content: message }];
    setShopperHistory(newHistory);
    setShopperLoading(true);
    const r = await api('/api/ai/personal-shopper', {
      method: 'POST',
      body: JSON.stringify({ message, history: shopperHistory.slice(-8), preferences: shopperPrefs })
    });
    setShopperLoading(false);
    if (r.success) {
      setShopperHistory([...newHistory, { role: 'assistant', content: r.data.reply, products: r.data.suggested_products }]);
      if (r.data.extracted_preferences && Object.keys(r.data.extracted_preferences).length) {
        setShopperPrefs(p => ({ ...p, ...r.data.extracted_preferences }));
      }
    }
  };

  const runGiftFinder = async () => {
    if (!giftForm.person || !giftForm.budget) { toast('Fill in person name and budget', 'error'); return; }
    setGiftLoading(true); setGiftResult(null);
    const r = await api('/api/ai/gift-finder', { method: 'POST', body: JSON.stringify(giftForm) });
    setGiftLoading(false);
    if (r.success) { setGiftResult(r.data); setGiftStep(3); }
    else toast('Could not find gifts', 'error');
  };

  const runGoal = async () => {
    if (!goalForm.goal || !goalForm.budget) { toast('Enter your goal and budget', 'error'); return; }
    setGoalLoading(true); setGoalResult(null);
    const r = await api('/api/ai/shopping-goals', { method: 'POST', body: JSON.stringify(goalForm) });
    setGoalLoading(false);
    if (r.success) setGoalResult(r.data);
    else toast('Could not create plan', 'error');
  };

  const runOccasion = async () => {
    if (!occasionForm.occasion || !occasionForm.budget) { toast('Enter occasion and budget', 'error'); return; }
    setOccasionLoading(true); setOccasionResult(null);
    const r = await api('/api/ai/occasion-planner', { method: 'POST', body: JSON.stringify(occasionForm) });
    setOccasionLoading(false);
    if (r.success) setOccasionResult(r.data);
    else toast('Could not create plan', 'error');
  };

  const runEmotion = async (pid) => {
    const id = pid || emotionPid;
    if (!id) { toast('Enter a product ID', 'error'); return; }
    setEmotionLoading(true); setEmotionResult(null);
    const r = await api(`/api/ai/emotion-analysis/${id}`);
    setEmotionLoading(false);
    if (r.success) setEmotionResult(r.data);
    else toast('Could not analyze', 'error');
  };

  const runDNA = async () => {
    if (!dnaForm.vibe) { toast('Describe your vibe first', 'error'); return; }
    setDnaLoading(true); setDnaResult(null);
    const r = await api('/api/ai/style-dna', { method: 'POST', body: JSON.stringify(dnaForm) });
    setDnaLoading(false);
    if (r.success) setDnaResult(r.data);
    else toast('Could not build style DNA', 'error');
  };

  const runDeals = async () => {
    setDealsLoading(true); setDeals(null);
    const r = await api('/api/ai/deal-sniper');
    setDealsLoading(false);
    if (r.success) setDeals(r.data);
    else toast('Could not scan deals', 'error');
  };

  const runCoach = async () => {
    if (!user) { toast('Please login first', 'error'); return; }
    setCoachLoading(true); setCoachResult(null);
    const r = await api('/api/ai/shopping-coach', { method: 'POST' });
    setCoachLoading(false);
    if (r.success) setCoachResult(r.data);
    else toast('Could not analyze cart', 'error');
  };

  // ── UI Helpers ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'personal-shopper', icon: '🗣️', label: 'Personal Shopper' },
    { id: 'gift-finder', icon: '🎯', label: 'Gift Finder' },
    { id: 'shopping-goals', icon: '🏆', label: 'Shopping Goals' },
    { id: 'occasion-planner', icon: '🔮', label: 'Occasion Planner' },
    { id: 'emotion-analyzer', icon: '😊', label: 'Emotion Analyzer' },
    { id: 'style-dna', icon: '🪞', label: 'Style DNA' },
    { id: 'deal-sniper', icon: '💰', label: 'Deal Sniper' },
    { id: 'shopping-coach', icon: '🧠', label: 'Shopping Coach' },
  ];

  const card = (children, extra = {}) => (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', padding: 32, border: '1px solid var(--border)', ...extra }}>
      {children}
    </div>
  );

  const input = (props) => (
    <input style={{ width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 14 }} {...props} />
  );

  const select = (props, options) => (
    <select style={{ width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 14 }} {...props}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  const verdictColors = {
    'Smart Shopper': '#3dd68c', 'Decent Choices': '#4f9eff',
    'Needs Review': '#e8b86d', 'Impulse Alert': '#ff5c5c',
    'Smart Buy': '#3dd68c', 'Good Value': '#4f9eff',
    'Consider Twice': '#e8b86d', 'Impulse Buy': '#ff5c5c',
  };

  const EmotionBar = ({ label, value, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: 42, marginBottom: 12 }}>Advanced AI Tools</h1>
        <p style={{ color: 'var(--text2)', fontSize: 16 }}>Features no one else has — built just for you</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '10px 20px', borderRadius: 50, border: `1px solid ${activeTab === t.id ? 'var(--accent)' : 'var(--border2)'}`, background: activeTab === t.id ? 'var(--accent-bg)' : 'transparent', color: activeTab === t.id ? 'var(--accent)' : 'var(--text3)', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Personal Shopper ── */}
      {activeTab === 'personal-shopper' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>🗣️ Meet Alex — Your AI Shopping Friend</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Not a bot. Alex talks like a real friend, remembers your preferences, and gives honest opinions.</p>

          {Object.keys(shopperPrefs).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Alex remembers:</span>
              {Object.entries(shopperPrefs).map(([k, v]) => (
                <span key={k} style={{ padding: '4px 10px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 12, color: 'var(--accent)' }}>{k}: {v}</span>
              ))}
            </div>
          )}

          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, height: 380, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {shopperHistory.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%' }}>
                  {m.role === 'assistant' && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>ALEX 🛍️</div>}
                  <div style={{ padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? 'var(--accent)' : 'var(--bg2)', color: m.role === 'user' ? '#000' : 'var(--text)', fontSize: 14, lineHeight: 1.5 }}>
                    {m.content.replace(/\[ID:\d+\]/g, '')}
                  </div>
                  {m.products?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {m.products.map(p => (
                        <div key={p.id} onClick={() => window.location.href = `/product/${p.id}`} style={{ padding: '6px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: 'var(--accent)' }}>
                          {p.name} — {fmt(p.price)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {shopperLoading && <div style={{ color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>Alex is typing...</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {["I need a gift for my mom", "What's trending right now?", "I have ₹3000 to spend", "Honest opinion on gaming gear"].map(q => (
              <div key={q} onClick={() => sendShopper(q)} style={{ padding: '5px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>{q}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {input({ value: shopperInput, onChange: e => setShopperInput(e.target.value), onKeyDown: e => e.key === 'Enter' && sendShopper(), placeholder: "Talk to Alex..." })}
            <button className="btn btn-primary" onClick={() => sendShopper()} disabled={shopperLoading}>Send</button>
          </div>
        </>
      )}

      {/* ── Gift Finder ── */}
      {activeTab === 'gift-finder' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>🎯 AI Gift Finder</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Answer a few questions and AI will find the most thoughtful gift</p>

          {giftStep === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Who is this gift for?</label>
                {input({ placeholder: 'e.g. My best friend Priya', value: giftForm.person, onChange: e => setGiftForm({ ...giftForm, person: e.target.value }) })}
              </div>
              <div className="form-group">
                <label>Their Age</label>
                {input({ placeholder: 'e.g. 23', value: giftForm.age, onChange: e => setGiftForm({ ...giftForm, age: e.target.value }) })}
              </div>
              <div className="form-group">
                <label>Occasion</label>
                {input({ placeholder: 'Birthday, Anniversary...', value: giftForm.occasion, onChange: e => setGiftForm({ ...giftForm, occasion: e.target.value }) })}
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Their Interests & Personality</label>
                {input({ placeholder: 'e.g. loves fitness, listens to music, into tech gadgets', value: giftForm.interests, onChange: e => setGiftForm({ ...giftForm, interests: e.target.value }) })}
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Your Budget (₹)</label>
                {input({ placeholder: 'e.g. 2000', value: giftForm.budget, onChange: e => setGiftForm({ ...giftForm, budget: e.target.value }) })}
              </div>
              <button className="btn btn-primary btn-lg" style={{ gridColumn: '1/-1' }} onClick={runGiftFinder} disabled={giftLoading}>
                {giftLoading ? '🎯 Finding perfect gift...' : '🎯 Find Perfect Gift'}
              </button>
            </div>
          )}

          {giftStep === 3 && giftResult && (
            <div>
              <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>AI GIFT RECOMMENDATION FOR {giftForm.person.toUpperCase()}</div>
                <p style={{ color: 'var(--text)', fontSize: 15 }}>{giftResult.gift_message}</p>
              </div>

              {giftResult.top_pick && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>⭐ Top Pick</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, background: 'var(--bg3)', borderRadius: 12, padding: 20, border: '1px solid var(--accent-bd)' }}>
                    <img src={giftResult.top_pick.images?.[0]} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10 }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400'} />
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 20, marginBottom: 8 }}>{giftResult.top_pick.name}</h3>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>{fmt(giftResult.top_pick.price)}</div>
                      <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>{giftResult.top_pick_reason}</p>
                      <button className="btn btn-primary" onClick={() => window.location.href = `/product/${giftResult.top_pick.id}`}>View Product →</button>
                    </div>
                  </div>
                </div>
              )}

              {giftResult.other_products?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>More Great Options</div>
                  <div className="products-grid">
                    {giftResult.other_products.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </div>
              )}

              {giftResult.gift_tip && (
                <div style={{ padding: 16, background: 'var(--accent-bg)', borderRadius: 10, border: '1px solid var(--accent-bd)', fontSize: 14, color: 'var(--accent)' }}>
                  🎁 <strong>Gift Tip:</strong> {giftResult.gift_tip}
                </div>
              )}

              <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => { setGiftStep(1); setGiftResult(null); }}>← Search Again</button>
            </div>
          )}
        </>
      )}

      {/* ── Shopping Goals ── */}
      {activeTab === 'shopping-goals' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>🏆 AI Shopping Goals</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Set a goal and AI creates your complete phased shopping plan</p>

          {!goalResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {['Build a home gym for ₹15,000', 'Set up a gaming setup for ₹20,000', 'Complete work from home setup for ₹10,000', 'Start a fitness journey for ₹5,000'].map(g => (
                  <div key={g} onClick={() => { const parts = g.split(' for ₹'); setGoalForm({ goal: parts[0], budget: parts[1], timeline: '1 month' }); }} style={{ padding: '6px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>{g}</div>
                ))}
              </div>
              <div className="form-group">
                <label>What's your shopping goal?</label>
                {input({ placeholder: 'e.g. Build a complete home gym setup', value: goalForm.goal, onChange: e => setGoalForm({ ...goalForm, goal: e.target.value }) })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Total Budget (₹)</label>
                  {input({ placeholder: '15000', value: goalForm.budget, onChange: e => setGoalForm({ ...goalForm, budget: e.target.value }) })}
                </div>
                <div className="form-group">
                  <label>Timeline</label>
                  {input({ placeholder: 'e.g. 1 month, 3 months', value: goalForm.timeline, onChange: e => setGoalForm({ ...goalForm, timeline: e.target.value }) })}
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={runGoal} disabled={goalLoading}>
                {goalLoading ? '🏆 Creating your plan...' : '🏆 Create Shopping Plan'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 22, marginBottom: 8 }}>{goalResult.plan_title}</h3>
                <p style={{ color: 'var(--text2)', marginBottom: 12 }}>{goalResult.summary}</p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>TOTAL COST</div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{fmt(goalResult.total_cost)}</div></div>
                  <div style={{ width: 1, background: 'var(--border)' }}></div>
                  <div><div style={{ fontSize: 11, color: 'var(--text3)' }}>SUCCESS METRIC</div><div style={{ fontSize: 13, color: 'var(--text)' }}>{goalResult.success_metric}</div></div>
                </div>
              </div>

              {goalResult.phases?.map((phase, i) => (
                <div key={i} style={{ marginBottom: 24, background: 'var(--bg3)', borderRadius: 12, padding: 20, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>{phase.phase}</div>
                      <h4 style={{ fontFamily: 'var(--font-d)', fontSize: 18, marginBottom: 4 }}>{phase.title}</h4>
                      <p style={{ color: 'var(--text2)', fontSize: 13 }}>{phase.description}</p>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{fmt(phase.phase_budget)}</div>
                  </div>
                  {phase.products?.length > 0 && (
                    <div className="products-grid">{phase.products.map(p => <ProductCard key={p.id} product={p} />)}</div>
                  )}
                </div>
              ))}

              {goalResult.savings_tip && (
                <div style={{ padding: 16, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, fontSize: 14, color: 'var(--green)' }}>
                  💡 {goalResult.savings_tip}
                </div>
              )}

              <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setGoalResult(null)}>← New Goal</button>
            </div>
          )}
        </>
      )}

      {/* ── Occasion Planner ── */}
      {activeTab === 'occasion-planner' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>🔮 AI Occasion Planner</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Tell us about your occasion and AI plans exactly what you need</p>

          {!occasionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {['Wedding in 2 weeks', 'Job interview tomorrow', 'First date this weekend', 'College farewell next month'].map(o => (
                  <div key={o} onClick={() => setOccasionForm({ ...occasionForm, occasion: o })} style={{ padding: '6px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 50, fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>{o}</div>
                ))}
              </div>
              <div className="form-group">
                <label>What's the occasion?</label>
                {input({ placeholder: 'e.g. My best friend\'s wedding', value: occasionForm.occasion, onChange: e => setOccasionForm({ ...occasionForm, occasion: e.target.value }) })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>When is it?</label>
                  {input({ placeholder: 'e.g. In 2 weeks', value: occasionForm.timeline, onChange: e => setOccasionForm({ ...occasionForm, timeline: e.target.value }) })}
                </div>
                <div className="form-group">
                  <label>Budget (₹)</label>
                  {input({ placeholder: 'e.g. 8000', value: occasionForm.budget, onChange: e => setOccasionForm({ ...occasionForm, budget: e.target.value }) })}
                </div>
              </div>
              <div className="form-group">
                <label>Any extra details? (optional)</label>
                {input({ placeholder: 'e.g. outdoor wedding, dress code is formal', value: occasionForm.details, onChange: e => setOccasionForm({ ...occasionForm, details: e.target.value }) })}
              </div>
              <button className="btn btn-primary btn-lg" onClick={runOccasion} disabled={occasionLoading}>
                {occasionLoading ? '🔮 Planning your occasion...' : '🔮 Plan My Occasion'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 24, marginBottom: 4 }}>{occasionResult.occasion_title}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 14 }}>{occasionResult.overview}</p>
                </div>
                <div style={{ padding: '8px 16px', borderRadius: 50, fontSize: 13, fontWeight: 700, background: occasionResult.urgency === 'Urgent' ? 'rgba(255,92,92,0.1)' : 'var(--accent-bg)', color: occasionResult.urgency === 'Urgent' ? '#ff5c5c' : 'var(--accent)', border: `1px solid ${occasionResult.urgency === 'Urgent' ? '#ff5c5c' : 'var(--accent-bd)'}` }}>
                  {occasionResult.urgency}
                </div>
              </div>

              {occasionResult.checklist?.map((item, i) => (
                <div key={i} style={{ marginBottom: 20, background: 'var(--bg3)', borderRadius: 12, padding: 20, border: `1px solid ${item.priority === 'Must Have' ? 'var(--accent-bd)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600 }}>📦 {item.category}</h4>
                    <span style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 700, background: item.priority === 'Must Have' ? 'var(--accent-bg)' : 'var(--bg2)', color: item.priority === 'Must Have' ? 'var(--accent)' : 'var(--text3)', border: '1px solid var(--border)' }}>{item.priority}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {item.items_needed?.map(n => <span key={n} style={{ padding: '4px 10px', background: 'var(--bg2)', borderRadius: 6, fontSize: 12, color: 'var(--text2)' }}>✓ {n}</span>)}
                  </div>
                  {item.products?.length > 0 && (
                    <div className="products-grid">{item.products.map(p => <ProductCard key={p.id} product={p} />)}</div>
                  )}
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {occasionResult.timeline_tip && (
                  <div style={{ padding: 16, background: 'var(--accent-bg)', borderRadius: 10, fontSize: 13, color: 'var(--accent)' }}>🗓️ <strong>Timeline:</strong> {occasionResult.timeline_tip}</div>
                )}
                {occasionResult.pro_tip && (
                  <div style={{ padding: 16, background: 'rgba(61,214,140,0.08)', borderRadius: 10, fontSize: 13, color: 'var(--green)' }}>💡 <strong>Pro Tip:</strong> {occasionResult.pro_tip}</div>
                )}
              </div>

              <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setOccasionResult(null)}>← New Occasion</button>
            </div>
          )}
        </>
      )}

      {/* ── Emotion Analyzer ── */}
      {activeTab === 'emotion-analyzer' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>😊 AI Review Emotion Analyzer</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>AI reads between the lines of reviews to detect real emotions</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {input({ placeholder: 'Enter Product ID (1-51)', value: emotionPid, onChange: e => setEmotionPid(e.target.value), style: { flex: 1 } })}
            <button className="btn btn-primary" onClick={() => runEmotion()} disabled={emotionLoading}>{emotionLoading ? '...' : 'Analyze'}</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[1, 5, 10, 15, 20, 25, 30].map(id => (
              <div key={id} onClick={() => { setEmotionPid(id.toString()); runEmotion(id); }} style={{ padding: '6px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 50, fontSize: 12, cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border2)'}>Product #{id}</div>
            ))}
          </div>

          {emotionLoading && <div className="loading-wrap"><div className="spinner"></div></div>}

          {emotionResult && (
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>OVERALL SENTIMENT</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: emotionResult.overall_sentiment === 'Positive' ? 'var(--green)' : emotionResult.overall_sentiment === 'Negative' ? '#ff5c5c' : 'var(--accent)' }}>{emotionResult.overall_sentiment}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>BUYER CONFIDENCE</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{emotionResult.buyer_confidence}</div>
                </div>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: `6px solid ${emotionResult.sentiment_score > 70 ? 'var(--green)' : emotionResult.sentiment_score > 40 ? 'var(--accent)' : '#ff5c5c'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{emotionResult.sentiment_score}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>score</div>
                </div>
              </div>

              <p style={{ color: 'var(--text2)', marginBottom: 20, fontSize: 14 }}>{emotionResult.emotional_summary}</p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Emotion Breakdown</div>
                <EmotionBar label="😊 Happiness" value={emotionResult.emotions?.happiness || 0} color="#3dd68c" />
                <EmotionBar label="🤝 Trust" value={emotionResult.emotions?.trust || 0} color="#4f9eff" />
                <EmotionBar label="⚡ Excitement" value={emotionResult.emotions?.excitement || 0} color="#e8b86d" />
                <EmotionBar label="😤 Frustration" value={emotionResult.emotions?.frustration || 0} color="#ff5c5c" />
                <EmotionBar label="😔 Disappointment" value={emotionResult.emotions?.disappointment || 0} color="#a78bfa" />
                <EmotionBar label="✅ Satisfaction" value={emotionResult.emotions?.satisfaction || 0} color="#22d3ee" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 14, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, fontSize: 13 }}>
                  <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>❤️ Customers Love</div>
                  <div>{emotionResult.top_positive_aspect}</div>
                </div>
                <div style={{ padding: 14, background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 10, fontSize: 13 }}>
                  <div style={{ color: '#ff5c5c', fontWeight: 700, marginBottom: 4 }}>⚠️ Main Concern</div>
                  <div>{emotionResult.top_concern}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Style DNA ── */}
      {activeTab === 'style-dna' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>🪞 AI Style DNA</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Describe your vibe and AI builds your permanent style identity</p>

          {!dnaResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Describe your vibe in your own words</label>
                <textarea value={dnaForm.vibe} onChange={e => setDnaForm({ ...dnaForm, vibe: e.target.value })} placeholder="e.g. I like clean, simple clothes but with a twist. I love dark colors, oversized fits, and I want to look effortless but intentional..." style={{ width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 14, minHeight: 100, resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Style inspirations (celebrities, characters, aesthetics)</label>
                {input({ placeholder: 'e.g. ASAP Rocky, Zendaya, streetwear aesthetic', value: dnaForm.inspirations, onChange: e => setDnaForm({ ...dnaForm, inspirations: e.target.value }) })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Your lifestyle</label>
                  {input({ placeholder: 'Student, working professional, athlete...', value: dnaForm.lifestyle, onChange: e => setDnaForm({ ...dnaForm, lifestyle: e.target.value }) })}
                </div>
                <div className="form-group">
                  <label>What do you want to avoid?</label>
                  {input({ placeholder: 'e.g. Too flashy, logos everywhere', value: dnaForm.avoid, onChange: e => setDnaForm({ ...dnaForm, avoid: e.target.value }) })}
                </div>
              </div>
              <button className="btn btn-primary btn-lg" onClick={runDNA} disabled={dnaLoading}>
                {dnaLoading ? '🪞 Building your Style DNA...' : '🪞 Build My Style DNA'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: 'center', padding: '32px 0', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <div style={{ fontSize: 64, marginBottom: 12 }}>🪞</div>
                <h3 style={{ fontFamily: 'var(--font-d)', fontSize: 32, color: 'var(--accent)', marginBottom: 8 }}>{dnaResult.style_name}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 16, fontStyle: 'italic' }}>"{dnaResult.style_tagline}"</p>
                {dnaResult.style_icon && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text3)' }}>Style icon: <strong>{dnaResult.style_icon}</strong></div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>DNA Traits</div>
                  {dnaResult.dna_traits?.map(t => (
                    <div key={t} style={{ padding: '8px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 8, marginBottom: 8, fontSize: 14, color: 'var(--accent)' }}>✦ {t}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Color Palette</div>
                  {dnaResult.color_palette?.map(c => (
                    <div key={c} style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, marginBottom: 8, fontSize: 14 }}>🎨 {c}</div>
                  ))}
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 12px' }}>Style Rules</div>
                  {dnaResult.style_rules?.map(r => (
                    <div key={r} style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>✓ {r}</div>
                  ))}
                </div>
              </div>

              {dnaResult.signature_products?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Your Signature Pieces</div>
                  <div className="products-grid">{dnaResult.signature_products.map(p => <ProductCard key={p.id} product={p} />)}</div>
                </div>
              )}

              {dnaResult.evolution_tip && (
                <div style={{ padding: 16, background: 'var(--accent-bg)', borderRadius: 10, fontSize: 14, color: 'var(--accent)', marginBottom: 16 }}>
                  🚀 <strong>Evolve Your Style:</strong> {dnaResult.evolution_tip}
                </div>
              )}

              <button className="btn btn-outline" onClick={() => setDnaResult(null)}>← Rebuild DNA</button>
            </div>
          )}
        </>
      )}

      {/* ── Deal Sniper ── */}
      {activeTab === 'deal-sniper' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>💰 AI Deal Sniper</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>AI scans all 51 products and surfaces the best hidden value deals</p>

          {!deals ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
              <button className="btn btn-primary btn-lg" onClick={runDeals} disabled={dealsLoading}>
                {dealsLoading ? '💰 Scanning for deals...' : '💰 Snipe Best Deals'}
              </button>
            </div>
          ) : (
            <div>
              {deals.insights?.sniper_report && (
                <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>🤖 AI DEAL REPORT</div>
                  <p style={{ fontSize: 15 }}>{deals.insights.sniper_report}</p>
                  {deals.insights.market_insight && <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 8 }}>📊 {deals.insights.market_insight}</p>}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {deals.insights?.top_deal_id && (
                  <div style={{ background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>🏆 BEST DEAL</div>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>Product #{deals.insights.top_deal_id}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{deals.insights.top_deal_reason}</div>
                  </div>
                )}
                {deals.insights?.hidden_gem_id && (
                  <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, marginBottom: 4 }}>💎 HIDDEN GEM</div>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>Product #{deals.insights.hidden_gem_id}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{deals.insights.hidden_gem_reason}</div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Top 8 Value Deals — Ranked by AI</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {deals.deals?.map((p, i) => (
                  <div key={p.id} onClick={() => window.location.href = `/product/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg3)', borderRadius: 12, padding: 16, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', width: 32, textAlign: 'center' }}>#{i + 1}</div>
                    <img src={p.images?.[0]} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.category} · {p.brand}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{fmt(p.price)}</div>
                      <div style={{ fontSize: 12, color: 'var(--green)' }}>{p.discount}% off</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'var(--accent-bg)', borderRadius: 8, padding: '8px 12px', minWidth: 60 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{p.value_score}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>score</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-outline" onClick={() => { setDeals(null); }}>🔄 Scan Again</button>
            </div>
          )}
        </>
      )}

      {/* ── Shopping Coach ── */}
      {activeTab === 'shopping-coach' && card(
        <>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 28, marginBottom: 4 }}>🧠 AI Shopping Coach</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Brutally honest AI judges your cart — smart buys vs impulse purchases</p>

          {!coachResult ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
              <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Add some products to your cart first, then let AI coach you!</p>
              <button className="btn btn-primary btn-lg" onClick={runCoach} disabled={coachLoading}>
                {coachLoading ? '🧠 Analyzing your cart...' : '🧠 Coach My Cart'}
              </button>
            </div>
          ) : coachResult.empty ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
              <p style={{ color: 'var(--text2)' }}>Your cart is empty! Add products then come back.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: verdictColors[coachResult.verdict] || 'var(--accent)' }}>{coachResult.verdict}</div>
                  <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8, maxWidth: 400 }}>{coachResult.overall_message}</p>
                </div>
                <div style={{ width: 100, height: 100, borderRadius: '50%', border: `8px solid ${coachResult.score > 70 ? 'var(--green)' : coachResult.score > 40 ? 'var(--accent)' : '#ff5c5c'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{coachResult.score}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>/ 100</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Item by Item Analysis</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {coachResult.items_analysis?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg3)', borderRadius: 10, padding: 16, border: `1px solid ${item.keep ? 'rgba(61,214,140,0.2)' : 'rgba(255,92,92,0.2)'}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{item.reason}</div>
                    </div>
                    <div style={{ padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700, background: 'transparent', color: verdictColors[item.judgment] || 'var(--text)', border: `1px solid ${verdictColors[item.judgment] || 'var(--border)'}` }}>{item.judgment}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {coachResult.best_item && (
                  <div style={{ padding: 16, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, fontSize: 13 }}>
                    <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>🏆 Best Item</div>
                    <div>{coachResult.best_item}</div>
                  </div>
                )}
                {coachResult.questionable_item && (
                  <div style={{ padding: 16, background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 10, fontSize: 13 }}>
                    <div style={{ color: '#ff5c5c', fontWeight: 700, marginBottom: 4 }}>🤔 Think Twice</div>
                    <div>{coachResult.questionable_item}</div>
                  </div>
                )}
              </div>

              {coachResult.money_saving_tip && (
                <div style={{ padding: 16, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 10, fontSize: 14, color: 'var(--accent)', marginBottom: 16 }}>
                  💡 <strong>Money Tip:</strong> {coachResult.money_saving_tip}
                </div>
              )}

              <div style={{ padding: 16, background: 'var(--bg3)', borderRadius: 10, fontSize: 14, marginBottom: 16 }}>
                <strong>Total Verdict:</strong> <span style={{ color: 'var(--text2)' }}>{coachResult.total_verdict}</span>
              </div>

              <button className="btn btn-outline" onClick={() => setCoachResult(null)}>🔄 Re-analyze</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}