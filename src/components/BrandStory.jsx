import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useContent } from '../hooks/useContent.js';
import { useGsap } from '../hooks/useReveal.js';
import { Eyebrow } from './ui/primitives.jsx';
import { assetUrl } from '../lib/assets.js';
import { ArrowRight } from './ui/icons.jsx';

gsap.registerPlugin(ScrollTrigger);

// 3.5 — Brand Story (SIGNATURE scroll move). Pinned ~60vh while the centered serif statement
// reveals line-by-line (y/opacity, scrubbed). Portrait image beside (desktop) / below (mobile),
// subtle parallax. Reduced-motion: no pin, statement appears at final state.

export default function BrandStory() {
  const bs = useContent('brandStory');
  const imgRef = useRef(null);
  const pinRef = useRef(null);

  const rootRef = useGsap((self, { reduced }) => {
    const lines = self.selector('[data-line]');
    if (reduced) {
      gsap.set(lines, { opacity: 1, y: 0 });
      gsap.set('[data-reveal]', { opacity: 1, y: 0 });
      return;
    }
    // Image parallax.
    gsap.fromTo(
      imgRef.current,
      { yPercent: -6 },
      { yPercent: 6, ease: 'none', scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }
    );
    // Pin the statement column and reveal lines line-by-line, scrubbed.
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop && pinRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'center center',
          end: '+=60%',
          scrub: 0.8,
          pin: pinRef.current,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });
      tl.fromTo(lines, { opacity: 0.12, y: 18 }, { opacity: 1, y: 0, stagger: 0.4, ease: 'none' });
    } else {
      gsap.from(lines, {
        opacity: 0,
        y: 18,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 75%', once: true },
      });
    }
    gsap.from('[data-reveal]', {
      opacity: 0,
      y: 18,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: rootRef.current, start: 'top 70%', once: true },
    });
  });

  if (!bs) return null;
  const lines = (bs.statement || '').split('\n');

  return (
    <section ref={rootRef} className="overflow-hidden bg-background">
      <div className="container-site section-pad">
        <div className="grid items-center gap-12 lg:grid-cols-[5fr_6fr] lg:gap-16">
          {/* Portrait image */}
          <div className="order-2 overflow-hidden rounded-2xl bg-surface lg:order-1" style={{ aspectRatio: '4 / 5' }}>
            <img
              ref={imgRef}
              src={assetUrl(bs.image)}
              alt={bs.imageAlt || ''}
              loading="lazy"
              className="h-full w-full scale-110 object-cover"
            />
          </div>

          {/* Statement (pinned on desktop) */}
          <div ref={pinRef} className="order-1 text-center lg:order-2 lg:text-left">
            <Eyebrow>{bs.eyebrow}</Eyebrow>
            <blockquote className="mt-5 font-display text-[clamp(28px,3.8vw,42px)] font-light leading-[1.25]">
              {lines.map((l, i) => (
                <span key={i} data-line className="block">
                  {l}
                </span>
              ))}
            </blockquote>
            <p data-reveal className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-text-muted lg:mx-0">
              {bs.body}
            </p>
            <Link to={bs.ctaTo} className="da-bracket-link mt-7" data-reveal>
              <span className="da-bracket-label">{bs.ctaLabel}</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
