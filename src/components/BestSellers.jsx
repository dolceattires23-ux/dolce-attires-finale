import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useContent, usePrefersReducedMotion } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { Eyebrow } from './ui/primitives.jsx';
import ProductTile from './ui/ProductTile.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import { ArrowLeft, ArrowRight } from './ui/icons.jsx';

// 3.2 — Best Sellers (ref featured-collection--asket + shop-grid--aime-leon-dore). Horizontal
// product track, prev/next, auto-advance 6s (pause on hover/focus), quick-view. Small catalog
// (5) → loop the track so it reads intentional. GSAP x-transform slides (0.7s power3.inOut).

function tilesPerView() {
  if (typeof window === 'undefined') return 4;
  if (window.matchMedia('(min-width: 1024px)').matches) return 4;
  if (window.matchMedia('(min-width: 640px)').matches) return 2.2;
  return 1.3;
}

export default function BestSellers() {
  const bs = useContent('bestSellers');
  const { products, productsState } = useCatalog();
  const reduced = usePrefersReducedMotion();
  const revealRef = useReveal();

  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(tilesPerView);
  const [quickView, setQuickView] = useState(null);
  const pausedRef = useRef(false);

  // Loop the small catalog to fill the track (intentional, not sparse).
  const base = products.length ? products : [];
  const items = base.length && base.length < 5 ? [...base, ...base] : base;
  const maxIndex = Math.max(0, items.length - Math.ceil(perView));

  useEffect(() => {
    const onResize = () => setPerView(tilesPerView());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const slideTo = useCallback(
    (next) => {
      const track = trackRef.current;
      const vp = viewportRef.current;
      if (!track || !vp || !items.length) return;
      const clamped = Math.max(0, Math.min(next, maxIndex));
      setIndex(clamped);
      const step = vp.offsetWidth / perView;
      const x = -clamped * step;
      if (reduced) gsap.set(track, { x });
      else gsap.to(track, { x, duration: 0.7, ease: 'power3.inOut' });
    },
    [items.length, maxIndex, perView, reduced]
  );

  useEffect(() => {
    // Re-position on perView/items change without animation.
    const track = trackRef.current;
    const vp = viewportRef.current;
    if (track && vp) {
      const step = vp.offsetWidth / perView;
      gsap.set(track, { x: -Math.min(index, maxIndex) * step });
    }
  }, [perView, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance 6s, paused on hover/focus or reduced-motion.
  useEffect(() => {
    if (reduced || items.length <= Math.ceil(perView)) return undefined;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((cur) => {
        const next = cur >= maxIndex ? 0 : cur + 1;
        slideTo(next);
        return next;
      });
    }, 6000);
    return () => window.clearInterval(id);
  }, [reduced, items.length, perView, maxIndex, slideTo]);

  if (productsState === 'error') {
    return (
      <Shell bs={bs} revealRef={revealRef}>
        <p className="text-[15px] text-text-muted" data-reveal>
          {bs?.emptyBody}
        </p>
      </Shell>
    );
  }

  const loading = productsState === 'loading';

  return (
    <Shell bs={bs} revealRef={revealRef} canPage={!loading && items.length > Math.ceil(perView)} index={index} maxIndex={maxIndex} onPrev={() => slideTo(index - 1)} onNext={() => slideTo(index + 1)} prevLabel={bs?.prevLabel} nextLabel={bs?.nextLabel}>
      <div
        ref={viewportRef}
        className="overflow-hidden"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onFocusCapture={() => (pausedRef.current = true)}
        onBlurCapture={() => (pausedRef.current = false)}
      >
        <div ref={trackRef} className="flex" style={{ touchAction: 'pan-y' }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 px-2.5" style={{ width: `${100 / perView}%` }}>
                  <div className="animate-pulse rounded-xl bg-surface" style={{ aspectRatio: '4 / 5' }} />
                  <div className="mt-3 h-4 w-2/3 animate-pulse bg-surface" />
                </div>
              ))
            : items.map((p, i) => (
                <div key={`${p.id}-${i}`} data-reveal className="shrink-0 px-2.5" style={{ width: `${100 / perView}%` }}>
                  <ProductTile product={p} onQuickView={setQuickView} />
                </div>
              ))}
        </div>
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </Shell>
  );
}

function Shell({ bs, revealRef, children, canPage, onPrev, onNext, prevLabel, nextLabel, index, maxIndex }) {
  return (
    <section id="best-sellers" ref={revealRef} className="section-pad scroll-mt-20">
      <div className="container-site">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <Eyebrow>{bs?.eyebrow}</Eyebrow>
            <h2 data-reveal className="mt-3 font-display text-[clamp(32px,5vw,48px)] leading-tight">
              {bs?.heading}
            </h2>
            <p data-reveal className="mt-2 max-w-md text-[15px] text-text-muted">
              {bs?.subhead}
            </p>
          </div>
          {canPage && (
            <div className="hidden shrink-0 gap-2 md:flex" data-reveal>
              <button
                type="button"
                aria-label={prevLabel || 'Previous'}
                onClick={onPrev}
                disabled={index <= 0}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/25 transition-colors hover:border-secondary disabled:opacity-30"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                aria-label={nextLabel || 'Next'}
                onClick={onNext}
                disabled={index >= maxIndex}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/25 transition-colors hover:border-secondary disabled:opacity-30"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="container-site">{children}</div>
    </section>
  );
}
