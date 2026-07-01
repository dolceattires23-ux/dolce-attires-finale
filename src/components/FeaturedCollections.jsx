import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { Eyebrow } from './ui/primitives.jsx';
import { assetUrl } from '../lib/assets.js';
import { ArrowRight } from './ui/icons.jsx';

// 3.6 — Featured Collections. Asymmetric editorial grid of banner cards (image + serif name on a
// bottom scrim + Explore). Portrait/square → portrait/square frames (no landscape stretch).
// Hover: image scale + scrim deepen + name tracking widen (transform/opacity only).

export default function FeaturedCollections() {
  const fc = useContent('featuredCollections');
  const revealRef = useReveal({ stagger: 0.1 });
  if (!fc) return null;

  const cards = fc.cards || [];

  return (
    <section ref={revealRef} className="section-pad">
      <div className="container-site">
        <div className="mb-10 text-center">
          <Eyebrow>{fc.eyebrow}</Eyebrow>
          <h2 data-reveal className="mt-3 font-display text-[clamp(32px,5vw,48px)] leading-tight">
            {fc.heading}
          </h2>
        </div>

        {/* 12-col asymmetric grid: lead card spans 2 rows, the rest stack. */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {cards.map((card, i) => (
            <Link
              key={card.title}
              to={card.to}
              data-reveal
              className={`group relative block overflow-hidden rounded-2xl ${
                i === 0 ? 'md:col-span-6 md:row-span-2' : 'md:col-span-6'
              }`}
              style={{ aspectRatio: i === 0 ? '4 / 5' : '16 / 10' }}
            >
              <img
                src={assetUrl(card.image)}
                alt={card.imageAlt || card.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                style={{ objectPosition: i === 0 ? 'center' : 'center 30%' }}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-secondary/70 via-secondary/10 to-transparent transition-opacity duration-500 group-hover:from-secondary/80" />
              <span className="absolute bottom-6 left-6 right-6 text-white">
                <span className="eyebrow block text-white/80">{card.subtitle}</span>
                <span className="mt-1 block font-display text-[clamp(24px,3vw,34px)] leading-tight transition-[letter-spacing] duration-500 group-hover:tracking-[0.03em]">
                  {card.title}
                </span>
                <span className="da-bracket-link mt-3 text-white">
                  <span className="da-bracket-label">{fc.cardCtaLabel}</span>
                  <ArrowRight size={13} className="ml-1.5" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
