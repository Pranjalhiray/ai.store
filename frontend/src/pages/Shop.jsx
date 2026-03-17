import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Shop() {
  const { api } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('popular');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All','Shoes','Clothing','Electronics','Sports','Bags','Beauty','Gaming','Health','Books'];

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const cat = searchParams.get('category') || 'All';
    setCategory(cat);
    setSearchQuery(search);
    loadProducts(cat, sort, search);
  }, [searchParams, sort]);

  const loadProducts = async (cat, s, search = '') => {
    setLoading(true);
    let url = `/api/products?page=1&limit=51&sort=${s}`;
    if (cat && cat !== 'All') url += `&category=${encodeURIComponent(cat)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const r = await api(url);
    if (r.success) { setProducts(r.data); setTotal(r.total || r.data.length); }
    setLoading(false);
  };

  const filterByCategory = (cat) => {
    setCategory(cat);
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchParams({});
  };

  return (
    <div className="container" style={{ padding: '32px 0' }}>

      {/* Search Result Banner */}
      {searchQuery && (
        <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>Search results for </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>"{searchQuery}"</span>
            <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 8 }}>— {total} products found</span>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={clearSearch}>✕ Clear</button>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(c => (
          <div key={c} className={`cat-tab ${category === c ? 'active' : ''}`} onClick={() => filterByCategory(c)}>{c}</div>
        ))}
      </div>

      {/* Sort & Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ color: 'var(--text2)', fontSize: 14 }}>
          {!searchQuery && <span>{total} products</span>}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 14 }}
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="discount">Biggest Discount</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner"></div></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try a different search or category</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={clearSearch}>Browse All Products</button>
        </div>
      ) : (
        <div className="products-grid stagger">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}