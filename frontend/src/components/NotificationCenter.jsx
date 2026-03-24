import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const NOTIF_TYPES = {
  order:    { icon:'📦', color:'#4f9eff', bg:'rgba(79,158,255,0.1)' },
  deal:     { icon:'🔥', color:'#f97316', bg:'rgba(249,115,22,0.1)' },
  ai:       { icon:'🤖', color:'#a78bfa', bg:'rgba(167,139,250,0.1)' },
  wishlist: { icon:'❤️', color:'#ff5c5c', bg:'rgba(255,92,92,0.1)' },
  system:   { icon:'⚡', color:'#c8a96e', bg:'rgba(200,169,110,0.1)' },
  review:   { icon:'⭐', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
};

// Default seed notifications for a fresh install
const SEED_NOTIFICATIONS = [
  { id:1, type:'system',   title:'Welcome to ZYNC! 🎉',           body:'Discover 470+ products with AI-powered recommendations.',   time: Date.now() - 1000*60*2,   read:false, link:'/'         },
  { id:2, type:'deal',     title:'Flash Sale — Up to 40% OFF',     body:'Limited time deals on Electronics & Shoes. Shop now!',      time: Date.now() - 1000*60*30,  read:false, link:'/shop'     },
  { id:3, type:'ai',       title:'AI Recommendation Ready',        body:'Based on your browsing, we found 12 products you\'ll love.', time: Date.now() - 1000*60*60,  read:true,  link:'/ai'       },
  { id:4, type:'system',   title:'New Feature: Voice Search',       body:'Try saying "running shoes under ₹3000" in the search bar.', time: Date.now() - 1000*3600*3, read:true,  link:'/shop'     },
  { id:5, type:'deal',     title:'Deal Sniper Alert',              body:'Adidas Ultraboost dropped 22% — Now ₹7,499!',               time: Date.now() - 1000*3600*6, read:true,  link:'/shop?category=Shoes' },
];

export default function NotificationCenter() {
  const { currentUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => {
    try {
      const stored = sessionStorage.getItem('zync_notifs');
      return stored ? JSON.parse(stored) : SEED_NOTIFICATIONS;
    } catch { return SEED_NOTIFICATIONS; }
  });
  const [filter, setFilter] = useState('all');
  const [animating, setAnimating] = useState(false);
  const ref = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  // Persist to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('zync_notifs', JSON.stringify(notifs)); } catch {}
  }, [notifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Simulate live notifications every 45s
  useEffect(() => {
    if (!currentUser) return;
    const liveNotifs = [
      { type:'deal',     title:'Price Drop Alert!',          body:'boAt Airdopes 141 is now ₹999 — was ₹1,499.',    link:'/shop?category=Electronics' },
      { type:'ai',       title:'Your Taste Profile Updated', body:'We learned your style — new picks in Your Feed!', link:'/visualizations' },
      { type:'system',   title:'Order Shipped 🚚',           body:'Your recent order is on the way! Track it now.',  link:'/orders' },
      { type:'deal',     title:'Weekend Deal — 30% OFF',     body:'Flat 30% on all Clothing items this weekend.',    link:'/shop?category=Clothing' },
      { type:'review',   title:'Review Reminder',            body:'How was your recent purchase? Rate it now!',      link:'/orders' },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (!document.hidden) {
        const n = liveNotifs[idx % liveNotifs.length];
        const newN = { ...n, id: Date.now(), time: Date.now(), read: false };
        setNotifs(prev => [newN, ...prev].slice(0, 30));
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
        idx++;
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? {...n, read:true} : n));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({...n, read:true})));
  const deleteNotif = (id, e) => { e.stopPropagation(); setNotifs(prev => prev.filter(n => n.id !== id)); };
  const clearAll = () => setNotifs([]);

  const handleNotifClick = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)    return 'Just now';
    if (s < 3600)  return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const filtered = filter === 'all'
    ? notifs
    : filter === 'unread'
    ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'relative', background:'var(--bg2)', border:'1px solid var(--border2)',
          borderRadius:10, width:42, height:42, cursor:'pointer', display:'flex',
          alignItems:'center', justifyContent:'center', fontSize:18, transition:'all 0.2s',
          color:'var(--text1)',
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--bg3)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.background='var(--bg2)'; }}
      >
        <span style={{ display:'inline-block', animation: animating ? 'bell-ring 0.5s ease' : 'none' }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-6, right:-6,
            background:'linear-gradient(135deg,#ff5c5c,#f97316)',
            color:'#fff', fontSize:10, fontWeight:800,
            width:unread > 9 ? 22 : 18, height:18, borderRadius:9,
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: animating ? 'pop-in 0.3s ease' : 'none',
            boxShadow:'0 2px 8px rgba(255,92,92,0.5)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position:'absolute', right:0, top:'calc(100% + 10px)',
          width:380, maxHeight:520, background:'var(--bg1)',
          border:'1px solid var(--border2)', borderRadius:16,
          boxShadow:'0 24px 60px rgba(0,0,0,0.5)',
          zIndex:1000, overflow:'hidden', display:'flex', flexDirection:'column',
          animation:'slide-down 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <h3 style={{ color:'var(--text1)', fontSize:15, fontWeight:800, margin:0 }}>Notifications</h3>
              {unread > 0 && (
                <p style={{ color:'var(--text3)', fontSize:12, margin:0 }}>{unread} unread</p>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {unread > 0 && (
                <button onClick={markAllRead}
                  style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-bd)', color:'var(--accent)', padding:'5px 10px', borderRadius:8, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                  Mark all read
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={clearAll}
                  style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text3)', padding:'5px 10px', borderRadius:8, fontSize:11, cursor:'pointer' }}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display:'flex', gap:0, padding:'10px 18px 0', overflowX:'auto', flexShrink:0 }}>
            {[
              { key:'all',      label:'All' },
              { key:'unread',   label:'Unread' },
              { key:'deal',     label:'🔥 Deals' },
              { key:'ai',       label:'🤖 AI' },
              { key:'order',    label:'📦 Orders' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding:'6px 12px', borderRadius:'8px 8px 0 0', border:'none', background:'none',
                  color: filter === f.key ? 'var(--accent)' : 'var(--text3)',
                  fontWeight: filter === f.key ? 700 : 400, fontSize:12, cursor:'pointer',
                  borderBottom: filter === f.key ? '2px solid var(--accent)' : '2px solid transparent',
                  whiteSpace:'nowrap', transition:'all 0.15s',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY:'auto', flex:1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding:40, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🔔</div>
                <p style={{ color:'var(--text3)', fontSize:14 }}>No notifications</p>
              </div>
            ) : filtered.map(n => {
              const cfg = NOTIF_TYPES[n.type] || NOTIF_TYPES.system;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    padding:'14px 18px', display:'flex', gap:12, alignItems:'flex-start',
                    cursor:'pointer', borderBottom:'1px solid var(--border2)',
                    background: n.read ? 'transparent' : 'rgba(200,169,110,0.04)',
                    transition:'background 0.15s', position:'relative',
                  }}
                  onMouseOver={e => e.currentTarget.style.background='var(--bg2)'}
                  onMouseOut={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(200,169,110,0.04)'}
                >
                  {/* Icon */}
                  <div style={{
                    width:40, height:40, borderRadius:10, background: cfg.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0,
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <p style={{ color:'var(--text1)', fontSize:13, fontWeight: n.read ? 500 : 700, margin:0, lineHeight:1.4 }}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:4 }} />
                      )}
                    </div>
                    <p style={{ color:'var(--text3)', fontSize:12, margin:'3px 0 0', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {n.body}
                    </p>
                    <p style={{ color: cfg.color, fontSize:11, margin:'4px 0 0', fontWeight:600 }}>{timeAgo(n.time)}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => deleteNotif(n.id, e)}
                    style={{ background:'none', border:'none', color:'var(--text3)', fontSize:14, cursor:'pointer', padding:'2px 4px', borderRadius:4, flexShrink:0, opacity:0.6 }}
                    onMouseOver={e => e.currentTarget.style.opacity='1'}
                    onMouseOut={e => e.currentTarget.style.opacity='0.6'}
                  >✕</button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 18px', borderTop:'1px solid var(--border2)', textAlign:'center', flexShrink:0 }}>
            <button onClick={() => setOpen(false)}
              style={{ background:'none', border:'none', color:'var(--accent)', fontSize:13, cursor:'pointer', fontWeight:600 }}>
              Close ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bell-ring {
          0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(15deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(10deg)}
        }
        @keyframes pop-in {
          0%{transform:scale(0.5)} 70%{transform:scale(1.2)} 100%{transform:scale(1)}
        }
        @keyframes slide-down {
          from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </div>
  );
}

// Export a hook so other components can push notifications
export function useNotifications() {
  const push = (type, title, body, link = '/') => {
    const n = { id: Date.now(), type, title, body, link, time: Date.now(), read: false };
    try {
      const stored = JSON.parse(sessionStorage.getItem('zync_notifs') || '[]');
      sessionStorage.setItem('zync_notifs', JSON.stringify([n, ...stored].slice(0, 30)));
    } catch {}
  };
  return { push };
}