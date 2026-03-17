import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, api, toast, logout } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zync1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zync2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zync3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zync4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zync5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=zync6',
  ];

  if (!user) { navigate('/'); return null; }

  const saveProfile = async () => {
    if (!form.name.trim()) { toast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    const r = await api('/api/profile', { method: 'PATCH', body: JSON.stringify(form) });
    setSaving(false);
    if (r.success) { toast('Profile updated! ✅'); setEditing(false); }
    else toast(r.error || 'Failed to update', 'error');
  };

  const stats = [
    { icon: '📦', label: 'Orders', value: '—' },
    { icon: '❤️', label: 'Wishlist', value: '—' },
    { icon: '⭐', label: 'Reviews', value: '—' },
    { icon: '🛒', label: 'Cart Items', value: '—' },
  ];

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 14 };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: -0.5 }}>My Profile</h1>

      {/* Profile Card */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img src={user.avatar} alt={user.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-bd)' }} onError={e => e.target.src = 'https://ui-avatars.com/api/?name=' + user.name + '&size=96'} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', border: '2px solid var(--bg2)' }}>✏️</div>
          </div>
          <div style={{ flex: 1 }}>
            {!editing ? (
              <>
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{user.name}</h2>
                <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{user.email}</div>
                {user.phone && <div style={{ color: 'var(--text3)', fontSize: 13 }}>📞 {user.phone}</div>}
                <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input style={inputStyle} placeholder="10-digit mobile" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'').substring(0,10)})} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                  <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Picker */}
        {editing && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>Choose Avatar</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {avatars.map((av, i) => (
                <img key={i} src={av} alt="avatar" style={{ width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', border: user.avatar === av ? '3px solid var(--accent)' : '3px solid transparent', background: 'var(--bg3)' }}
                  onClick={async () => { await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ avatar: av }) }); toast('Avatar updated!'); }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>Quick Links</div>
        {[
          { icon: '📦', label: 'My Orders', sub: 'Track and manage your orders', path: '/orders' },
          { icon: '❤️', label: 'Wishlist', sub: 'Products you saved for later', path: '/wishlist' },
          { icon: '🤖', label: 'AI Features', sub: 'Smart shopping tools', path: '/ai' },
          { icon: '⚡', label: 'Advanced AI', sub: 'Gift finder, style DNA, deals', path: '/ai-advanced' },
        ].map(link => (
          <div key={link.label} onClick={() => navigate(link.path)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: 24 }}>{link.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{link.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{link.sub}</div>
            </div>
            <span style={{ color: 'var(--text3)' }}>›</span>
          </div>
        ))}
      </div>

      {/* Account Info */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Account Information</div>
        {[
          { label: 'Email', value: user.email },
          { label: 'Member Since', value: 'ZYNC AI Store' },
          { label: 'Account Type', value: 'Standard' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
            <span style={{ color: 'var(--text3)' }}>{row.label}</span>
            <span style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button className="btn btn-outline" style={{ width: '100%', color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => { logout(); navigate('/'); }}>
        🚪 Logout
      </button>
    </div>
  );
}