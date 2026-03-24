import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist, fmt, user, toast } = useApp();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const animRef = useRef(null);

  const disc = product.original_price > product.price
    ? Math.round((product.original_price - product.price) / product.original_price * 100)
    : 0;
  const isWished = wishlist.includes(product.id);
  const stars = (r) => '⭐'.repeat(Math.round(r));

  /* ── 3D tilt on mouse move ── */
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    animRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);   // –1 → 1
      const dy = (e.clientY - cy) / (rect.height / 2);   // –1 → 1
      const tiltX =  dy * -10;   // pitch
      const tiltY =  dx *  10;   // yaw
      const lift  = 'translateZ(28px) translateY(-6px)';
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) ${lift}`;
      card.style.transition = 'transform 0.08s linear, border-color 0.22s ease, box-shadow 0.22s ease';

      // Move the shine layer
      const shine = card.querySelector('.card-shine');
      if (shine) {
        const sx = 50 + dx * 30;
        const sy = 50 + dy * 30;
        shine.style.background = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.10) 0%, transparent 60%)`;
        shine.style.opacity = '1';
      }
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0) translateY(0)';
    card.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1), border-color 0.22s ease, box-shadow 0.22s ease';
    const shine = card.querySelector('.card-shine');
    if (shine) shine.style.opacity = '0';
  };

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
    <div
      ref={cardRef}
      className="product-card card-hover"
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {/* Shine layer — moves with cursor */}
      <div
        className="card-shine"
        style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius)',
          pointerEvents: 'none', zIndex: 6, opacity: 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      <div className="card-img-wrap">
        <img
          className="card-img"
          src={product.images?.[0] || ''}
          alt={product.name}
          loading="lazy"
          onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600'}
        />
        {disc > 0 && (
          <div className="card-badge">
            <span className="badge badge-red">-{disc}%</span>
          </div>
        )}
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
              <span className="card-discount">↓{disc}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}