import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useContent, usePrefersReducedMotion } from '../hooks/useContent.js';
import { useSiteImages } from '../hooks/useSiteImages.js';
import { scrollToAnchor } from '../hooks/useLenis.js';
import { assetUrl } from '../lib/assets.js';

// 3.1 — Home hero. 100svh, full-bleed editorial landscape backplate (desktop) / real portrait (mobile),
// dark scrim for ≥4.5:1 contrast, centered eyebrow → H1 → subhead → dual CTAs. Load reveal
// (y:24→0, stagger 0.12, 0.8s power3.out), Ken-Burns bg (scale 1.08→1.0, transform only).

export default function Hero() {
  const hero = useContent('hero');
  const reduced = usePrefersReducedMotion();
  const { get } = useSiteImages();
  const rootRef = useRef(null);

  useEffect(() => {
    if (reduced || !rootRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.15,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  if (!hero) return null;

  // The curated editorial landscape backplate is the hero. The Wix SiteImages 'hero' slot stays
  // wired as the client's editable CMS override, used when an image is uploaded there.
  const cmsHero = get('hero', 1);
  const desktopSrc = assetUrl(hero.image) || cmsHero;
  const mobileSrc = assetUrl(hero.imageMobile);

  return (
    <section ref={rootRef} className="relative w-full overflow-hidden" style={{ height: '100svh' }} aria-label="Dolce Attires">
      {/* Background media (orientation-correct: editorial landscape on desktop, real portrait on mobile) */}
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopSrc} />
          <img
            src={mobileSrc}
            alt={hero.imageAlt || ''}
            className={`h-full w-full object-cover ${reduced ? '' : 'anim-ken-burns-in'}`}
            width={2752}
            height={1536}
            loading="eager"
          />
        </picture>
        {/* Scrim — guarantees contrast floor over the imagery */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/45 via-secondary/30 to-secondary/55" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center text-white">
        <div className="mx-auto w-full max-w-[760px]">
          <p data-hero className="eyebrow mb-6 text-white/90">
            {hero.eyebrow}
          </p>
          <h1 data-hero className="font-display text-[clamp(34px,7.5vw,80px)] font-light leading-[1.08] tracking-[0.01em]">
            {hero.headline.split('\n').map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p data-hero className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-white/85 md:text-[18px]">
            {hero.subhead}
          </p>
          <div data-hero className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToAnchor('best-sellers')}
              className="da-btn da-btn-primary-invert w-full max-w-[320px] sm:w-auto"
            >
              {hero.primaryCtaLabel}
            </button>
            <Link to={hero.secondaryCtaTo} className="da-btn da-btn-outline-white w-full max-w-[320px] sm:w-auto">
              {hero.secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <button
        type="button"
        onClick={() => scrollToAnchor('best-sellers')}
        aria-label={hero.scrollCue || 'Scroll'}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-white/80"
      >
        <span className={reduced ? '' : 'anim-scroll-cue'}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </section>
  );
}
