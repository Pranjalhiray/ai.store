import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthModal({ open, onClose }) {
  const [mode,    setMode]    = useState('login');
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const emailRef = useRef(null);
  const { login, register } = useApp();

  // Auto-focus email when modal opens
  useEffect(() => {
    if (open) {
      setError('');
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open]);

  const handle = async () => {
    if (!form.email || !form.password) { setError('Please fill all fields.'); return; }
    setError(''); setLoading(true);
    const r = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    setLoading(false);
    if (r.success) {
      setForm({ name: '', email: '', password: '' });
      onClose();
    } else {
      setError(r.error || 'Something went wrong.');
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setForm({ name: '', email: '', password: '' });
  };

  if (!open) return null;

  return (
    <>
      <div className="overlay active" onClick={onClose} />

      <div className="modal active">
        <div
          className="modal-box"
          style={{
            maxWidth: 420,
            background: 'rgba(8,11,18,0.92)',
            backdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(232,184,109,0.14)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* ── Top edge glow ── */}
          <div style={{
            position: 'absolute', top: 0, left: '25%', right: '25%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(232,184,109,0.5), transparent)',
            borderRadius: 1,
          }} />

          {/* ── Header ── */}
          <div className="modal-header" style={{ padding: '24px 28px', background: 'transparent' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                {mode === 'login' ? '— SIGN IN —' : '— WELCOME —'}
              </div>
              <div className="modal-title" style={{ fontSize: 22 }}>
                {mode === 'login' ? 'Good to see you back' : 'Create your account'}
              </div>
            </div>
            <button
              className="modal-close"
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >✕</button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '8px 28px 28px' }}>
            {/* Demo hint */}
            {mode === 'login' && (
              <div style={{
                padding: '10px 14px', marginBottom: 20,
                background: 'rgba(232,184,109,0.07)',
                border: '1px solid rgba(232,184,109,0.15)',
                borderRadius: 10, fontSize: 12, color: 'var(--text2)',
              }}>
                <strong style={{ color: 'var(--accent)' }}>Demo account</strong>
                {' '}&nbsp;test@demo.com / demo123
                <button
                  onClick={() => setForm({ ...form, email: 'test@demo.com', password: 'demo123' })}
                  style={{
                    marginLeft: 8, padding: '2px 9px', background: 'var(--accent-bg)',
                    border: '1px solid var(--accent-bd)', borderRadius: 6,
                    color: 'var(--accent)', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                  }}
                >Fill</button>
              </div>
            )}

            {mode === 'register' && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.5 }}>FULL NAME</label>
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.5 }}>EMAIL</label>
              <input
                ref={emailRef}
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.5 }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  style={{ width: '100%', paddingRight: 44, background: 'rgba(255,255,255,0.04)' }}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handle()}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: 'var(--text3)', transition: 'color 0.2s',
                  }}
                >{showPwd ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {error && (
              <div style={{
                color: '#ff5c6e', fontSize: 13, marginBottom: 14,
                padding: '10px 14px',
                background: 'rgba(255,92,110,0.08)',
                border: '1px solid rgba(255,92,110,0.2)',
                borderRadius: 9,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: 16, position: 'relative' }}
              onClick={handle}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Please wait…
                </span>
              ) : (
                mode === 'login' ? 'Sign In →' : 'Create Account →'
              )}
            </button>

            {/* Mode switch */}
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={switchMode}
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}
              >
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </span>
            </div>

            {/* Divider + social hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Secured by ZYNC</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}