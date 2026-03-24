import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#e8b86d', '#4f9eff', '#3dd68c', '#a78bfa', '#ff5c5c', '#22d3ee', '#f59e0b', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Visualizations() {
  const { api, fmt, user } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    Promise.all([
      api('/api/products?limit=500'),
      api('/api/trending?num=10'),
    ]).then(([p, t]) => {
      if (p.success) setProducts(p.data);
      if (t.success) setTrending(t.data);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="loading-wrap" style={{ minHeight: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  // ── Data Processing ─────────────────────────────────────────────────────────

  // Category distribution
  const categoryData = Object.entries(
    products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Price distribution by category
  const priceByCategory = Object.entries(
    products.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = { total: 0, count: 0 };
      acc[p.category].total += p.price;
      acc[p.category].count++;
      return acc;
    }, {})
  ).map(([name, d]) => ({ name, avg: Math.round(d.total / d.count), count: d.count }))
   .sort((a, b) => b.avg - a.avg);

  // Rating distribution
  const ratingData = [
    { rating: '⭐ 1-2', count: products.filter(p => p.rating < 3).length },
    { rating: '⭐⭐⭐ 3', count: products.filter(p => p.rating >= 3 && p.rating < 3.5).length },
    { rating: '⭐⭐⭐ 3.5', count: products.filter(p => p.rating >= 3.5 && p.rating < 4).length },
    { rating: '⭐⭐⭐⭐ 4', count: products.filter(p => p.rating >= 4 && p.rating < 4.5).length },
    { rating: '⭐⭐⭐⭐⭐ 4.5+', count: products.filter(p => p.rating >= 4.5).length },
  ];

  // Discount analysis
  const discountData = products
    .map(p => ({ name: p.name.substring(0, 15) + '...', discount: Math.round((p.original_price - p.price) / p.original_price * 100), price: p.price, category: p.category }))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8);

  // Brand popularity
  const brandData = Object.entries(
    products.reduce((acc, p) => { acc[p.brand] = (acc[p.brand] || 0) + p.reviews; return acc; }, {})
  ).map(([name, reviews]) => ({ name, reviews }))
   .sort((a, b) => b.reviews - a.reviews)
   .slice(0, 8);

  // Price range buckets
  const priceRanges = [
    { range: 'Under ₹500', count: products.filter(p => p.price < 500).length },
    { range: '₹500-1K', count: products.filter(p => p.price >= 500 && p.price < 1000).length },
    { range: '₹1K-5K', count: products.filter(p => p.price >= 1000 && p.price < 5000).length },
    { range: '₹5K-10K', count: products.filter(p => p.price >= 5000 && p.price < 10000).length },
    { range: '₹10K-50K', count: products.filter(p => p.price >= 10000 && p.price < 50000).length },
    { range: '₹50K+', count: products.filter(p => p.price >= 50000).length },
  ];

  // Trending products radar data
  const trendingRadar = trending.slice(0, 6).map(p => ({
    product: p.name.substring(0, 10),
    rating: p.rating * 20,
    popularity: Math.min(100, p.reviews / 1000),
    value: Math.round((p.original_price - p.price) / p.original_price * 100),
  }));

  // Simulated sales trend (last 7 days)
  const salesTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    sales: Math.round(20 + Math.random() * 40 + (i === 5 || i === 6 ? 20 : 0)),
    revenue: Math.round(50000 + Math.random() * 100000),
    visitors: Math.round(100 + Math.random() * 300),
  }));

  // Stats
  const totalProducts = products.length;
  const totalBrandsCount = new Set(products.map(p => p.brand)).size;
  const avgPrice = Math.round(products.reduce((s, p) => s + p.price, 0) / products.length);
  const avgRating = (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1);
  const totalBrands = new Set(products.map(p => p.brand)).size;
  const avgDiscount = Math.round(products.reduce((s, p) => s + (p.original_price - p.price) / p.original_price * 100, 0) / products.length);

  const sections = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'categories', icon: '📦', label: 'Categories' },
    { id: 'pricing', icon: '💰', label: 'Pricing' },
    { id: 'trends', icon: '🔥', label: 'Trends' },
    { id: 'brands', icon: '⭐', label: 'Brands' },
  ];

  const ChartCard = ({ title, subtitle, children, fullWidth }) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );

  const StatCard = ({ icon, label, value, sub, color }) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--accent)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
          📊 AI Analytics Dashboard
        </h1>
        <p style={{ color: 'var(--text2)' }}>Real-time insights powered by machine learning</p>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{ padding: '9px 18px', borderRadius: 50, border: `1px solid ${activeSection === s.id ? 'var(--accent)' : 'var(--border2)'}`, background: activeSection === s.id ? 'var(--accent-bg)' : 'transparent', color: activeSection === s.id ? 'var(--accent)' : 'var(--text3)', fontSize: 13, fontWeight: activeSection === s.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection === 'overview' && (
        <div className="fade-in">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon="📦" label="Total Products" value={totalProducts} sub={`Across ${new Set(products.map(p => p.category)).size} categories`} />
            <StatCard icon="💰" label="Avg Price" value={'₹' + avgPrice.toLocaleString()} sub="Across all products" color="var(--blue)" />
            <StatCard icon="⭐" label="Avg Rating" value={avgRating + '/5'} sub="Customer satisfaction" color="var(--green)" />
            <StatCard icon="🏷️" label="Avg Discount" value={avgDiscount + '%'} sub="Off original price" color="var(--purple)" />
            <StatCard icon="🏢" label="Total Brands" value={totalBrands} sub="Premium brands" color="#ff5c5c" />
          </div>

          {/* Charts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="📦 Products by Category" subtitle="Distribution across categories">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="💰 Price Distribution" subtitle="How products are priced">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priceRanges} margin={{ bottom: 20 }}>
                  <XAxis dataKey="range" tick={{ fill: 'var(--text3)', fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="⭐ Rating Distribution" subtitle="Product quality breakdown" fullWidth>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ratingData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <YAxis dataKey="rating" type="category" tick={{ fill: 'var(--text3)', fontSize: 11 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="var(--green)" radius={[0, 6, 6, 0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeSection === 'categories' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="📊 Average Price by Category" subtitle="Which categories cost more">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceByCategory} margin={{ bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'K'} />
                  <Tooltip content={<CustomTooltip />} formatter={v => '₹' + v.toLocaleString()} />
                  <Bar dataKey="avg" fill="var(--blue)" radius={[6,6,0,0]} name="Avg Price" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="🏷️ Category Size" subtitle="Number of products per category">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text3)', fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0,6,6,0]} name="Products">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Category cards */}
            <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {categoryData.map((cat, i) => {
                const catProducts = products.filter(p => p.category === cat.name);
                const avgP = Math.round(catProducts.reduce((s, p) => s + p.price, 0) / catProducts.length);
                const avgR = (catProducts.reduce((s, p) => s + p.rating, 0) / catProducts.length).toFixed(1);
                return (
                  <div key={cat.name} onClick={() => navigate('/shop?category=' + cat.name)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s', borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: 11, color: COLORS[i % COLORS.length], fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{cat.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cat.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>products</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>Avg ₹{avgP.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>⭐ {avgR}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pricing */}
      {activeSection === 'pricing' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="🔥 Top Discounted Products" subtitle="Best deals right now" fullWidth>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={discountData} margin={{ bottom: 40 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => v + '%'} />
                  <Tooltip content={<CustomTooltip />} formatter={v => v + '%'} />
                  <Bar dataKey="discount" radius={[6,6,0,0]} name="Discount">
                    {discountData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="💰 Price Range Distribution" subtitle="How products cluster by price">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={priceRanges} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" label={({ name, value }) => value > 0 ? `${name}` : ''}>
                    {priceRanges.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="📈 Value Score" subtitle="Price vs Rating analysis">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priceByCategory}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="var(--purple)" radius={[6,6,0,0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Trends */}
      {activeSection === 'trends' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="📈 Sales Trend (Last 7 Days)" subtitle="Simulated sales activity" fullWidth>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stroke="var(--accent)" fill="url(#salesGrad)" strokeWidth={2} name="Orders" />
                  <Area type="monotone" dataKey="visitors" stroke="var(--blue)" fill="url(#visitorsGrad)" strokeWidth={2} name="Visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="🔥 Trending Products Radar" subtitle="Multi-metric analysis">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={trendingRadar}>
                  <PolarGrid stroke="var(--border2)" />
                  <PolarAngleAxis dataKey="product" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Radar name="Rating" dataKey="rating" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                  <Radar name="Discount" dataKey="value" stroke="var(--green)" fill="var(--green)" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Trending products */}
            <div style={{ gridColumn: '1/-1' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔥 Trending Right Now</h3>
              <div className="products-grid stagger">
                {trending.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brands */}
      {activeSection === 'brands' && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard title="⭐ Most Reviewed Brands" subtitle="Brands with most customer engagement" fullWidth>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={brandData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => (v/1000).toFixed(0) + 'K'} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text3)', fontSize: 11 }} width={100} />
                  <Tooltip content={<CustomTooltip />} formatter={v => v.toLocaleString() + ' reviews'} />
                  <Bar dataKey="reviews" radius={[0,6,6,0]} name="Reviews">
                    {brandData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Brand cards */}
            <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {brandData.map((brand, i) => {
                const brandProds = products.filter(p => p.brand === brand.name);
                const avgR = brandProds.length ? (brandProds.reduce((s, p) => s + p.rating, 0) / brandProds.length).toFixed(1) : '—';
                return (
                  <div key={brand.name} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{brand.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>{brandProds.length} products</div>
                    <div style={{ fontSize: 13, color: '#f5a623' }}>⭐ {avgR} avg rating</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{brand.reviews.toLocaleString()} reviews</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}