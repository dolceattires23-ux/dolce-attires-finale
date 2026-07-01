import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useContent, usePrefersReducedMotion } from '../hooks/useContent.js';
import { useCart } from '../context/CartContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { CloseIcon } from './ui/icons.jsx';
import { productImage } from './ui/primitives.jsx';
import { formatPrice } from '../lib/assets.js';

export default function CartDrawer() {
  const c = useContent('cart');
  const { cart, drawerOpen, setDrawerOpen, removeItem } = useCart();
  const { products } = useCatalog();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    const el = panelRef.current;
    if (el && !reduced) gsap.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.35, ease: 'power3.out' });
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, reduced, setDrawerOpen]);

  if (!drawerOpen) return null;

  const items = cart.lines || [];
  const empty = items.length === 0;
  const recs = products.slice(0, 2);

  const go = (to) => {
    setDrawerOpen(false);
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label={c?.heading || 'Your Bag'}>
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-secondary/40"
        onClick={() => setDrawerOpen(false)}
        style={reduced ? undefined : { animation: 'da-fade-in 0.3s ease' }}
      />
      <div
        ref={panelRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col rounded-l-2xl bg-background"
        data-lenis-prevent
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <span className="eyebrow text-text-muted">
            {empty ? c?.heading : `${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'}`}
          </span>
          <button type="button" aria-label="Close" onClick={() => setDrawerOpen(false)} className="p-1">
            <CloseIcon size={22} />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <h3 className="font-display text-[28px]">{c?.emptyTitle}</h3>
            <p className="mt-3 max-w-xs text-[15px] text-text-muted">{c?.emptyBody}</p>
            <button type="button" onClick={() => go('/men')} className="da-btn da-btn-primary mt-7 w-full">
              {c?.emptyCtaLabel}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              <ul className="divide-y divide-hairline">
                {items.map((it) => {
                  const product = products.find((p) => p.id === it.productId || p.slug === it.productSlug);
                  const img = it.image || (product ? productImage(product) : '');
                  return (
                    <li key={it.id || it.key} className="flex gap-4 py-5">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {img && <img src={img} alt={it.productName} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-[14px] leading-snug">{it.productName}</p>
                            {it.isPreorder && (
                              <span className="text-[10px] uppercase tracking-[0.1em] text-accent">Pre-Order</span>
                            )}
                          </div>
                          <p className="text-[14px]">{formatPrice(it.price * it.quantity, it.currency)}</p>
                        </div>
                        {(it.color || it.size) && (
                          <p className="mt-1 text-[12px] text-text-muted">
                            {[it.color, it.size].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between">
                          <p className="text-[12px] text-text-muted">Qty: {it.quantity}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            className="text-[11px] uppercase tracking-[0.1em] text-text-muted hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {recs.length > 0 && (
                <div className="border-t border-hairline py-6">
                  <p className="eyebrow mb-4 text-text-muted">{c?.recommendationsHeading}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {recs.map((p) => (
                      <button key={p.id} type="button" onClick={() => go(`/product/${p.slug}`)} className="group text-left">
                        <div className="mb-2 overflow-hidden rounded-lg bg-surface" style={{ aspectRatio: '4 / 5' }}>
                          <img src={productImage(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        </div>
                        <p className="text-[12px] leading-tight">{p.name}</p>
                        <p className="text-[12px] text-text-muted">{formatPrice(p.price, p.currency)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-hairline px-6 py-5">
              <div className="mb-1 flex justify-between text-[14px]">
                <span>{c?.subtotalLabel}</span>
                <span>{formatPrice(cart.subtotal, cart.currency)}</span>
              </div>
              <p className="mb-4 text-[12px] text-text-muted">{c?.shippingLabel}: {c?.shippingValue}</p>
              <button type="button" onClick={() => go('/cart')} className="da-btn da-btn-primary w-full">
                View Bag
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
