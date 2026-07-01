import { useEffect, useState } from 'react';
import { useContent } from '../hooks/useContent.js';

// Back-to-top — small square (0px) charcoal-on-cream button, fades in after 1.5 viewport heights,
// bottom-right (brief §0). Uses Lenis when active, native scroll otherwise.
export default function BackToTop() {
  const common = useContent('common');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1 });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={common?.backToTopLabel || 'Back to top'}
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center border border-secondary/30 bg-background text-secondary shadow-primary transition-all duration-300 hover:bg-secondary hover:text-primary"
      style={{ opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none', transform: show ? 'translateY(0)' : 'translateY(8px)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline points="6 14 12 8 18 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
