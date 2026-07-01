import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { usePrefersReducedMotion, useContent } from '../hooks/useContent.js';
import { useCart } from '../context/CartContext.jsx';
import { CloseIcon } from './ui/icons.jsx';

// 3.0b — full-screen cream overlay drawer (ref mobile-nav--therow). Top-level route links; Shop
// expands to Men/Women, each with a "+" that accordions its Tops/Bottoms leaves (dynamic from
// getTaxonomy()). Body scroll-locked while open (iOS-safe position:fixed). Slides x:100%→0 320ms.

export default function MobileNav({ open, onClose, taxonomy, nav }) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { setDrawerOpen, cart } = useCart();
  const footer = useContent('footer');
  const panelRef = useRef(null);
  const scrollY = useRef(0);
  const [expanded, setExpanded] = useState(null); // gender slug currently open

  // Body scroll lock (lock position, restore on close).
  useEffect(() => {
    if (!open) return undefined;
    scrollY.current = window.scrollY;
    const { style } = document.body;
    style.position = 'fixed';
    style.top = `-${scrollY.current}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
    return () => {
      style.position = '';
      style.top = '';
      style.left = '';
      style.right = '';
      style.width = '';
      window.scrollTo(0, scrollY.current);
    };
  }, [open]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || !open) return;
    if (reduced) {
      gsap.set(el, { x: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(el, { xPercent: 100, opacity: 0.6 }, { xPercent: 0, opacity: 1, duration: 0.32, ease: 'power3.out' });
    gsap.fromTo(
      el.querySelectorAll('[data-mn-row]'),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, delay: 0.08, ease: 'power3.out' }
    );
  }, [open, reduced]);

  if (!open) return null;

  const go = (to) => {
    onClose();
    navigate(to);
  };

  const genders = taxonomy?.genders || [];

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={nav?.menuLabel || 'Menu'}>
      <div
        ref={panelRef}
        className="absolute inset-0 flex flex-col overflow-y-auto bg-background px-6 pb-10 pt-5"
        data-lenis-prevent
      >
        <div className="mb-8 flex items-center justify-between" data-mn-row>
          <span className="eyebrow text-text-muted">{nav?.menuLabel || 'Menu'}</span>
          <button type="button" aria-label={nav?.closeLabel || 'Close'} onClick={onClose} className="p-1">
            <CloseIcon size={24} />
          </button>
        </div>

        <nav className="flex-1">
          <ul className="divide-y divide-hairline border-y border-hairline">
            <li data-mn-row>
              <button type="button" onClick={() => go('/')} className="block w-full py-4 text-left font-display text-[28px]">
                Home
              </button>
            </li>

            {/* Shop → gender accordions */}
            <li data-mn-row className="py-2">
              <p className="py-2 font-display text-[28px]">{nav?.shopLabel || 'Shop'}</p>
              <ul>
                {genders.map((g) => {
                  const isOpen = expanded === g.slug;
                  return (
                    <li key={g.slug} className="border-t border-hairline/70">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => go(`/${g.slug}`)}
                          className="flex-1 py-3 text-left font-display text-[22px]"
                        >
                          {g.name}
                        </button>
                        <button
                          type="button"
                          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${g.name}`}
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : g.slug)}
                          className="px-3 py-3 text-2xl leading-none text-text-muted"
                        >
                          {isOpen ? '–' : '+'}
                        </button>
                      </div>
                      <Accordion open={isOpen} reduced={reduced}>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pb-5 pl-1 pt-1">
                          {(g.groups || []).map((group) => (
                            <div key={group.name}>
                              <p className="eyebrow mb-2 text-text-muted">{group.name}</p>
                              <ul className="space-y-2">
                                {(group.subcategories || []).map((sub) => {
                                  const empty = !sub.productCount;
                                  return (
                                    <li key={sub.slug}>
                                      <button
                                        type="button"
                                        disabled={empty}
                                        onClick={() => go(`/${g.slug}?sub=${sub.slug}`)}
                                        className={`text-[15px] ${empty ? 'text-text-muted/70' : ''}`}
                                      >
                                        {sub.name}
                                        {empty && (
                                          <span className="ml-1 text-[10px] uppercase tracking-[0.1em] text-text-muted/70">
                                            {nav?.megaMenu?.emptyLeafNote || 'Soon'}
                                          </span>
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </Accordion>
                    </li>
                  );
                })}
              </ul>
            </li>

            {(nav?.links || [])
              .filter((l) => !l.mega && l.to !== '/')
              .map((link) => (
                <li key={link.to} data-mn-row>
                  <button type="button" onClick={() => go(link.to)} className="block w-full py-4 text-left font-display text-[28px]">
                    {link.label}
                  </button>
                </li>
              ))}
          </ul>

          {/* Secondary actions */}
          <div className="mt-8 space-y-4 text-[15px]" data-mn-row>
            <button
              type="button"
              onClick={() => {
                onClose();
                setDrawerOpen(true);
              }}
              className="block"
            >
              {nav?.cartLabel || 'Cart'}
              {cart?.itemCount ? ` (${cart.itemCount})` : ''}
            </button>
            <button type="button" onClick={() => go('/contact')} className="block">
              Contact
            </button>
          </div>
        </nav>

        {/* Social + policies */}
        <div className="mt-10 border-t border-hairline pt-6" data-mn-row>
          <div className="flex gap-5 text-[13px] uppercase tracking-[0.12em] text-text-muted">
            {(footer?.columns?.find((c) => c.title === 'Connect')?.links || []).map((l) => (
              <a key={l.label} href={l.external} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-text-muted">{footer?.legal}</p>
        </div>
      </div>
    </div>
  );
}

// Accordion — animates max-height/opacity via GSAP (measured), transform-safe content.
function Accordion({ open, reduced, children }) {
  const wrapRef = useRef(null);
  const [render, setRender] = useState(open);

  useEffect(() => {
    const el = wrapRef.current;
    if (open) setRender(true);
    if (!el) return undefined;
    if (reduced) {
      gsap.set(el, { height: open ? 'auto' : 0, opacity: open ? 1 : 0 });
      if (!open) setRender(false);
      return undefined;
    }
    if (open) {
      gsap.set(el, { height: 'auto', opacity: 1 });
      const h = el.offsetHeight;
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: h, opacity: 1, duration: 0.3, ease: 'power2.out', onComplete: () => gsap.set(el, { height: 'auto' }) });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => setRender(false) });
    }
    return undefined;
  }, [open, reduced]);

  return (
    <div ref={wrapRef} style={{ overflow: 'hidden', height: open ? undefined : 0 }}>
      {render ? children : null}
    </div>
  );
}
