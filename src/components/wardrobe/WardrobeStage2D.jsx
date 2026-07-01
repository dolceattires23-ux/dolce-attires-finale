import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from '../../hooks/useContent.js';
import { useGsap } from '../../hooks/useReveal.js';
import { assetUrl } from '../../lib/assets.js';

gsap.registerPlugin(ScrollTrigger);

// WardrobeStage2D — the current 2D layered/parallax renderer behind <WardrobeStage>.
// Renders absolutely-positioned image planes + GSAP parallax + CSS hotspots. The doors-part
// entrance splits the SYMMETRIC entrance backplate into left/right halves that translate outward
// (scrubbed by scroll, 0px edges). Wings parallax (background slower than foreground). Hotspots
// (sanctioned circles) call onHotspotActivate and render the host's mini-card. Reduced-motion:
// doors pre-parted, no parallax, content at final state.

export default function WardrobeStage2D({ scenes = [], onEnterScene, onHotspotActivate, renderHotspotCard }) {
  return (
    <div className="bg-walnut-deep text-ivory">
      {scenes.map((scene) =>
        scene.kind === 'doors' ? (
          <DoorsScene key={scene.id} scene={scene} onEnter={onEnterScene} />
        ) : (
          <WingScene
            key={scene.id}
            scene={scene}
            onEnter={onEnterScene}
            onHotspotActivate={onHotspotActivate}
            renderHotspotCard={renderHotspotCard}
          />
        )
      )}
    </div>
  );
}

// --- Entrance: doors-part (split the symmetric backplate) ---
function DoorsScene({ scene, onEnter }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const contentRef = useRef(null);

  const rootRef = useGsap((self, { reduced }) => {
    onEnter?.(scene.id);
    if (reduced) {
      // Doors pre-parted, content visible.
      gsap.set(leftRef.current, { xPercent: -100 });
      gsap.set(rightRef.current, { xPercent: 100 });
      gsap.set(contentRef.current, { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: rootRef.current,
        start: 'top top',
        end: '+=110%',
        scrub: 0.7,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(leftRef.current, { xPercent: -100, ease: 'power1.inOut' }, 0)
      .to(rightRef.current, { xPercent: 100, ease: 'power1.inOut' }, 0)
      .fromTo(contentRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out' }, 0.25);
  });

  const src = assetUrl(scene.backplate);
  const mobileSrc = assetUrl(scene.backplateMobile || scene.backplate);

  return (
    <section ref={rootRef} className="relative h-screen overflow-hidden" aria-label={scene.title}>
      {/* Interior (revealed behind the doors) — use the mobile portrait interior as the "inside" */}
      <div className="absolute inset-0">
        <img src={mobileSrc} alt="" aria-hidden="true" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-walnut-deep/55" />
      </div>

      {/* Content behind the doors */}
      <div ref={contentRef} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow text-gold">{scene.eyebrow}</p>
        <h1 className="mt-5 font-display text-[clamp(40px,7vw,76px)] font-light leading-[1.05] tracking-[0.04em] text-ivory">
          {scene.title}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-ivory/80">{scene.intro}</p>
        <span className="mt-10 text-ivory/60">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      {/* Two door halves over the top — each shows its half of the symmetric backplate */}
      <div ref={leftRef} className="absolute inset-y-0 left-0 z-20 w-1/2 overflow-hidden will-change-transform">
        <img src={src} alt={scene.alt || ''} className="h-full w-[200%] max-w-none object-cover" loading="eager" />
        <span className="absolute inset-y-0 right-0 w-px bg-gold/40" />
      </div>
      <div ref={rightRef} className="absolute inset-y-0 right-0 z-20 w-1/2 overflow-hidden will-change-transform">
        <img src={src} alt="" aria-hidden="true" className="absolute right-0 h-full w-[200%] max-w-none object-cover" style={{ left: '-100%' }} />
        <span className="absolute inset-y-0 left-0 w-px bg-gold/40" />
      </div>
    </section>
  );
}

// --- Wing: parallax backplate + hotspots + spotlight ---
function WingScene({ scene, onEnter, onHotspotActivate, renderHotspotCard }) {
  const reduced = usePrefersReducedMotion();
  const bgRef = useRef(null);
  const [active, setActive] = useState(null);

  const rootRef = useGsap((self, ctx) => {
    onEnter?.(scene.id);
    if (ctx.reduced) {
      gsap.set('[data-wing-reveal]', { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      bgRef.current,
      { yPercent: -10 },
      { yPercent: 10, ease: 'none', scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 } }
    );
    gsap.from('[data-wing-reveal]', {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: rootRef.current, start: 'top 70%', once: true },
    });
    // Hotspots fade in slightly later.
    gsap.from('[data-hotspot]', {
      opacity: 0,
      scale: 0.6,
      duration: 0.5,
      stagger: 0.08,
      ease: 'back.out(1.6)',
      scrollTrigger: { trigger: rootRef.current, start: 'top 60%', once: true },
    });
  }, [scene.id]);

  const toggle = (h) => {
    const next = active === h.id ? null : h.id;
    setActive(next);
    if (next) onHotspotActivate?.(h, scene);
  };

  return (
    <section ref={rootRef} className="relative overflow-hidden" aria-label={scene.title}>
      {/* Parallax backplate */}
      <div ref={bgRef} className="absolute inset-0 scale-110">
        <img src={assetUrl(scene.backplate)} alt={scene.alt || ''} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-walnut-deep/85 via-walnut-deep/35 to-walnut-deep/70" />
      </div>

      <div className="relative z-10 grid min-h-[88vh] items-center gap-8 px-6 py-20 md:grid-cols-2 md:px-12">
        {/* Spotlight / copy column (Molteni split) */}
        <div className="max-w-md">
          <p data-wing-reveal className="eyebrow text-gold">
            {scene.eyebrow}
          </p>
          <h2 data-wing-reveal className="mt-4 font-display text-[clamp(34px,5vw,52px)] font-light leading-tight text-ivory">
            {scene.title}
          </h2>
          <p data-wing-reveal className="mt-4 text-[16px] leading-relaxed text-ivory/75">
            {scene.note}
          </p>
          {scene.groups && (
            <div data-wing-reveal className="mt-5 flex gap-3 text-[12px] uppercase tracking-[0.14em] text-gold-soft">
              {scene.groups.map((g) => (
                <span key={g}>{g}</span>
              ))}
            </div>
          )}
          {/* Host-provided spotlight (real product card on the dark stage) */}
          {renderHotspotCard && scene.spotlights?.[0] && (
            <div data-wing-reveal className="mt-7">{renderHotspotCard(scene.spotlights[0], scene, 'spotlight')}</div>
          )}
        </div>

        {/* Hotspot field (right) — invisible spacer keeps the column for layout */}
        <div className="hidden md:block" aria-hidden="true" />
      </div>

      {/* Hotspots positioned over the whole scene (normalized coords) */}
      {scene.hotspots?.map((h) => {
        const isActive = active === h.id;
        return (
          <div key={h.id} className="absolute z-20" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
            <button
              type="button"
              data-hotspot
              aria-label={`View product`}
              aria-expanded={isActive}
              onClick={() => toggle(h)}
              className="relative flex h-11 w-11 items-center justify-center"
            >
              <span className={`absolute h-4 w-4 rounded-full border border-gold bg-gold/30 ${reduced ? '' : 'anim-hotspot'}`} />
              <span className="absolute h-1.5 w-1.5 rounded-full bg-gold-soft" />
            </button>
            {isActive && renderHotspotCard && (
              <div
                className="absolute left-1/2 top-full z-30 w-56 -translate-x-1/2 translate-y-2"
                style={reduced ? undefined : { animation: 'da-fade-in 0.25s ease' }}
              >
                {renderHotspotCard(h, scene, 'hotspot')}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
