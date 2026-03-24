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
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [allBrands, setAllBrands] = useState([]);

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
    if (r.success) {
      setProducts(r.data);
      setTotal(r.total || r.data.length);
      if (r.brands) setAllBrands(r.brands.slice(0, 20));
    }
    setLoading(false);
  };

  const filterByCategory = (cat) => {
    setCategory(cat);
    setSelectedBrands([]);
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchParams({});
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setMinRating(0);
  };

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Apply filters client-side
  const filteredProducts = products.filter(p => {
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
    if (p.rating < minRating) return false;
    return true;
  });

  const activeFiltersCount = selectedBrands.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0);

  return (
    <div className="container" style={{ padding: '32px 0' }}>

      {/* Search Result Banner */}
      {searchQuery && (
        <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>Search results for </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>"{searchQuery}"</span>
            <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 8 }}>— {filteredProducts.length} products found</span>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={clearSearch}>✕ Clear</button>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {categories.map(c => (
          <div key={c} className={`cat-tab ${category === c ? 'active' : ''}`} onClick={() => filterByCategory(c)}>{c}</div>
        ))}
      </div>

      {/* Sort & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--text2)', fontSize: 14 }}>{filteredProducts.length} products</span>
          {activeFiltersCount > 0 && (
            <span style={{ background: 'var(--accent)', color: '#000', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>{activeFiltersCount} filters</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🎛️ Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </button>
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
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>

          {/* Price Range */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>💰 Price Range</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span>₹{priceRange[0].toLocaleString()}</span>
              <span>₹{priceRange[1].toLocaleString()}</span>
            </div>
            <input type="range" min={0} max={100000} step={500} value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              style={{ width: '100%', marginBottom: 8 }} />
            <input type="range" min={0} max={100000} step={500} value={priceRange[0]}
              onChange={e => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[[0,1000],[1000,5000],[5000,20000],[20000,100000]].map(([min,max]) => (
                <div key={min} onClick={() => setPriceRange([min, max])}
                  style={{ padding: '4px 10px', borderRadius: 50, fontSize: 11, cursor: 'pointer', background: priceRange[0] === min && priceRange[1] === max ? 'var(--accent)' : 'var(--bg3)', color: priceRange[0] === min && priceRange[1] === max ? '#000' : 'var(--text3)', border: '1px solid var(--border2)', fontWeight: 600 }}>
                  ₹{min/1000 > 0 ? min/1000+'K' : '0'}-{max/1000}K
                </div>
              ))}
            </div>
          </div>

          {/* Min Rating */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>⭐ Minimum Rating</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 3, 3.5, 4, 4.5].map(r => (
                <div key={r} onClick={() => setMinRating(r)}
                  style={{ padding: '6px 14px', borderRadius: 50, fontSize: 13, cursor: 'pointer', background: minRating === r ? 'var(--accent)' : 'var(--bg3)', color: minRating === r ? '#000' : 'var(--text2)', border: `1px solid ${minRating === r ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 600 }}>
                  {r === 0 ? 'All' : `${r}+`}
                </div>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>🏢 Brands</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {allBrands.map(brand => (
                <div key={brand} onClick={() => toggleBrand(brand)}
                  style={{ padding: '6px 14px', borderRadius: 50, fontSize: 12, cursor: 'pointer', background: selectedBrands.includes(brand) ? 'var(--accent)' : 'var(--bg3)', color: selectedBrands.includes(brand) ? '#000' : 'var(--text2)', border: `1px solid ${selectedBrands.includes(brand) ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: selectedBrands.includes(brand) ? 700 : 500, transition: 'all 0.2s' }}>
                  {brand}
                </div>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setPriceRange([0,100000]); setSelectedBrands([]); setMinRating(0); }}>
                ✕ Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-wrap"><div className="spinner"></div></div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={clearSearch}>Clear All</button>
        </div>
      ) : (
        <div className="products-grid stagger">
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}