import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { usePrefersReducedMotion } from '../hooks/useContent.js';
import { CloseIcon } from './ui/icons.jsx';
import ProductDetail from './ProductDetail.jsx';

// Quick-view modal — opens the same PDP body in a 0px modal (brief §3.2/§3.15).
export default function QuickViewModal({ product, onClose }) {
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const el = panelRef.current;
    if (el && !reduced) gsap.fromTo(el, { opacity: 0, y: 20, scale: 0.99 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' });
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, reduced]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto p-4 md:items-center" role="dialog" aria-modal="true" aria-label={product.name}>
      <button type="button" aria-label="Close" className="fixed inset-0 bg-secondary/55" onClick={onClose} />
      <div ref={panelRef} className="relative my-6 w-full max-w-4xl rounded-2xl bg-background p-6 shadow-primary md:p-10" data-lenis-prevent>
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 z-10 p-1">
          <CloseIcon size={22} />
        </button>
        <ProductDetail product={product} modal />
      </div>
    </div>
  );
}
