import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Shop from './pages/Shop';
import AIFeatures from './pages/AIFeatures';
import AIAdvanced from './pages/AIAdvanced';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

import Wishlist from './pages/Wishlist';

function AppLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} onAuthOpen={() => setAuthOpen(true)} />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/ai" element={<AIFeatures />} />
          <Route path="/ai-advanced" element={<AIAdvanced />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}