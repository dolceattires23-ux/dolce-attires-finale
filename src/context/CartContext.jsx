import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ensureVisitorSession } from '@backend/wix-client.js';
import { getCart } from '@backend/queries.js';
import { addToCart, updateCartLineQuantity, removeCartLine, getCheckoutUrl } from '@backend/mutations.js';

const CartContext = createContext(null);

const EMPTY = { id: null, lines: [], itemCount: 0, subtotal: 0, currency: 'MUR' };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Establish/restore the visitor session, then load their Wix cart. An absent cart is normal.
  useEffect(() => {
    let alive = true;
    ensureVisitorSession()
      .then(() => getCart())
      .then((c) => { if (alive) setCart(c); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const addItem = useCallback(async ({ product, options = {}, quantity = 1 }) => {
    setAdding(true);
    setError(null);
    try {
      await ensureVisitorSession();
      const c = await addToCart({ productId: product.id, options, quantity });
      setCart(c);
      setDrawerOpen(true);
      return { ok: true };
    } catch (err) {
      setError(err.message || 'Could not add to cart.');
      return { ok: false, error: err.message };
    } finally {
      setAdding(false);
    }
  }, []);

  const updateQuantity = useCallback(async (lineId, quantity) => {
    setError(null);
    try {
      const c = quantity <= 0 ? await removeCartLine(lineId) : await updateCartLineQuantity(lineId, quantity);
      setCart(c);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeItem = useCallback(async (lineId) => {
    setError(null);
    try {
      const c = await removeCartLine(lineId);
      setCart(c);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setError(null);
    try {
      const ids = (cart.lines || []).map((l) => l.id).filter(Boolean);
      if (!ids.length) { setCart(EMPTY); return; }
      const c = await removeCartLine(ids);
      setCart(c);
    } catch (err) {
      setError(err.message);
    }
  }, [cart]);

  // Create a Wix-hosted checkout from the current cart and return the redirect URL.
  const checkout = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { checkoutUrl } = await getCheckoutUrl({ postFlowUrl: origin });
    return checkoutUrl;
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      adding,
      error,
      drawerOpen,
      setDrawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      checkout,
    }),
    [cart, loading, adding, error, drawerOpen, addItem, updateQuantity, removeItem, clearCart, checkout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
