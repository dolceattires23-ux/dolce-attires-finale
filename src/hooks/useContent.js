import { useEffect, useState } from 'react';

// Content is fetched at runtime from /content.json into window.__SITE_DATA__.
// Components read strings/paths via useContent() — never import from data/ directly.

let cache = null;
let inFlight = null;

async function loadContent() {
  if (cache) return cache;
  if (window.__SITE_DATA__) {
    cache = window.__SITE_DATA__;
    return cache;
  }
  if (!inFlight) {
    inFlight = fetch('/content.json')
      .then((r) => {
        if (!r.ok) throw new Error(`content.json HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        window.__SITE_DATA__ = data;
        cache = data;
        return data;
      });
  }
  return inFlight;
}

/**
 * useContent — returns the whole site content object (or null while loading).
 * Pass a top-level section key to get just that slice (still null while loading).
 */
export function useContent(sectionKey) {
  const [data, setData] = useState(cache || window.__SITE_DATA__ || null);

  useEffect(() => {
    let alive = true;
    if (!data) {
      loadContent().then((d) => {
        if (alive) setData(d);
      });
    }
    return () => {
      alive = false;
    };
  }, [data]);

  if (!data) return null;
  return sectionKey ? data[sectionKey] : data;
}

/**
 * usePrefersReducedMotion — reactive boolean for prefers-reduced-motion: reduce.
 * Drives the static-final-state fallback for every section's motion.
 */
export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
