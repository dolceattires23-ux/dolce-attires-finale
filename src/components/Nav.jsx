import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useContent, usePrefersReducedMotion } from '../hooks/useContent.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { SearchIcon, CartIcon, MenuIcon, ArrowRight } from './ui/icons.jsx';
import MobileNav from './MobileNav.jsx';
import SearchOverlay from './SearchOverlay.jsx';
import { assetUrl } from '../lib/assets.js';

// 3.0a — sticky header + Shop mega-menu. Fixed bar, transparent over the hero, solid past 80px.
// Mega-menu link lists are built DYNAMICALLY from getTaxonomy() (backend-spec §2/§7) — never
// hardcoded. Empty leaves (productCount 0) render muted "soon". Right cluster: Search · Cart(count).

export default function Nav() {
  const nav = useContent('nav');
  const { taxonomy } = useCatalog();
  const { cart, setDrawerOpen } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeTimer = useRef(null);

  // Transparent only over the Home hero; every other route gets the solid bar immediately.
  const overHero = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const solid = scrolled || !overHero || megaOpen;

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const cartCount = cart?.itemCount || 0;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solid
            ? 'bg-background text-text border-b border-hairline'
            : 'bg-transparent text-white border-b border-transparent'
        }`}
        onMouseLeave={scheduleClose}
      >
        <div className="container-site flex h-16 items-center justify-between lg:h-20">
          {/* Left: links (desktop) / hamburger (mobile) */}
          <div className="flex flex-1 items-center gap-7">
            <button
              type="button"
              className="lg:hidden -ml-1 p-1"
              aria-label={nav?.menuLabel || 'Menu'}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon size={22} />
            </button>
            <nav className="hidden lg:flex items-center gap-7 text-[12px] uppercase tracking-[0.15em]">
              {(nav?.links || []).map((link) =>
                link.mega ? (
                  <button
                    key="shop"
                    type="button"
                    className="relative py-2 transition-opacity hover:opacity-60"
                    onMouseEnter={openMega}
                    onFocus={openMega}
                    aria-haspopup="true"
                    aria-expanded={megaOpen}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="py-2 transition-opacity hover:opacity-60"
                    onMouseEnter={scheduleClose}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>

          {/* Center: wordmark */}
          <Link
            to="/"
            className="font-display text-[22px] lg:text-[26px] tracking-[0.18em] leading-none"
            aria-label={`${nav?.wordmark || "DA'"} home`}
          >
            {nav?.wordmark || "DA'"}
          </Link>

          {/* Right: utilities */}
          <div className="flex flex-1 items-center justify-end gap-5">
            <button
              type="button"
              aria-label={nav?.searchLabel || 'Search'}
              className="p-1 transition-opacity hover:opacity-60"
              onClick={() => setSearchOpen(true)}
              onMouseEnter={scheduleClose}
            >
              <SearchIcon size={18} />
            </button>
            <button
              type="button"
              aria-label={`${nav?.cartLabel || 'Cart'}${cartCount ? `, ${cartCount} items` : ''}`}
              className="relative p-1 transition-opacity hover:opacity-60"
              onClick={() => setDrawerOpen(true)}
              onMouseEnter={scheduleClose}
            >
              <CartIcon size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1 min-w-[16px] rounded-full bg-secondary px-1 text-center text-[9px] font-medium leading-[16px] text-primary">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega-menu panel (desktop) */}
        {taxonomy && (
          <MegaMenu
            open={megaOpen}
            taxonomy={taxonomy}
            mega={nav?.megaMenu}
            reduced={reduced}
            onMouseEnter={openMega}
            onMouseLeave={scheduleClose}
            onNavigate={(to) => {
              setMegaOpen(false);
              navigate(to);
            }}
          />
        )}
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} taxonomy={taxonomy} nav={nav} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MegaMenu({ open, taxonomy, mega, reduced, onMouseEnter, onMouseLeave, onNavigate }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (reduced) {
      gsap.set(el, { opacity: open ? 1 : 0, y: 0 });
      return;
    }
    if (open) {
      gsap.fromTo(
        el,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
      gsap.fromTo(
        el.querySelectorAll('[data-mega-item]'),
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.2, stagger: 0.02, ease: 'power2.out' }
      );
    }
  }, [open, reduced]);

  const genders = taxonomy.genders || [];

  return (
    <div
      ref={panelRef}
      className="absolute inset-x-0 top-full border-t border-hairline bg-background text-text shadow-primary"
      style={{ pointerEvents: open ? 'auto' : 'none', opacity: open ? undefined : 0 }}
      aria-hidden={!open}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="container-site grid grid-cols-12 gap-8 py-12">
        <div className="col-span-8 grid grid-cols-2 gap-10">
          {genders.map((g) => (
            <div key={g.slug} data-mega-item="">
              <button
                type="button"
                onClick={() => onNavigate(`/${g.slug}`)}
                className="mb-5 block font-display text-[26px] tracking-[0.04em] transition-opacity hover:opacity-60"
              >
                {g.name}
              </button>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {(g.groups || []).map((group) => (
                  <div key={group.name}>
                    <p className="eyebrow mb-3 text-text-muted">{group.name}</p>
                    <ul className="space-y-2.5">
                      {(group.subcategories || []).map((sub) => {
                        const empty = !sub.productCount;
                        return (
                          <li key={sub.slug}>
                            <button
                              type="button"
                              disabled={empty}
                              onClick={() => onNavigate(`/${g.slug}?sub=${sub.slug}`)}
                              className={`text-left text-[14px] transition-opacity ${
                                empty ? 'cursor-default text-text-muted/70' : 'hover:opacity-60'
                              }`}
                            >
                              {sub.name}
                              {empty && (
                                <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-text-muted/70">
                                  {mega?.emptyLeafNote || 'Soon'}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onNavigate(`/${g.slug}`)}
                  className="da-bracket-link col-span-2 mt-1"
                >
                  <span className="da-bracket-label">
                    {g.slug === 'men' ? mega?.viewAllMen : mega?.viewAllWomen}
                  </span>
                  <ArrowRight size={13} className="ml-1.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Editorial image tile (portrait → portrait, image-manifest fits) */}
        <button
          type="button"
          data-mega-item=""
          onClick={() => onNavigate('/women')}
          className="group relative col-span-4 overflow-hidden rounded-2xl text-left"
          style={{ aspectRatio: '4 / 5' }}
        >
          <img
            src={assetUrl(mega?.image)}
            alt={mega?.imageAlt || ''}
            width={432}
            height={540}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-secondary/55 via-transparent to-transparent" />
          <span className="absolute bottom-5 left-5 right-5 text-white">
            <span className="eyebrow block opacity-90">{mega?.imageCaption}</span>
            <span className="mt-1 block font-display text-[20px] leading-tight">{mega?.intro}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
