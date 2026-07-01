import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { usePrefersReducedMotion, useContent } from '../hooks/useContent.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { CloseIcon, SearchIcon } from './ui/icons.jsx';
import { productImage } from './ui/primitives.jsx';
import { formatPrice } from '../lib/assets.js';

// Full-screen search overlay — filters the live catalog by name; results link to the PDP.
export default function SearchOverlay({ open, onClose }) {
  const { products } = useCatalog();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const nav = useContent('nav');
  const [q, setQ] = useState('');
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const el = panelRef.current;
    if (el && !reduced) gsap.fromTo(el, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, reduced]);

  if (!open) return null;

  const term = q.trim().toLowerCase();
  const results = term
    ? products.filter((p) => `${p.name} ${(p.subcategories || []).join(' ')}`.toLowerCase().includes(term))
    : products;

  const go = (slug) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background" role="dialog" aria-modal="true" aria-label={nav?.searchLabel || 'Search'}>
      <div ref={panelRef} className="container-site flex h-full flex-col pt-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-text-muted">{nav?.searchLabel || 'Search'}</span>
          <button type="button" aria-label={nav?.closeLabel || 'Close'} onClick={onClose} className="p-1">
            <CloseIcon size={24} />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3 border-b border-secondary pb-3">
          <SearchIcon size={22} className="text-text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the collection"
            className="w-full bg-transparent font-display text-[28px] outline-none placeholder:text-text-muted/60 md:text-[40px]"
          />
        </div>

        <div className="mt-8 flex-1 overflow-y-auto pb-12" data-lenis-prevent>
          <p className="eyebrow mb-5 text-text-muted">
            {results.length} {results.length === 1 ? 'piece' : 'pieces'}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <button key={p.id} type="button" onClick={() => go(p.slug)} className="group text-left">
                <div className="mb-3 overflow-hidden bg-surface" style={{ aspectRatio: '4 / 5' }}>
                  <img
                    src={productImage(p)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="text-[14px]">{p.name}</p>
                <p className="text-[13px] text-text-muted">{formatPrice(p.price, p.currency)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
