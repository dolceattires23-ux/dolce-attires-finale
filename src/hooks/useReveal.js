import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from './useContent.js';

gsap.registerPlugin(ScrollTrigger);

// useReveal() — research-brief §4 default entrance reveal.
// Returns a ref to attach to a section/container. On scroll into view (start 'top 85%', once),
// its direct children matching `selector` (default [data-reveal]) animate y:24→0, opacity 0→1,
// 0.7s, stagger 0.08s, power3.out. Under prefers-reduced-motion every element renders at its
// final state with no animation. Each ScrollTrigger is cleaned up via gsap.context().revert().
export function useReveal({
  selector = '[data-reveal]',
  y = 24,
  duration = 0.7,
  stagger = 0.08,
  start = 'top 85%',
  delay = 0,
} = {}) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll(selector);
    if (!targets.length) return undefined;

    if (reduced) {
      gsap.set(targets, { clearProps: 'all', opacity: 1, y: 0 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start, once: true },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced, selector, y, duration, stagger, start, delay]);

  return ref;
}

// useGsap(fn, deps) — run an arbitrary GSAP setup inside a scoped context with automatic
// cleanup (the standard signature-only-renderer pattern). `fn` receives the scope element and
// the reduced-motion flag; whatever timelines/ScrollTriggers it creates are reverted on cleanup.
export function useGsap(fn, deps = []) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const ctx = gsap.context((self) => fn(self, { root, reduced }), root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);

  return ref;
}
