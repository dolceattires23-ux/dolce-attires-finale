import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { Eyebrow, productImage, productAspect } from './ui/primitives.jsx';
import Countdown, { nextMidnight } from './ui/Countdown.jsx';
import { formatPrice } from '../lib/assets.js';
import { ArrowRight } from './ui/icons.jsx';

// 3.3 — Deals of the Day. Split: left countdown + headline, right product. No product carries a
// sale price today → render the intentional curated "Today's Edit" state (single full-price
// piece, no fabricated discount). Countdown target = next local midnight.

export default function Deals() {
  const d = useContent('deals');
  const { products } = useCatalog();
  const revealRef = useReveal();
  if (!d) return null;

  // A sale piece would have price < its compare-at; the catalog has none, so curated state.
  const onSale = products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  const curated = onSale.length === 0;
  // Curated pick: the quarter-zip (a signature piece) if present, else first product.
  const piece = onSale[0] || products.find((p) => p.slug === 'quarter-zip-sweatshirt') || products[0];

  return (
    <section ref={revealRef} className="bg-surface rounded-3xl mx-4 md:mx-8 my-4">
      <div className="container-site section-pad">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          {/* Left: copy + countdown */}
          <div>
            <Eyebrow>{curated ? d.curatedEyebrow : d.eyebrow}</Eyebrow>
            <h2 data-reveal className="mt-3 font-display text-[clamp(30px,4.5vw,46px)] leading-tight">
              {curated ? d.curatedHeading : d.heading}
            </h2>
            <p data-reveal className="mt-3 max-w-md text-[15px] leading-relaxed text-text-muted">
              {curated ? d.curatedBody : d.subhead}
            </p>
            <div data-reveal className="mt-8">
              <Countdown targetDate={nextMidnight()} labels={d.timerLabels} />
            </div>
            {piece && (
              <Link to={`/product/${piece.slug}`} className="da-btn da-btn-primary mt-8" data-reveal>
                {curated ? d.curatedCtaLabel : d.ctaLabel}
                <ArrowRight size={15} className="ml-1" />
              </Link>
            )}
          </div>

          {/* Right: product */}
          {piece && (
            <Link to={`/product/${piece.slug}`} data-reveal className="group block">
              <div className="overflow-hidden rounded-2xl bg-background" style={{ aspectRatio: productAspect(piece) }}>
                <img
                  src={productImage(piece)}
                  alt={piece.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="font-display text-[22px]">{piece.name}</p>
                <p className="text-[16px]">
                  {!curated && piece.compareAtPrice && (
                    <span className="mr-2 text-text-muted line-through">{formatPrice(piece.compareAtPrice, piece.currency)}</span>
                  )}
                  {formatPrice(piece.price, piece.currency)}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
