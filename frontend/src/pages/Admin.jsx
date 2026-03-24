import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#e8b86d','#4f9eff','#3dd68c','#a78bfa','#ff5c5c','#22d3ee'];

const ADMIN_EMAILS = ['admin@zync.com', 'pranjal@zync.com'];

export default function Admin() {
  const { api, fmt, user } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminLogin, setAdminLogin] = useState({ email: '', password: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    // Check if current user is admin
    if (user && ADMIN_EMAILS.includes(user.email)) {
      setIsAdmin(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [s, o, u] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/orders'),
      api('/api/admin/users'),
    ]);
    if (s.success) setStats(s.data);
    if (o.success) setOrders(o.data);
    if (u.success) setUsers(u.data);
    setLoading(false);
  };

  const handleAdminLogin = async () => {
    setLoginError('');
    const r = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(adminLogin),
    });
    if (r.success) {
      setIsAdmin(true);
      loadData();
    } else {
      setLoginError(r.error || 'Invalid credentials');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrder(orderId);
    const r = await api(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (r.success) {
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status } : o));
    }
    setUpdatingOrder(null);
  };

  const STATUS_COLORS = {
    confirmed: 'var(--green)',
    processing: 'var(--accent)',
    shipped: 'var(--blue)',
    delivered: 'var(--green)',
    cancelled: 'var(--red)',
  };

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 14 };

  // Admin Login Screen
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, padding: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Admin Access</h2>
            <p style={{ color: 'var(--text3)', fontSize: 14 }}>Enter admin credentials to continue</p>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.3)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>
              {loginError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Admin Email</label>
              <input style={inputStyle} placeholder="admin@zync.com" value={adminLogin.email}
                onChange={e => setAdminLogin({ ...adminLogin, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input style={inputStyle} type="password" placeholder="••••••••" value={adminLogin.password}
                onChange={e => setAdminLogin({ ...adminLogin, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} onClick={handleAdminLogin}>
              Login to Admin Panel →
            </button>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg3)', borderRadius: 12, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
            💡 Register with <strong>admin@zync.com</strong> first, then login here
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="loading-wrap" style={{ minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'orders', icon: '📦', label: `Orders ${orders.length > 0 ? `(${orders.length})` : ''}` },
    { id: 'users', icon: '👥', label: `Users ${users.length > 0 ? `(${users.length})` : ''}` },
    { id: 'products', icon: '🛍️', label: `Products (${stats?.total_products || 0})` },
  ];

  const StatCard = ({ icon, label, value, sub, color, trend }) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
        {trend && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, background: 'rgba(61,214,140,0.1)', padding: '4px 10px', borderRadius: 50 }}>↑ {trend}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || 'var(--accent)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: '24px 16px', flexShrink: 0 }}>
        <div style={{ marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)', letterSpacing: -0.5 }}>ZYNC</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Admin Panel</div>
        </div>

        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: tab === t.id ? 'var(--accent-bg)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--text2)', fontWeight: tab === t.id ? 700 : 500, transition: 'all 0.2s', border: tab === t.id ? '1px solid var(--accent-bd)' : '1px solid transparent' }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 13 }}>{t.label}</span>
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid var(--border)', marginTop: 40 }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', color: 'var(--text3)', fontSize: 13 }}>
            🏠 Back to Store
          </div>
          <div onClick={() => { setIsAdmin(false); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', color: 'var(--red)', fontSize: 13 }}>
            🚪 Logout
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && stats && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Dashboard</h1>
              <p style={{ color: 'var(--text3)', marginTop: 4 }}>Welcome back! Here's what's happening at ZYNC.</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <StatCard icon="💰" label="Total Revenue" value={fmt(stats.total_revenue)} sub="All time" color="var(--accent)" trend="12%" />
              <StatCard icon="📦" label="Total Orders" value={stats.total_orders} sub="All time" color="var(--blue)" trend="8%" />
              <StatCard icon="👥" label="Total Users" value={stats.total_users} sub="Registered" color="var(--green)" trend="15%" />
              <StatCard icon="🛍️" label="Products" value={stats.total_products} sub="In catalog" color="var(--purple)" />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Revenue Chart */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📈 Revenue & Orders (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.daily_revenue}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'K'} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fill="url(#rev)" strokeWidth={2} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Order Status Pie */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Order Status</h3>
                {Object.keys(stats.status_counts).length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={Object.entries(stats.status_counts).map(([k, v]) => ({ name: k, value: v }))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                        {Object.keys(stats.status_counts).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: 14 }}>No orders yet</div>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Recent Orders */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>📦 Recent Orders</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTab('orders')}>View All →</button>
                </div>
                {stats.recent_orders?.length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No orders yet</div>
                ) : (
                  stats.recent_orders?.slice(0, 5).map(o => (
                    <div key={o.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: 12, marginBottom: 2 }}>{o.order_id}</div>
                        <div style={{ color: 'var(--text3)', fontSize: 11 }}>{o.user_email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{fmt(o.total)}</div>
                        <div style={{ fontSize: 11, color: STATUS_COLORS[o.status] || 'var(--accent)', fontWeight: 600 }}>{o.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Top Products */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏆 Top Ordered Products</h3>
                {stats.top_products?.length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No data yet</div>
                ) : (
                  stats.top_products?.map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${COLORS[i]}20`, color: COLORS[i], fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{p.count}x</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Orders</h1>
                <p style={{ color: 'var(--text3)', marginTop: 4 }}>{orders.length} total orders</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={loadData}>🔄 Refresh</button>
            </div>

            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>Orders will appear here once customers start buying</p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                      {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      let items = o.items || [];
                      if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
                      return (
                        <tr key={o.order_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>{o.order_id}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13 }}>
                            <div style={{ fontWeight: 600 }}>{o.user_email?.split('@')[0]}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.user_email}</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text2)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</td>
                          <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmt(o.total)}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text3)' }}>
                            {o.date ? new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: `${STATUS_COLORS[o.status] || 'var(--accent)'}20`, color: STATUS_COLORS[o.status] || 'var(--accent)' }}>
                              {o.status || 'confirmed'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <select
                              value={o.status || 'confirmed'}
                              onChange={e => updateOrderStatus(o.order_id, e.target.value)}
                              disabled={updatingOrder === o.order_id}
                              style={{ padding: '6px 10px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
                              {['confirmed','processing','shipped','delivered','cancelled'].map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Users</h1>
                <p style={{ color: 'var(--text3)', marginTop: 4 }}>{users.length} registered users</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={loadData}>🔄 Refresh</button>
            </div>

            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No users yet</h3>
                <p>Users will appear here after they register</p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                      {['User', 'Email', 'Phone', 'Joined'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.email} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text3)' }}>{u.phone || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text3)' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Products</h1>
                <p style={{ color: 'var(--text3)', marginTop: 4 }}>{stats?.total_products || 0} products in catalog</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="Search products..." style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13, width: 220 }} />
                <button className="btn btn-primary btn-sm">+ Add Product</button>
              </div>
            </div>

            {/* Category breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
              {Object.entries(
                ['Shoes','Clothing','Electronics','Sports','Bags','Beauty','Gaming','Health','Home','Books'].reduce((acc, cat) => {
                  acc[cat] = 0; return acc;
                }, {})
              ).map(([cat], i) => (
                <div key={cat} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center', borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS[i % COLORS.length] }}>
                    {stats?.total_products ? Math.round(stats.total_products / 10) : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{cat}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg2)', border: '1px solid var(--accent-bd)', borderRadius: 12, padding: 20, fontSize: 14, color: 'var(--text2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>💡 Product Management</div>
              To add, edit or delete products, update the <code style={{ background: 'var(--bg3)', padding: '2px 8px', borderRadius: 6, color: 'var(--accent)', fontSize: 13 }}>data/products.py</code> file in your project. The catalog auto-reloads when Flask restarts.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}