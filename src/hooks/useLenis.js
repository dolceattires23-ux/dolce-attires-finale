import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from './useContent.js';

// Lenis smooth scroll — research-brief §0: ON, moderate (lerp 0.09, duration 1.1), disabled
// under prefers-reduced-motion. Initialized once at app root and RE-INITIALISED on every route
// change (multi-page SPA), with scroll reset to top. Wired to GSAP ScrollTrigger via
// lenis.on('scroll', ScrollTrigger.update) + gsap.ticker (brief §4). Exposed on window.__lenis
// so the nav can scrollTo anchors and the Phase C harness can destroy it before screenshots.

gsap.registerPlugin(ScrollTrigger);
// Expose for the verification harness (programmatic scroll → ScrollTrigger.update()). Harmless in prod.
if (typeof window !== 'undefined') window.ScrollTrigger = ScrollTrigger;

export function useAppLenis() {
  const reducedMotion = usePrefersReducedMotion();
  const { pathname } = useLocation();

  useEffect(() => {
    // Always reset to top on a route change first.
    window.scrollTo(0, 0);

    if (reducedMotion) {
      // Native scroll under reduced-motion; make sure ScrollTrigger still tracks the window.
      ScrollTrigger.refresh();
      return undefined;
    }

    const lenis = new Lenis({
      lerp: 0.09,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    window.__lenis = lenis;
    lenis.scrollTo(0, { immediate: true });

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Let layout settle, then recompute all triggers for the freshly-mounted route.
    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(refreshId);
      gsap.ticker.remove(tick);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      if (window.__lenis === lenis) delete window.__lenis;
    };
  }, [reducedMotion, pathname]);
}

/**
 * Smooth-scroll to an in-page anchor id, accounting for the fixed nav height.
 * Uses Lenis when active, falls back to native scroll under reduced-motion.
 */
export function scrollToAnchor(id) {
  const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
  if (!el) return;
  const navH = window.matchMedia('(min-width: 1024px)').matches ? 80 : 64;
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset: -navH });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'auto' });
  }
}
