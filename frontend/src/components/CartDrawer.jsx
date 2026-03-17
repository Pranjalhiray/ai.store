import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ open, onClose }) {
  const { cart, removeFromCart, fmt, cartTotal, user } = useApp();
  const navigate = useNavigate();

  return (
    <>
      {open && <div className="overlay active" onClick={onClose} />}
      <div className={`drawer ${open ? 'active' : ''}`}>
        <div className="drawer-header">
          <h3>Your Cart 🛒</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some products to get started</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { navigate('/shop'); onClose(); }}>
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <img
                  className="cart-item-img"
                  src={item.image}
                  alt={item.name}
                  onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200'}
                />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{fmt(item.price)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Qty: {item.quantity}</div>
                </div>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="order-row total" style={{ marginBottom: 16 }}>
              <span>Total</span>
              <span>{fmt(cartTotal)}</span>
            </div>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => { navigate('/checkout'); onClose(); }}
            >
              Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}