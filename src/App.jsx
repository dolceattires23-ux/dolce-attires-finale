import { Routes, Route } from 'react-router-dom';
import { useAppLenis } from './hooks/useLenis.js';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import BackToTop from './components/BackToTop.jsx';

import Home from './pages/Home.jsx';
import ShopPage from './pages/ShopPage.jsx';
import WardrobePage from './pages/WardrobePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ProductPage from './pages/ProductPage.jsx';

export default function App() {
  useAppLenis();

  return (
    <CatalogProvider>
      <CartProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/men" element={<ShopPage gender="men" />} />
          <Route path="/women" element={<ShopPage gender="women" />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Footer />
        <CartDrawer />
        <BackToTop />
      </CartProvider>
    </CatalogProvider>
  );
}
