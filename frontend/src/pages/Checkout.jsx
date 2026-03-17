import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Checkout() {
  const { cart, cartTotal, fmt, api, toast, user } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState('card');
  const [upiApp, setUpiApp] = useState(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const [address, setAddress] = useState({
    fname: user?.name?.split(' ')[0] || '',
    lname: user?.name?.split(' ')[1] || '',
    phone: '', line1: '', line2: '', city: '', state: '', pin: '',
  });

  const [payment, setPayment] = useState({
    card: '', expiry: '', cvv: '', cname: user?.name || '',
    upi: '', bank: '',
  });

  const shipping = cartTotal >= 999 ? 0 : 79;
  const tax = Math.round(cartTotal * 0.05);
  const total = cartTotal + shipping + tax;

  const formatCard = (val) => {
    return val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1  ').trim();
  };

  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2);
    return v;
  };

  const validateAddress = () => {
    if (!address.fname || !address.phone || !address.line1 || !address.city || !address.pin) {
      toast('Please fill all required fields', 'error');
      return false;
    }
    if (address.pin.length !== 6) { toast('Enter valid 6-digit PIN code', 'error'); return false; }
    if (address.phone.length !== 10) { toast('Enter valid 10-digit phone number', 'error'); return false; }
    return true;
  };

  const validatePayment = () => {
    if (payMethod === 'card') {
      const c = payment.card.replace(/\s/g, '');
      if (c.length < 13) { toast('Enter valid card number', 'error'); return false; }
      if (!payment.expiry || payment.expiry.length < 5) { toast('Enter valid expiry date', 'error'); return false; }
      if (payment.cvv.length < 3) { toast('Enter valid CVV', 'error'); return false; }
    } else if (payMethod === 'upi') {
      if (!payment.upi || !payment.upi.includes('@')) { toast('Enter valid UPI ID', 'error'); return false; }
    } else if (payMethod === 'netbanking') {
      if (!selectedBank) { toast('Please select your bank', 'error'); return false; }
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validatePayment()) return;
    setLoading(true);

    let paymentData = { method: payMethod };
    if (payMethod === 'card') paymentData = { method: 'card', card_number: payment.card.replace(/\s/g,''), expiry: payment.expiry, cvv: payment.cvv };
    else if (payMethod === 'upi') paymentData = { method: 'upi', upi_id: payment.upi };
    else if (payMethod === 'netbanking') paymentData = { method: 'netbanking', bank: selectedBank };
    else if (payMethod === 'cod') paymentData = { method: 'cod' };

    const r = await api('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        address: { name: address.fname + ' ' + address.lname, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, pin: address.pin },
        payment: paymentData,
      }),
    });

    setLoading(false);
    if (r.success) {
      setOrderData(r.data);
      setStep(3);
    } else {
      toast(r.error || 'Order failed. Try again.', 'error');
    }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none' };

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Login to Checkout</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Please login to place your order</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>Go to Login</button>
      </div>
    );
  }

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Add products before checking out</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/shop')}>Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: -0.5 }}>Checkout</h1>

      {/* Steps */}
      {step < 3 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          {[
            { n: 1, label: 'Delivery' },
            { n: 2, label: 'Payment' },
            { n: 3, label: 'Confirm' },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: step >= s.n ? 'var(--accent)' : 'var(--bg3)', color: step >= s.n ? '#000' : 'var(--text3)', border: step >= s.n ? 'none' : '1px solid var(--border2)' }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === s.n ? 700 : 500, color: step === s.n ? 'var(--accent)' : step > s.n ? 'var(--green)' : 'var(--text3)' }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border2)', width: 40 }} />}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: step === 3 ? '1fr' : '1fr 380px', gap: 32 }}>
        {/* Left - Form */}
        <div>

          {/* Step 1 - Address */}
          {step === 1 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>📦 Delivery Address</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>First Name *</label>
                  <input style={inputStyle} placeholder="Pranjal" value={address.fname} onChange={e => setAddress({...address, fname: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input style={inputStyle} placeholder="Hiray" value={address.lname} onChange={e => setAddress({...address, lname: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Phone Number *</label>
                <input style={inputStyle} placeholder="10-digit mobile number" value={address.phone} onChange={e => setAddress({...address, phone: e.target.value.replace(/\D/g,'').substring(0,10)})} />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Address Line 1 *</label>
                <input style={inputStyle} placeholder="House/Flat No, Street Name" value={address.line1} onChange={e => setAddress({...address, line1: e.target.value})} />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Address Line 2</label>
                <input style={inputStyle} placeholder="Area, Landmark (optional)" value={address.line2} onChange={e => setAddress({...address, line2: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label>City *</label>
                  <input style={inputStyle} placeholder="Mumbai" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <select style={inputStyle} value={address.state} onChange={e => setAddress({...address, state: e.target.value})}>
                    <option value="">Select State</option>
                    {['Maharashtra','Delhi','Karnataka','Tamil Nadu','Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Telangana','Kerala','Punjab','Haryana','Madhya Pradesh','Bihar','Odisha'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>PIN Code *</label>
                  <input style={inputStyle} placeholder="400001" value={address.pin} onChange={e => setAddress({...address, pin: e.target.value.replace(/\D/g,'').substring(0,6)})} />
                </div>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => { if (validateAddress()) setStep(2); }}>
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 2 - Payment */}
          {step === 2 && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>💳 Payment Method</h2>

              {/* Payment Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {[
                  { id: 'card', icon: '💳', label: 'Card' },
                  { id: 'upi', icon: '📱', label: 'UPI' },
                  { id: 'netbanking', icon: '🏦', label: 'Net Banking' },
                  { id: 'cod', icon: '💵', label: 'Cash on Delivery' },
                ].map(m => (
                  <div
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `1px solid ${payMethod === m.id ? 'var(--accent)' : 'var(--border2)'}`, background: payMethod === m.id ? 'var(--accent-bg)' : 'var(--bg3)', color: payMethod === m.id ? 'var(--accent)' : 'var(--text3)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: 12, fontWeight: 600 }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Card Payment */}
              {payMethod === 'card' && (
                <div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label>Card Number</label>
                    <input style={inputStyle} placeholder="1234  5678  9012  3456" value={payment.card} onChange={e => setPayment({...payment, card: formatCard(e.target.value)})} maxLength={19} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input style={inputStyle} placeholder="MM/YY" value={payment.expiry} onChange={e => setPayment({...payment, expiry: formatExpiry(e.target.value)})} maxLength={5} />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input style={inputStyle} type="password" placeholder="•••" value={payment.cvv} onChange={e => setPayment({...payment, cvv: e.target.value.replace(/\D/g,'').substring(0,4)})} maxLength={4} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label>Cardholder Name</label>
                    <input style={inputStyle} placeholder="Name on card" value={payment.cname} onChange={e => setPayment({...payment, cname: e.target.value})} />
                  </div>
                  <div style={{ padding: 14, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 10, fontSize: 13, color: 'var(--accent)', marginBottom: 20 }}>
                    🔒 Your payment is secured with 256-bit SSL encryption
                  </div>
                </div>
              )}

              {/* UPI Payment */}
              {payMethod === 'upi' && (
                <div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    {[
                      { id: 'gpay', label: 'GPay', color: '#4285F4', suffix: 'okaxis' },
                      { id: 'phonepe', label: 'PhonePe', color: '#5F259F', suffix: 'ybl' },
                      { id: 'paytm', label: 'Paytm', color: '#00BAF2', suffix: 'paytm' },
                      { id: 'bhim', label: 'BHIM', color: '#FF6B00', suffix: 'upi' },
                    ].map(app => (
                      <div
                        key={app.id}
                        onClick={() => { setUpiApp(app.id); setPayment({...payment, upi: 'yourname@' + app.suffix}); }}
                        style={{ flex: 1, padding: '16px 8px', borderRadius: 12, border: `1px solid ${upiApp === app.id ? 'var(--accent)' : 'var(--border2)'}`, background: upiApp === app.id ? 'var(--accent-bg)' : 'var(--bg3)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: app.color, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                          {app.label[0]}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: upiApp === app.id ? 'var(--accent)' : 'var(--text2)' }}>{app.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label>UPI ID</label>
                    <input style={inputStyle} placeholder="yourname@upi" value={payment.upi} onChange={e => setPayment({...payment, upi: e.target.value})} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>e.g. name@okaxis, name@ybl, 9876543210@upi</div>
                  <div style={{ padding: 14, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--green)', marginBottom: 20 }}>
                    ✅ UPI payments are instant and 100% secure via NPCI
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {payMethod === 'netbanking' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                    {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'PNB'].map(bank => (
                      <div
                        key={bank}
                        onClick={() => setSelectedBank(bank)}
                        style={{ padding: 14, borderRadius: 10, border: `1px solid ${selectedBank === bank ? 'var(--accent)' : 'var(--border2)'}`, background: selectedBank === bank ? 'var(--accent-bg)' : 'var(--bg3)', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'center', color: selectedBank === bank ? 'var(--accent)' : 'var(--text2)', transition: 'all 0.2s' }}
                      >
                        🏦 {bank}
                      </div>
                    ))}
                  </div>
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label>Other Banks</label>
                    <select style={inputStyle} value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                      <option value="">Select your bank...</option>
                      {['Bank of Baroda','Canara Bank','Union Bank','IndusInd Bank','Yes Bank','Federal Bank','IDFC First Bank','RBL Bank'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ padding: 14, background: 'var(--blue-bg)', border: '1px solid rgba(79,158,255,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--blue)', marginBottom: 20 }}>
                    ℹ️ You'll be redirected to your bank's secure portal after confirming
                  </div>
                </div>
              )}

              {/* Cash on Delivery */}
              {payMethod === 'cod' && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>💵</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Cash on Delivery</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 8 }}>Pay when your order arrives at your doorstep</p>
                  <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>₹30 extra COD charge applicable</p>
                  <div style={{ padding: 16, background: 'rgba(61,214,140,0.08)', border: '1px solid rgba(61,214,140,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--green)' }}>
                    ✅ No prepayment required · Pay on delivery
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={placeOrder} disabled={loading}>
                  {loading ? '⏳ Processing...' : `Pay ${fmt(total + (payMethod === 'cod' ? 30 : 0))} →`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Success */}
          {step === 3 && orderData && (
            <div style={{ textAlign: 'center', padding: '40px 32px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounceIn 0.5s ease' }}>🎉</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Order Confirmed!</h2>
              <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 32 }}>
                Thank you <strong style={{ color: 'var(--accent)' }}>{user.name}</strong>! Your order has been placed successfully.
              </p>

              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 32, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text3)' }}>Order ID</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700 }}>{orderData.order_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text3)' }}>Tracking ID</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--blue)' }}>{orderData.tracking}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text3)' }}>Estimated Delivery</span>
                  <span style={{ fontWeight: 600 }}>{orderData.estimated}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 700 }}>
                  <span>Total Paid</span>
                  <span style={{ color: 'var(--green)' }}>{fmt(orderData.total)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/orders')}>View My Orders</button>
                <button className="btn btn-outline btn-lg" onClick={() => navigate('/')}>Continue Shopping</button>
              </div>
            </div>
          )}
        </div>

        {/* Right - Order Summary */}
        {step < 3 && (
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, position: 'sticky', top: 84 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>

              {/* Cart Items */}
              <div style={{ marginBottom: 20, maxHeight: 300, overflowY: 'auto' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <img src={item.image} alt={item.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: 'var(--bg3)' }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Coupon code" />
                <button className="btn btn-outline btn-sm">Apply</button>
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {[
                  { label: 'Subtotal', value: fmt(cartTotal) },
                  { label: 'Shipping', value: shipping === 0 ? '🎉 FREE' : fmt(shipping) },
                  { label: 'Tax (5% GST)', value: fmt(tax) },
                  ...(payMethod === 'cod' ? [{ label: 'COD Charge', value: '₹30' }] : []),
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10, color: 'var(--text2)' }}>
                    <span>{row.label}</span>
                    <span style={{ color: row.value.includes('FREE') ? 'var(--green)' : 'var(--text)' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent)' }}>{fmt(total + (payMethod === 'cod' ? 30 : 0))}</span>
                </div>
              </div>

              {/* Delivery Address Summary */}
              {step === 2 && address.line1 && (
                <div style={{ marginTop: 20, padding: 14, background: 'var(--bg3)', borderRadius: 10, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>📦 Delivering to:</div>
                  <div style={{ color: 'var(--text2)' }}>{address.fname} {address.lname}</div>
                  <div style={{ color: 'var(--text2)' }}>{address.line1}{address.line2 ? ', ' + address.line2 : ''}</div>
                  <div style={{ color: 'var(--text2)' }}>{address.city}{address.state ? ', ' + address.state : ''} — {address.pin}</div>
                </div>
              )}

              {/* Security badges */}
              <div style={{ display: 'flex', gap: 16, marginTop: 20, justifyContent: 'center' }}>
                {['🔒 Secure', '✅ Verified', '↩️ Returns'].map(b => (
                  <div key={b} style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{b}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}