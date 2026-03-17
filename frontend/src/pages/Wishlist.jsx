import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { api, user, wishlist, toggleWishlist } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api('/api/wishlist').then(r => {
      if (r.success) setProducts(r.data);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;

  if (loading) return (
    <div className="loading-wrap" style={{ minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>My Wishlist</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>{products.length} saved item{products.length !== 1 ? 's' : ''}</p>
        </div>
        {products.length > 0 && (
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>Continue Shopping →</button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Save products you love by clicking the heart icon</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/shop')}>Start Shopping</button>
        </div>
      ) : (
        <div className="products-grid stagger">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}