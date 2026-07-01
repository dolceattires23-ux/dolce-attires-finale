import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent, usePrefersReducedMotion } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { Eyebrow, productImage } from './ui/primitives.jsx';
import { assetUrl, formatPrice } from '../lib/assets.js';
import { ArrowRight } from './ui/icons.jsx';

// 3.7 — Signature Looks. Alternating full-width editorial panels (portrait media + styling note),
// interactive hotspots (sanctioned circles) → product mini-card → PDP. Maps hotspots to real
// products by slug. Mobile: mini-card opens as a bottom sheet; hotspots ≥44px tap targets.

// Hotspot → product slug + normalized (0-1) coordinate per look (look index).
const LOOK_HOTSPOTS = [
  [
    { slug: 'striped-pants-unisex', x: 0.52, y: 0.74 },
    { slug: 'essential-linen-shirt-short-sleeve', x: 0.44, y: 0.32 },
  ],
  [
    { slug: 'essential-linen-shirt-short-sleeve', x: 0.5, y: 0.4 },
    { slug: 'linen-pants', x: 0.55, y: 0.78 },
  ],
];

export default function SignatureLooks() {
  const sl = useContent('signatureLooks');
  const { getBySlug } = useCatalog();
  const revealRef = useReveal();
  if (!sl) return null;

  return (
    <section ref={revealRef} className="bg-surface rounded-3xl mx-4 md:mx-8 my-4">
      <div className="container-site section-pad">
        <div className="mb-12 text-center">
          <Eyebrow>{sl.eyebrow}</Eyebrow>
          <h2 data-reveal className="mt-3 font-display text-[clamp(32px,5vw,48px)] leading-tight">
            {sl.heading}
          </h2>
          <p data-reveal className="mx-auto mt-3 max-w-md text-[15px] text-text-muted">
            {sl.subhead}
          </p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {(sl.looks || []).map((look, i) => (
            <LookPanel
              key={look.title}
              look={look}
              index={i}
              hotspots={LOOK_HOTSPOTS[i] || []}
              getBySlug={getBySlug}
              flip={i % 2 === 1}
              hotspotLabel={sl.hotspotLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LookPanel({ look, hotspots, getBySlug, flip, hotspotLabel, index }) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(null); // active hotspot slug

  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${flip ? 'md:[direction:rtl]' : ''}`}>
      {/* Media + hotspots */}
      <div data-reveal className="relative rounded-2xl overflow-hidden md:[direction:ltr]" style={{ aspectRatio: '4 / 5' }}>
        <img
          src={assetUrl(look.image)}
          alt={look.imageAlt || look.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {hotspots.map((h) => {
          const p = getBySlug(h.slug);
          if (!p) return null;
          const isActive = active === h.slug;
          return (
            <div key={h.slug} className="absolute" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
              <button
                type="button"
                aria-label={`${hotspotLabel}: ${p.name}`}
                onClick={() => setActive(isActive ? null : h.slug)}
                className="relative flex h-11 w-11 items-center justify-center"
              >
                <span className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)] ${reduced ? '' : 'anim-hotspot'}`} />
                <span className="absolute h-1.5 w-1.5 rounded-full bg-secondary" />
              </button>

              {/* Desktop mini-card */}
              {isActive && (
                <div className="absolute left-1/2 top-1/2 z-10 hidden w-52 -translate-x-1/2 translate-y-3 rounded-xl bg-background p-3 text-left shadow-primary md:block" style={reduced ? undefined : { animation: 'da-fade-in 0.25s ease' }}>
                  <MiniCard p={p} hotspotLabel={hotspotLabel} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div data-reveal className="md:[direction:ltr]">
        <p className="eyebrow text-text-muted">Look {String(index + 1).padStart(2, '0')}</p>
        <h3 className="mt-3 font-display text-[clamp(26px,3.5vw,38px)] leading-tight">{look.title}</h3>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-muted">{look.note}</p>
        <ul className="mt-6 space-y-2">
          {hotspots.map((h) => {
            const p = getBySlug(h.slug);
            if (!p) return null;
            return (
              <li key={h.slug}>
                <Link to={`/product/${p.slug}`} className="da-bracket-link">
                  <span className="da-bracket-label">{p.name}</span>
                  <span className="ml-2 text-text-muted">{formatPrice(p.price, p.currency)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile bottom sheet */}
      {active && (
        <MobileSheet p={getBySlug(active)} hotspotLabel={hotspotLabel} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function MiniCard({ p, hotspotLabel }) {
  return (
    <Link to={`/product/${p.slug}`} className="flex gap-3">
      <div className="h-16 w-14 shrink-0 overflow-hidden bg-surface">
        <img src={productImage(p)} alt={p.name} className="h-full w-full object-cover" />
      </div>
      <div>
        <p className="text-[13px] leading-tight">{p.name}</p>
        <p className="text-[12px] text-text-muted">{formatPrice(p.price, p.currency)}</p>
        <span className="mt-1 inline-block text-[11px] uppercase tracking-[0.1em] underline">{hotspotLabel}</span>
      </div>
    </Link>
  );
}

function MobileSheet({ p, hotspotLabel, onClose }) {
  if (!p) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] md:hidden" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="fixed inset-0 bg-secondary/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background p-5 shadow-primary" style={{ animation: 'da-fade-in 0.25s ease' }}>
        <MiniCard p={p} hotspotLabel={hotspotLabel} />
      </div>
    </div>
  );
}
