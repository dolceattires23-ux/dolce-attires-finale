import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import WardrobeStage from '../components/wardrobe/WardrobeStage.jsx';
import { buildScenes } from '../components/wardrobe/scenes.js';
import { productImage } from '../components/ui/primitives.jsx';
import { formatPrice } from '../lib/assets.js';

// 3.16 — THE WARDROBE (SIGNATURE). Dark walnut/marble/gold immersive walk-in. Every spatial
// element renders through <WardrobeStage> (2D today, 3D-swappable). Doors-part entrance, Men's +
// Women's wings, hotspots → product mini-cards (real catalog), per-wing CTAs → /men /women.

export default function WardrobePage() {
  const wardrobe = useContent('wardrobe');
  const { getBySlug, products } = useCatalog();

  const scenes = useMemo(() => (wardrobe ? buildScenes(wardrobe) : []), [wardrobe]);

  const catalogProducts = useMemo(
    () => products.map((p) => ({ slug: p.slug, name: p.name, image: productImage(p), price: p.price, currency: p.currency })),
    [products]
  );

  if (!wardrobe) return null;

  // Host-rendered product mini-card / spotlight on the dark stage (real product photos composited).
  const renderHotspotCard = (node, scene, mode) => {
    const p = getBySlug(node.slug);
    if (!p) return null;

    if (mode === 'spotlight') {
      return (
        <div className="flex items-center gap-4 border border-gold/30 bg-walnut/60 p-3 backdrop-blur-sm">
          <div className="h-24 w-20 shrink-0 overflow-hidden bg-walnut-deep">
            <img src={productImage(p)} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-gold-soft">{node.label}</p>
            <p className="mt-1 font-display text-[20px] leading-tight text-ivory">{p.name}</p>
            <p className="text-[13px] text-ivory/70">{formatPrice(p.price, p.currency)}</p>
            <Link to={`/product/${p.slug}`} className="mt-2 inline-block text-[12px] uppercase tracking-[0.1em] text-gold underline">
              {wardrobe.shopTheLookLabel}
            </Link>
          </div>
        </div>
      );
    }

    // Hotspot mini-card
    return (
      <Link to={`/product/${p.slug}`} className="flex gap-3 border border-gold/25 bg-walnut/90 p-3 shadow-dark backdrop-blur-sm">
        <div className="h-16 w-14 shrink-0 overflow-hidden bg-walnut-deep">
          <img src={productImage(p)} alt={p.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-[13px] leading-tight text-ivory">{p.name}</p>
          <p className="text-[12px] text-ivory/70">{formatPrice(p.price, p.currency)}</p>
          <span className="mt-1 inline-block text-[11px] uppercase tracking-[0.1em] text-gold underline">
            {wardrobe.shopTheLookLabel}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <main className="bg-walnut-deep">
      <WardrobeStage
        renderer="3d"
        scenes={scenes}
        catalogProducts={catalogProducts}
        renderHotspotCard={renderHotspotCard}
        onEnterScene={() => {}}
        onHotspotActivate={() => {}}
      />

      {/* Per-wing CTAs band */}
      <section className="bg-walnut text-ivory">
        <div className="container-site py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {(wardrobe.wings || []).map((wing) => (
              <div key={wing.id} className="border border-gold/20 p-8 text-center">
                <p className="eyebrow text-gold">{wing.eyebrow}</p>
                <h3 className="mt-3 font-display text-[28px] text-ivory">{wing.title}</h3>
                <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ivory/70">{wing.note}</p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link to={wing.to} className="da-btn da-btn-gold-fill w-full max-w-[260px] sm:w-auto">
                    {wardrobe.shopTheLookLabel}
                  </Link>
                  <Link to={wing.to} className="da-btn da-btn-gold w-full max-w-[260px] sm:w-auto">
                    {wardrobe.exploreLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-[12px] uppercase tracking-[0.14em] text-ivory/40">
            {wardrobe.futureNote}
          </p>
        </div>
      </section>
    </main>
  );
}
