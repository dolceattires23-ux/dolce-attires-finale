// Asset + format helpers.

/**
 * Normalize ANY image path (backend product paths or content.json paths) to the served,
 * optimized asset. Backend product objects carry a LOCAL path like
 * "brand_assets/images/x.jpg" (Wix Media upload wasn't possible — see backend-spec §6),
 * which we cannot edit in backend/. Phase D converts every image to WebP and deletes the
 * .jpg/.png originals, so we must:
 *   - prepend a leading "/" (served from public/ root) if not already absolute/URL
 *   - swap a .jpg/.jpeg/.png extension to .webp
 * Wix media URLs (http...) and already-.webp paths pass through unchanged.
 */
export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  let p = path.replace(/\.(jpe?g|png)$/i, '.webp');
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

/** Format a MUR price as "Rs 1,170". */
export function formatPrice(amount, currency = 'MUR') {
  const n = Number(amount) || 0;
  const grouped = n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return currency === 'MUR' ? `Rs ${grouped}` : `${currency} ${grouped}`;
}

/** Strip HTML tags + decode a few common entities from a rich-text string (Wix descriptions). */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>(?=\S)/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize a raw Wix currentCart lineItem into a flat shape the UI renders.
 * Wix media URLs (wix:image://… or static.wixstatic) are resolved to https; color/size come from
 * descriptionLines. Defensive across SDK field shapes. Used by the cart drawer + cart page.
 */
export function normalizeLineItem(li) {
  if (!li) return null;
  const name = li.productName?.original || li.productName?.translated || li.productName || '';
  // descriptionLines: [{ name:{original:'Color'}, colorInfo:{...} | plainText:{original:'M'} }]
  const opts = {};
  for (const dl of li.descriptionLines || []) {
    const key = (dl.name?.original || dl.name?.translated || dl.lineType || '').toLowerCase();
    const val =
      dl.colorInfo?.original ||
      dl.colorInfo?.translated ||
      dl.plainText?.original ||
      dl.plainText?.translated ||
      dl.color ||
      '';
    if (key.includes('color') || key.includes('colour')) opts.color = val;
    else if (key.includes('size')) opts.size = val;
  }
  const rawImg = li.image || li.media?.image?.url || '';
  return {
    id: li._id || li.id,
    name,
    color: opts.color,
    size: opts.size,
    quantity: li.quantity || 1,
    priceFormatted: li.price?.formattedAmount || li.lineItemPrice?.formattedAmount || '',
    priceAmount: Number(li.price?.amount || li.lineItemPrice?.amount || 0),
    image: resolveCartImage(rawImg),
    slug: li.url?.relativePath?.replace(/^.*\/product-page\//, '') || li.catalogReference?.catalogItemId || '',
  };
}

function resolveCartImage(val) {
  if (!val) return '';
  if (/^https?:\/\//i.test(val)) return val;
  const m = String(val).match(/^wix:image:\/\/v1\/([^/]+)/i);
  return m ? `https://static.wixstatic.com/media/${m[1]}` : '';
}

/** Relative-time string for review dates, e.g. "2 weeks ago". */
export function relativeDate(dateLike) {
  if (!dateLike) return '';
  const then = new Date(dateLike).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.round((Date.now() - then) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return `${w} week${w > 1 ? 's' : ''} ago`;
  }
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m} month${m > 1 ? 's' : ''} ago`;
  }
  const y = Math.round(days / 365);
  return `${y} year${y > 1 ? 's' : ''} ago`;
}
