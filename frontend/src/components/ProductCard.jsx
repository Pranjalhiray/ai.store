import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist, fmt, user, toast } = useApp();
  const navigate = useNavigate();
  const disc = product.original_price > product.price
    ? Math.round((product.original_price - product.price) / product.original_price * 100)
    : 0;
  const isWished = wishlist.includes(product.id);
  const stars = (r) => '⭐'.repeat(Math.round(r));

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user) { toast('Please login to add to wishlist', 'error'); return; }
    toggleWishlist(product.id);
  };

  const handleCart = (e) => {
    e.stopPropagation();
    if (!user) { toast('Please login to add to cart', 'error'); return; }
    addToCart(product.id);
  };

  return (
    <div className="product-card card-hover" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="card-img-wrap">
        <img
          className="card-img"
          src={product.images?.[0] || ''}
          alt={product.name}
          loading="lazy"
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600'}
        />
        {disc > 0 && <div className="card-badge"><span className="badge badge-red">-{disc}%</span></div>}
        <div className={`card-wish ${isWished ? 'active' : ''}`} onClick={handleWishlist}>
          {isWished ? '❤️' : '🤍'}
        </div>
        <div className="card-overlay">
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCart}>
            Add to Cart
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="card-cat">{product.category}</div>
        <div className="card-name" title={product.name}>{product.name}</div>
        <div className="card-brand">{product.brand}</div>
        <div className="card-rating">
          <span className="stars" style={{ fontSize: 12 }}>{stars(product.rating)}</span>
          <span className="rating-count">({Number(product.reviews || 0).toLocaleString()})</span>
        </div>
        <div className="card-price-row">
          <span className="card-price">{fmt(product.price)}</span>
          {product.original_price > product.price && (
            <>
              <span className="card-original">{fmt(product.original_price)}</span>
              <span className="card-discount">Save {disc}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}