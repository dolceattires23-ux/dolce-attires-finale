import { Link } from 'react-router-dom';
import { assetUrl } from '../../lib/assets.js';

// Eyebrow — the shared tracked micro-label (DM Sans uppercase). data-reveal lets useReveal pick it up.
export function Eyebrow({ children, className = '', dark = false, reveal = true }) {
  return (
    <span
      className={`eyebrow ${dark ? 'text-gold' : 'text-text-muted'} ${className}`}
      {...(reveal ? { 'data-reveal': '' } : {})}
    >
      {children}
    </span>
  );
}

// CTA as a router Link, sharing the .da-btn spec (equal height + min-width per breakpoint, 0px).
export function ButtonLink({ to, href, variant = 'primary', className = '', children, onClick, ...rest }) {
  const cls = `da-btn da-btn-${variant} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={cls} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

// Resolve a product's served image — strictly the Wix Stores media URL attached to the product.
// No local/bundled fallback: every product carries its own image in Wix Media. assetUrl passes
// an https Wix URL through unchanged (and would normalize any non-URL path).
export function productImage(product) {
  if (!product) return '';
  return assetUrl(product.image || '');
}

// True orientation of each product's fallback image — used to pick the right tile aspect-ratio
// so a portrait product shot never gets letterboxed in a square frame (and vice-versa).
// (square: 1/1, portrait: 4/5). From image-manifest.md.
export function productAspect() {
  return '4 / 5';
}
