import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useApp();

  const handle = async () => {
    setError(''); setLoading(true);
    const r = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    setLoading(false);
    if (r.success) onClose();
    else setError(r.error || 'Something went wrong');
  };

  if (!open) return null;

  return (
    <>
      <div className="overlay active" onClick={onClose} />
      <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-box" style={{ maxWidth: 420 }}>
          <div className="modal-header">
            <div className="modal-title">{mode === 'login' ? '👤 Login' : '✨ Create Account'}</div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: '0 0 20px' }}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handle()} />
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handle} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Sign up' : 'Login'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}