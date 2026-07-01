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

// 3.9 — Lookbook (SIGNATURE horizontal-scroll move). Desktop/tablet: section pins, vertical scroll
// drives horizontal x-translate of the track (scrub, pin length ≈ track width). Mobile + reduced:
// simple vertical stack (no pin — avoids touch jank). Frames: portrait images + caption + pull-quote.

export default function Lookbook() {
  const lb = useContent('lookbook');
  const trackRef = useRef(null);

  const rootRef = useGsap((self, { reduced }) => {
    const track = trackRef.current;
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (reduced || !isDesktop || !track) {
      gsap.set('[data-reveal]', { opacity: 1, y: 0 });
      if (!reduced) {
        gsap.from('[data-frame]', {
          opacity: 0,
          y: 24,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
        });
      }
      return;
    }
    // Horizontal pin: translate the track left by (scrollWidth - viewport).
    const distance = () => track.scrollWidth - window.innerWidth + 48;
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: rootRef.current,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  });

  if (!lb) return null;

  const frames = lb.frames || [];

  return (
    <section ref={rootRef} className="overflow-hidden bg-background">
      {/* Header (in flow above the pinned track on desktop) */}
      <div className="container-site pt-16 md:pt-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>{lb.eyebrow}</Eyebrow>
            <h2 data-reveal className="mt-3 font-display text-[clamp(32px,5vw,48px)] leading-tight">
              {lb.heading}
            </h2>
          </div>
          <Link to={lb.ctaTo} className="da-bracket-link hidden md:inline-flex" data-reveal>
            <span className="da-bracket-label">{lb.ctaLabel}</span>
            <ArrowRight size={14} className="ml-1.5" />
          </Link>
        </div>
      </div>

      {/* Track: horizontal on desktop, vertical stack on mobile */}
      <div className="mt-10 pb-16 md:mt-12 md:pb-24">
        <div
          ref={trackRef}
          className="flex flex-col gap-6 px-6 md:h-[70vh] md:flex-row md:items-stretch md:gap-8 md:px-12"
          style={{ willChange: 'transform' }}
        >
          {frames.map((frame, i) => (
            <div
              key={i}
              data-frame
              className="shrink-0 overflow-hidden rounded-2xl md:h-full"
              style={{ aspectRatio: '4 / 5' }}
            >
              <img src={assetUrl(frame.image)} alt={frame.alt || ''} loading="lazy" className="h-full w-full object-cover" />
              {frame.caption && (
                <div className="hidden" aria-hidden="true">
                  {frame.caption}
                </div>
              )}
            </div>
          ))}

          {/* Caption plate */}
          <div data-frame className="flex shrink-0 flex-col justify-center rounded-2xl bg-surface p-8 md:h-full md:w-[28vw]">
            <Eyebrow>{lb.credit}</Eyebrow>
            <p className="mt-4 font-display text-[26px] leading-tight">{frames[0]?.caption}</p>
          </div>

          {/* Pull-quote frame (charcoal) */}
          <div data-frame className="flex shrink-0 flex-col justify-center rounded-2xl bg-secondary p-8 text-primary md:h-full md:w-[32vw]">
            <blockquote className="font-display text-[clamp(24px,3vw,34px)] font-light leading-[1.25]">
              “{lb.pullQuote}”
            </blockquote>
            <Link to={lb.ctaTo} className="da-bracket-link mt-6 text-primary">
              <span className="da-bracket-label">{lb.ctaLabel}</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
