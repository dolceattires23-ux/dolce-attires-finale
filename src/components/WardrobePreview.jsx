import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useContent } from '../hooks/useContent.js';
import { useGsap } from '../hooks/useReveal.js';
import { assetUrl } from '../lib/assets.js';

gsap.registerPlugin(ScrollTrigger);

// 3.4 — Wardrobe preview band. Full-bleed dark editorial backplate (walnut/marble/gold), centered
// ivory text, single gold-outline CTA → /wardrobe. Backplate parallax (scrub), text fade-up.
export default function WardrobePreview() {
  const w = useContent('wardrobePreview');
  const bgRef = useRef(null);

  const rootRef = useGsap((self, { reduced }) => {
    if (reduced) return;
    // Parallax: background moves slower than scroll (transform only).
    gsap.fromTo(
      bgRef.current,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      }
    );
    gsap.from('[data-reveal]', {
      opacity: 0,
      y: 24,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: rootRef.current, start: 'top 75%', once: true },
    });
  });

  if (!w) return null;

  return (
    <section ref={rootRef} className="relative flex items-center justify-center overflow-hidden rounded-3xl mx-4 md:mx-8 my-4 bg-walnut-deep" style={{ minHeight: '80vh' }}>
      <div ref={bgRef} className="absolute inset-0 scale-110">
        <img
          src={assetUrl(w.image)}
          alt={w.imageAlt || ''}
          loading="lazy"
          className="h-full w-full object-cover"
          style={{ objectPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-walnut-deep/70 via-walnut-deep/45 to-walnut-deep/80" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-24 text-center text-ivory">
        <p data-reveal className="eyebrow text-gold">
          {w.eyebrow}
        </p>
        <h2 data-reveal className="mt-5 font-display text-[clamp(40px,7vw,72px)] font-light leading-[1.05] tracking-[0.04em]">
          {w.heading}
        </h2>
        <p data-reveal className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-ivory/80">
          {w.body}
        </p>
        <div data-reveal className="mt-9">
          <Link to={w.ctaTo} className="da-btn da-btn-gold">
            {w.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
