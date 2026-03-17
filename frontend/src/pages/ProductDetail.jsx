import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { api, fmt, addToCart, toggleWishlist, wishlist, toast } = useApp();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const numSizes = ['6', '7', '8', '9', '10', '11', '12'];
  const colors = ['#1a1a2e', '#e8b86d', '#4f9eff', '#3dd68c', '#ff5c5c', '#a78bfa'];

  // Smart category detection
  const CLOTHING_CATS = ['Clothing'];
  const SHOES_CATS = ['Shoes'];
  const SPORTS_CATS = ['Sports'];
  const BAG_CATS = ['Bags'];
  const NO_SIZE_NO_COLOR = ['Electronics', 'Books', 'Home', 'Health', 'Gaming', 'Beauty'];

  const getProductOptions = (cat) => {
    if (CLOTHING_CATS.includes(cat)) return { showSizes: true, showColors: true, sizeType: 'clothing' };
    if (SHOES_CATS.includes(cat)) return { showSizes: true, showColors: true, sizeType: 'shoes' };
    if (SPORTS_CATS.includes(cat)) return { showSizes: true, showColors: true, sizeType: 'shoes' };
    if (BAG_CATS.includes(cat)) return { showSizes: false, showColors: true, sizeType: null };
    if (NO_SIZE_NO_COLOR.includes(cat)) return { showSizes: false, showColors: false, sizeType: null };
    return { showSizes: false, showColors: false, sizeType: null };
  };

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    api(`/api/products/${id}`).then(prod => {
      if (prod.success) {
        setProduct(prod.data);
        api('/api/track', { method: 'POST', body: JSON.stringify({ product_id: parseInt(id), event: 'view' }) });
        api(`/api/products/${id}/reviews`).then(rev => { if (rev.success) setReviews(rev.data); });
        api(`/api/recommendations/${id}?num=4`).then(rec => { if (rec.success) setRelated(rec.data); });
      } else {
        navigate('/shop');
      }
      setLoading(false);
    }).catch(() => { setLoading(false); navigate('/shop'); });
  }, [id]);

  const handleAddToCart = async () => {
    const r = await addToCart(product.id, quantity);
    if (r.success) {
      api('/api/track', { method: 'POST', body: JSON.stringify({ product_id: product.id, event: 'cart' }) });
    }
  };

  const submitReview = async () => {
    if (!reviewForm.body) { toast('Please write a review', 'error'); return; }
    setSubmittingReview(true);
    const r = await api(`/api/products/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewForm),
    });
    setSubmittingReview(false);
    if (r.success) {
      setReviews(prev => [r.data, ...prev]);
      setReviewForm({ rating: 5, title: '', body: '' });
      toast('Review submitted! ⭐');
    } else {
      toast(r.error || 'Login to review', 'error');
    }
  };

  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

  if (loading) {
    return (
      <div className="loading-wrap" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text2)' }}>Loading product...</p>
      </div>
    );
  }

  if (!product) return null;

  const disc = Math.round((product.original_price - product.price) / product.original_price * 100);
  const isWished = wishlist.includes(product.id);
  const { showSizes, showColors, sizeType } = getProductOptions(product.category);

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text3)' }}>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/')}>Home</span>
            <span>›</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/shop')}>Shop</span>
            <span>›</span>
            <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/shop?category=' + product.category)}>{product.category}</span>
            <span>›</span>
            <span style={{ color: 'var(--text2)' }}>{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px' }}>
        {/* Main Layout */}
        <div className="detail-layout">
          {/* Left - Images */}
          <div>
            <div style={{ position: 'relative' }}>
              <img
                src={product.images?.[activeImg] || product.images?.[0] || ''}
                alt={product.name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--radius)', background: 'var(--bg3)' }}
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600'}
              />
              {disc > 0 && (
                <div style={{ position: 'absolute', top: 16, left: 16, background: '#ff5c5c', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  -{disc}% OFF
                </div>
              )}
              <div
                onClick={() => toggleWishlist(product.id)}
                style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(8,11,18,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 }}
              >
                {isWished ? '❤️' : '🤍'}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={product.name + ' ' + (i + 1)}
                    onClick={() => setActiveImg(i)}
                    onError={e => e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200'}
                    style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover', cursor: 'pointer', border: activeImg === i ? '2px solid var(--accent)' : '2px solid transparent', background: 'var(--bg3)' }}
                  />
                ))}
              </div>
            )}

            {/* Specs */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginTop: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Specifications</h4>
              {[
                { label: 'Brand', value: product.brand },
                { label: 'Category', value: product.category },
                { label: 'Rating', value: product.rating + '/5' },
                { label: 'Reviews', value: Number(product.reviews || 0).toLocaleString() },
                { label: 'Original Price', value: fmt(product.original_price) },
                { label: 'You Save', value: fmt(product.original_price - product.price) + ' (' + disc + '%)' },
                { label: 'In Stock', value: 'Yes ✓' },
                { label: 'Warranty', value: '1 Year' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text3)' }}>{s.label}</span>
                  <span style={{ fontWeight: 500 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Info */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {product.brand} · {product.category}
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ color: '#f5a623', fontSize: 16 }}>{stars(product.rating)}</span>
              <span style={{ fontWeight: 700 }}>{product.rating}</span>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>({Number(product.reviews || 0).toLocaleString()} reviews)</span>
              <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>✓ In Stock</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>{fmt(product.price)}</span>
              {product.original_price > product.price && (
                <span style={{ fontSize: 20, color: 'var(--text3)', textDecoration: 'line-through' }}>{fmt(product.original_price)}</span>
              )}
              {disc > 0 && (
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, background: 'rgba(61,214,140,0.1)', padding: '4px 10px', borderRadius: 6 }}>
                  Save {fmt(product.original_price - product.price)}
                </span>
              )}
            </div>

            {/* Colors */}
            {showColors && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>Color</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {colors.map(c => (
                  <div
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: selectedColor === c ? '3px solid var(--accent)' : '3px solid transparent', outline: '2px solid var(--border2)', transition: 'all 0.2s' }}
                  />
                ))}
              </div>
            </div>
            )}

            {/* Sizes */}
            {showSizes && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                  Size {selectedSize && '— ' + selectedSize}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>Size Guide →</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(sizeType === 'shoes' ? numSizes : sizes).map(s => (
                  <button
                    key={s}
                    className={'size-btn' + (selectedSize === s ? ' active' : '')}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>Quantity</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 44, height: 44, background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, cursor: 'pointer' }}>−</button>
                <span style={{ width: 48, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(10, q + 1))} style={{ width: 44, height: 44, background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>🛒 Add to Cart</button>
              <button className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>⚡ Buy Now</button>
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginBottom: 24 }} onClick={() => toggleWishlist(product.id)}>
              {isWished ? '❤️ Remove from Wishlist' : '🤍 Add to Wishlist'}
            </button>

            {/* Delivery Info */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              {[
                { icon: '🚚', title: 'Free Delivery', sub: 'On orders above ₹999' },
                { icon: '↩️', title: 'Easy Returns', sub: '7-day hassle free returns' },
                { icon: '🔒', title: 'Secure Payment', sub: 'UPI, Cards, Net Banking, COD' },
                { icon: '✅', title: 'Genuine Product', sub: '100% authentic guarantee' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 60 }}>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
            {[
              { id: 'description', label: '📝 Description' },
              { id: 'specs', label: '📋 Specifications' },
              { id: 'reviews', label: '⭐ Reviews (' + reviews.length + ')' },
              { id: 'write', label: '✏️ Write Review' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text3)', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 14, cursor: 'pointer', marginBottom: -1 }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div style={{ maxWidth: 720 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>About {product.name}</h3>
              <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: 15, marginBottom: 24 }}>
                Experience the finest quality with the {product.name} from {product.brand}. This premium {product.category.toLowerCase()} product is crafted with attention to detail and built to last. Perfect for everyday use, it combines style with functionality to give you the best value for your money.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { icon: '🏆', title: 'Premium Quality', desc: 'Top-rated ' + product.category },
                  { icon: '⚡', title: 'Fast Delivery', desc: 'Delivered in 2-5 business days' },
                  { icon: '💎', title: 'Authentic', desc: '100% genuine product' },
                  { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
                ].map(f => (
                  <div key={f.title} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
              {product.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.tags.map(t => (
                    <span key={t} style={{ padding: '5px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 50, fontSize: 12, color: 'var(--text2)' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {[
                  { label: 'Product Name', value: product.name },
                  { label: 'Brand', value: product.brand },
                  { label: 'Category', value: product.category },
                  { label: 'Price', value: fmt(product.price) },
                  { label: 'Discount', value: disc + '%' },
                  { label: 'Rating', value: product.rating + ' / 5.0' },
                  { label: 'Total Reviews', value: Number(product.reviews || 0).toLocaleString() },
                  { label: 'Available Sizes', value: showSizes ? (sizeType === 'shoes' ? numSizes : sizes).join(', ') : 'N/A' },
                  { label: 'Tags', value: (product.tags || []).join(', ') },
                  { label: 'In Stock', value: 'Yes' },
                  { label: 'Return Policy', value: '7 days' },
                  { label: 'Warranty', value: '1 year' },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: 'flex', padding: '12px 20px', background: i % 2 === 0 ? 'transparent' : 'var(--bg3)', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <div style={{ width: '40%', color: 'var(--text3)' }}>{row.label}</div>
                    <div style={{ width: '60%', fontWeight: 600 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 22, fontWeight: 700 }}>Customer Reviews</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('write')}>Write a Review ✏️</button>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, marginBottom: 32, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{product.rating}</div>
                  <div style={{ color: '#f5a623', fontSize: 20, margin: '8px 0' }}>{stars(product.rating)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{Number(product.reviews || 0).toLocaleString()} reviews</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  {[5, 4, 3, 2, 1].map(n => {
                    const pct = n === 5 ? 65 : n === 4 ? 20 : n === 3 ? 8 : n === 2 ? 4 : 3;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', width: 12 }}>{n}</span>
                        <span style={{ color: '#f5a623', fontSize: 12 }}>★</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: 'var(--accent)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text3)', width: 30 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {reviews.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>No reviews yet</h3>
                  <p>Be the first to review!</p>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('write')}>Write Review</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={r.avatar} alt={r.user} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.src = 'https://ui-avatars.com/api/?name=' + r.user} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.user}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.date}</div>
                          </div>
                        </div>
                        <div style={{ color: '#f5a623', fontSize: 14 }}>{stars(r.rating)}</div>
                      </div>
                      {r.title && <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.title}</div>}
                      <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>{r.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'write' && (
            <div style={{ maxWidth: 600 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Write a Review</h3>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28 }}>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Your Rating</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: n <= reviewForm.rating ? '#f5a623' : 'var(--bg4)' }}>★</button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Review Title</label>
                  <input placeholder="Summarize your experience" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label>Your Review</label>
                  <textarea placeholder="What did you like or dislike?" value={reviewForm.body} onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))} style={{ minHeight: 120, resize: 'vertical' }} />
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submitReview} disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : '⭐ Submit Review'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: 80 }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">You May Also Like</h2>
                <div className="section-sub">AI recommended based on this product</div>
              </div>
            </div>
            <div className="products-grid stagger">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}