import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Orders() {
  const { api, fmt, user } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api('/api/orders').then(r => {
      if (r.success) setOrders(r.data);
      setLoading(false);
    });
  }, [user]);

  const statusColor = {
    'confirmed': 'var(--green)',
    'processing': 'var(--accent)',
    'shipped': 'var(--blue)',
    'delivered': 'var(--green)',
    'cancelled': 'var(--red)',
  };

  const statusIcon = {
    'confirmed': '✅',
    'processing': '⚙️',
    'shipped': '🚚',
    'delivered': '📦',
    'cancelled': '❌',
  };

  if (!user) return null;

  if (loading) return (
    <div className="loading-wrap" style={{ minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>My Orders</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your purchase history will appear here</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/shop')}>Start Shopping</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.order_id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {/* Order Header */}
              <div
                style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expanded === order.order_id ? '1px solid var(--border)' : 'none' }}
                onClick={() => setExpanded(expanded === order.order_id ? null : order.order_id)}
              >
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Order ID</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>{order.order_id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Date</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Total</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{fmt(order.total)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Items</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700, background: `${statusColor[order.status] || 'var(--accent)'}20`, color: statusColor[order.status] || 'var(--accent)', border: `1px solid ${statusColor[order.status] || 'var(--accent)'}40` }}>
                    {statusIcon[order.status] || '📦'} {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 18 }}>{expanded === order.order_id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Order Details */}
              {expanded === order.order_id && (
                <div style={{ padding: '24px' }}>
                  {/* Product thumbnails */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, padding: 12, flex: '1 1 200px' }}>
                        <img src={item.image} alt={item.name} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200'} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Qty: {item.quantity}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{fmt(item.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tracking & Address */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>📍 Tracking</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--blue)', fontWeight: 600, marginBottom: 4 }}>{order.tracking}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Est. Delivery: {order.estimated}</div>
                    </div>
                    {order.address && (
                      <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>📦 Delivery Address</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{order.address.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{order.address.line1}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{order.address.city} — {order.address.pin}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline btn-sm">🔄 Track Order</button>
                    <button className="btn btn-outline btn-sm">↩️ Return/Refund</button>
                    <button className="btn btn-ghost btn-sm">📄 Invoice</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}