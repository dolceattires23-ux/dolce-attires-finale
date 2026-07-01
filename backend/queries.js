// backend/queries.js
// Typed READ functions for the DA' storefront. Each returns frontend-ready, plain objects
// and throws a typed Error on failure. Import these by name; they wrap the Wix SDK and the
// Wix REST API so the frontend never calls them directly.
//
// Catalog is Wix Stores V1, so product reads go through the authenticated client's
// `fetchWithAuth` against the V1 Stores REST API. CMS reads use the @wix/data `items` module.
//
// GENDER + SUBCATEGORY TAXONOMY (added 2026-06-10):
//   Gender (men/women/unisex) and each subcategory leaf (shirts, henleys, …, skirts) are modeled
//   as V1 Stores collections (V1 has no native category hierarchy or filterable gender field).
//   Each product therefore carries, in addition to the flat `categories`, two derived arrays —
//   `genders` and `subcategories` — split from its collection memberships using GENDER_SLUGS /
//   SUBCATEGORY_SLUGS, plus a resolved `taxonomy` of menu paths. getTaxonomy() reads the LIVE
//   gender + subcategory collections and shapes them with the TAXONOMY map so the mega-menu renders
//   from the live Wix collections, never a frontend hardcode. Counts are computed from real
//   product memberships (V1's numberOfProducts counter is unreliable — reads 0).
//
// Docs grounding:
//   - V1 query products:     https://dev.wix.com/docs/api-reference/business-solutions/stores/skills/query-products-catalog-v1
//   - V1 get product:        https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/get-product
//   - V1 query collections:  https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-collections
//   - current cart (SDK):    https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart/add-to-current-cart?apiView=SDK
//   - data items query:      https://dev.wix.com/docs/api-reference/business-solutions/cms/skills/cms-data-items-crud

import { wixClient } from './wix-client.js';
import {
  COLLECTIONS,
  PRODUCTS,
  STORE_CURRENCY,
  CATEGORY_DISPLAY_ORDER,
  CATEGORY_NAMES,
  GENDER_SLUGS,
  SUBCATEGORY_SLUGS,
  TAXONOMY,
  MENU_GROUPS,
  FEATURED_SLUGS,
} from './constants.js';

// Extract a product's image URL from the Wix Stores (Catalog V1) `media` object. Returns a
// full https://static.wixstatic.com/... URL (set in the Wix dashboard: Store → product → media),
// or null when the product has no media yet. NO local/baked fallback — product imagery comes
// only from Wix. The client uploads each product's photo in the Stores dashboard.
function productImageUrl(p) {
  const m = (p && p.media) || {};
  const main = m.mainMedia || {};
  const fromMain = (main.image && main.image.url) || (main.thumbnail && main.thumbnail.url) || null;
  if (fromMain) return fromMain;
  for (const it of m.items || []) {
    const u = (it.image && it.image.url) || (it.thumbnail && it.thumbnail.url) || null;
    if (u) return u;
  }
  return null;
}

const V1_PRODUCTS_QUERY_URL = 'https://www.wixapis.com/stores/v1/products/query';
const V1_PRODUCT_GET_URL = (id) => `https://www.wixapis.com/stores/v1/products/${id}`;
// Collections (categories) live on the stores-reader host in Catalog V1.
const V1_COLLECTIONS_QUERY_URL = 'https://www.wixapis.com/stores-reader/v1/collections/query';

// The system "All Products" collection is not a user-facing category; the frontend renders
// its own "All" filter chip. Exclude it from getCategories() / getTaxonomy().
const SYSTEM_ALL_PRODUCTS_ID = '00000000-000000-000000-000000000001';

/**
 * Normalize a raw V1 product into the frontend-facing shape.
 * @returns {{
 *   id: string, slug: string, name: string, description: string,
 *   price: number, currency: string, inStock: boolean,
 *   image: string|null, // Wix Stores media URL (https://static.wixstatic.com/...), or null if none uploaded
 *   options: Array<{ name: string, type: string, choices: Array<{ name: string, value: string, inStock: boolean }> }>,
 *   variants: Array<{ id: string, choices: Object, inStock: boolean }>
 * }}
 */
function normalizeProduct(p) {
  const slug = p.slug || '';
  return {
    id: p.id,
    slug,
    name: p.name || '',
    description: p.description || '',
    price: p?.priceData?.price ?? p?.price?.price ?? 0,
    currency: p?.priceData?.currency || STORE_CURRENCY,
    inStock: p?.stock?.inStock ?? true,
    image: productImageUrl(p),
    options: (p.productOptions || []).map((opt) => ({
      name: opt.name,
      type: opt.optionType, // "color" | "drop_down"
      choices: (opt.choices || []).map((c) => ({
        name: c.description,
        value: c.value, // for "color" this is the hex code (e.g. "#1B2A4A")
        inStock: c.inStock ?? true,
      })),
    })),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      choices: v.choices || {}, // e.g. { Color: "Navy", Size: "M" }
      inStock: v?.stock?.inStock ?? true,
    })),
  };
}

/**
 * Resolve a product's collection slugs into the taxonomy fields the frontend filters by.
 * Splits the flat slug list into `genders` (men/women/unisex) and `subcategories` (leaf slugs),
 * and builds `taxonomy` — the resolved gender▸group▸leaf menu paths this product appears under.
 * @param {string[]} slugs - all collection slugs the product belongs to
 * @returns {{ genders: string[], subcategories: string[], taxonomy: Array<{gender,group,subcategorySlug,subcategoryName}> }}
 */
function resolveTaxonomyFields(slugs) {
  const set = new Set(slugs);
  const genders = GENDER_SLUGS.filter((g) => set.has(g));
  const subcategories = SUBCATEGORY_SLUGS.filter((s) => set.has(s));
  // For each gender the product is in, list which of its tree leaves the product also belongs to.
  const taxonomy = [];
  for (const gender of genders) {
    const tree = TAXONOMY[gender];
    if (!tree) continue; // e.g. 'unisex' has no Tops/Bottoms tree
    for (const group of MENU_GROUPS) {
      for (const leaf of tree[group] || []) {
        if (set.has(leaf)) {
          taxonomy.push({
            gender,
            group,
            subcategorySlug: leaf,
            subcategoryName: CATEGORY_NAMES[leaf] || leaf,
          });
        }
      }
    }
  }
  return { genders, subcategories, taxonomy };
}

/**
 * Get all visible products (the §3.4 shop grid). Variants/options included.
 * Each product carries `categories` (all collection slugs it belongs to, incl. gender + legacy)
 * plus the derived `genders` / `subcategories` / `taxonomy` so the frontend can filter the grid by
 * gender chip and/or subcategory leaf without re-fetching.
 * @returns {Promise<Array<{
 *   id, slug, name, description, price, currency, inStock, image, options, variants,
 *   categories: string[],
 *   genders: string[],              // subset of ['men','women','unisex']
 *   subcategories: string[],        // leaf slugs, e.g. ['shirts'] or ['quarter-zips','knitwear']
 *   taxonomy: Array<{ gender, group, subcategorySlug, subcategoryName }>
 * }>>}
 */
export async function getProducts() {
  try {
    const res = await wixClient.fetchWithAuth(V1_PRODUCTS_QUERY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: { paging: { limit: 100 }, filter: JSON.stringify({ visible: true }) },
        includeVariants: true,
      }),
    });
    if (!res.ok) throw new Error(`getProducts failed: HTTP ${res.status}`);
    const data = await res.json();
    // Build an id->slug map for translating each product's collectionIds into category slugs.
    const idToSlug = await getCategoryIdToSlugMap();
    return (data.products || []).map((p) => {
      const normalized = normalizeProduct(p);
      const slugs = (p.collectionIds || [])
        .map((cid) => idToSlug[cid])
        .filter(Boolean); // drops the system "All Products" id (not in the map)
      normalized.categories = slugs;
      const { genders, subcategories, taxonomy } = resolveTaxonomyFields(slugs);
      normalized.genders = genders;
      normalized.subcategories = subcategories;
      normalized.taxonomy = taxonomy;
      return normalized;
    });
  } catch (err) {
    throw new Error(`[queries.getProducts] ${err.message}`);
  }
}

/**
 * Get a single product by its URL slug (the §3.5 PDP).
 * Returns the same new `genders` / `subcategories` / `taxonomy` fields as getProducts().
 * @param {string} slug e.g. "essential-linen-shirt-short-sleeve"
 * @returns {Promise<Object|null>} normalized product (with taxonomy fields), or null if not found
 */
export async function getProductBySlug(slug) {
  const id = PRODUCTS[slug];
  if (!id) return null;
  try {
    const res = await wixClient.fetchWithAuth(V1_PRODUCT_GET_URL(id), { method: 'GET' });
    if (res.status === 404) return null; // product GUID no longer exists on Wix (see constants drift note)
    if (!res.ok) throw new Error(`getProductBySlug failed: HTTP ${res.status}`);
    const data = await res.json();
    const p = data.product;
    if (!p) return null;
    const normalized = normalizeProduct(p);
    const idToSlug = await getCategoryIdToSlugMap();
    const slugs = (p.collectionIds || []).map((cid) => idToSlug[cid]).filter(Boolean);
    normalized.categories = slugs;
    const { genders, subcategories, taxonomy } = resolveTaxonomyFields(slugs);
    normalized.genders = genders;
    normalized.subcategories = subcategories;
    normalized.taxonomy = taxonomy;
    return normalized;
  } catch (err) {
    throw new Error(`[queries.getProductBySlug] ${err.message}`);
  }
}

/**
 * Internal: live id -> slug map for ALL user-facing Stores collections (V1 collections),
 * excluding the system "All Products" collection. Used to translate a product's collectionIds
 * into human slugs (categories + gender + subcategory).
 * @returns {Promise<Object<string,string>>} { "<collectionId>": "<slug>" }
 */
async function getCategoryIdToSlugMap() {
  const live = await getAllCollections();
  const map = {};
  for (const c of live) map[c.id] = c.slug;
  return map;
}

/**
 * Internal: read every live Stores collection once (gender + subcategory + legacy), excluding the
 * system "All Products" collection. Shared by getCategories(), getTaxonomy(), and the id->slug map.
 * @returns {Promise<Array<{ id: string, name: string, slug: string }>>}
 */
async function getAllCollections() {
  const res = await wixClient.fetchWithAuth(V1_COLLECTIONS_QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  });
  if (!res.ok) throw new Error(`collections query failed: HTTP ${res.status}`);
  const data = await res.json();
  return (data.collections || [])
    .filter((c) => c.id !== SYSTEM_ALL_PRODUCTS_ID)
    .map((c) => ({ id: c.id, name: c.name || CATEGORY_NAMES[c.slug] || c.slug, slug: c.slug }));
}

/**
 * Get the storefront product categories for the legacy §3.4 flat filter row (BACK-COMPAT).
 * `getTaxonomy()` is the new primary API for the gender + subcategory mega-menu; this remains so
 * any flat-filter UI keeps working during migration. Returns the legacy curation/leaf set in
 * CATEGORY_DISPLAY_ORDER ("Newest Drops" first, then Shirts · Pants · Sweatshirts); any live
 * collection not in the display-order list (incl. the new gender/subcategory ones) is appended after.
 * @returns {Promise<Array<{ id: string, name: string, slug: string }>>}
 */
export async function getCategories() {
  try {
    const live = await getAllCollections();
    // Order by the canonical display order; append any extras (gender/subcategory/future) last.
    const rank = (slug) => {
      const i = CATEGORY_DISPLAY_ORDER.indexOf(slug);
      return i === -1 ? CATEGORY_DISPLAY_ORDER.length : i;
    };
    return live.slice().sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name));
  } catch (err) {
    throw new Error(`[queries.getCategories] ${err.message}`);
  }
}

/**
 * Get the full gender ▸ group ▸ subcategory taxonomy for the dynamic mega-menu + shop filters (§3.4/§3.6).
 *
 * Reads the LIVE gender + subcategory collections from Wix and shapes them with the TAXONOMY map.
 * `productCount` per leaf/gender/featured is computed from REAL product memberships via getProducts()
 * (V1's numberOfProducts counter is unreliable — reads 0 — so it is never used). Empty leaves
 * (Henleys, Polos, Chinos, Tailored Pants, Blouses, Elegant Tops, Skirts, …) therefore correctly
 * report `productCount: 0` and the frontend renders an intentional empty state. NOTHING about the
 * taxonomy is hardcoded in the frontend — it all derives from the live Wix collections + live memberships.
 *
 * @returns {Promise<{
 *   genders: Array<{ slug, name, productCount, groups: Array<{ name, subcategories: Array<{ slug, name, productCount }> }> }>,
 *   unisex: { slug:'unisex', name:'Unisex', productCount } | null,
 *   featured: Array<{ slug, name, productCount }>
 * }>}
 */
export async function getTaxonomy() {
  try {
    const [products, live] = await Promise.all([getProducts(), getAllCollections()]);
    const liveSlugs = new Set(live.map((c) => c.slug));

    // Count products per slug from real memberships (each product's `categories`).
    const countBySlug = {};
    for (const p of products) {
      for (const slug of p.categories || []) {
        countBySlug[slug] = (countBySlug[slug] || 0) + 1;
      }
    }
    const count = (slug) => countBySlug[slug] || 0;

    // Build the gender ▸ group ▸ leaf tree from TAXONOMY, including only leaves that exist live.
    const genders = [];
    for (const genderSlug of Object.keys(TAXONOMY)) {
      if (!liveSlugs.has(genderSlug)) continue;
      const tree = TAXONOMY[genderSlug];
      const groups = MENU_GROUPS.map((groupName) => ({
        name: groupName,
        subcategories: (tree[groupName] || [])
          .filter((leaf) => liveSlugs.has(leaf))
          .map((leaf) => ({ slug: leaf, name: CATEGORY_NAMES[leaf] || leaf, productCount: count(leaf) })),
      }));
      genders.push({
        slug: genderSlug,
        name: CATEGORY_NAMES[genderSlug] || genderSlug,
        productCount: count(genderSlug),
        groups,
      });
    }

    const unisex = liveSlugs.has('unisex')
      ? { slug: 'unisex', name: CATEGORY_NAMES.unisex || 'Unisex', productCount: count('unisex') }
      : null;

    const featured = FEATURED_SLUGS.filter((s) => liveSlugs.has(s)).map((slug) => ({
      slug,
      name: CATEGORY_NAMES[slug] || slug,
      productCount: count(slug),
    }));

    return { genders, unisex, featured };
  } catch (err) {
    throw new Error(`[queries.getTaxonomy] ${err.message}`);
  }
}

/**
 * Get reviews for the Google-review UI (§3.8).
 * NOTE: the Reviews collection ships EMPTY by design — no real reviews were available and
 * none are fabricated. This returns [] until the client supplies real reviews; the frontend
 * must render its empty/placeholder state. See backend-spec.md §2 and §6.
 * @returns {Promise<Array<{ id, reviewerName, rating, reviewBody, reviewDate, avatarInitial, source }>>}
 */
export async function getReviews() {
  try {
    const result = await wixClient.items
      .query(COLLECTIONS.REVIEWS)
      .descending('reviewDate')
      .limit(50)
      .find();
    return (result.items || []).map((it) => ({
      id: it._id,
      reviewerName: it.reviewerName || '',
      rating: it.rating ?? 5,
      reviewBody: it.reviewBody || '',
      reviewDate: it.reviewDate || it._createdDate || null,
      avatarInitial: it.avatarInitial || (it.reviewerName ? it.reviewerName.charAt(0) : ''),
      source: it.source || 'Google',
    }));
  } catch (err) {
    throw new Error(`[queries.getReviews] ${err.message}`);
  }
}

/**
 * Normalize a raw Wix eCom currentCart into the flat shape the storefront renders.
 * Each line carries id, product info, the chosen Color/Size, a resolved https image, and qty.
 * @param {Object} cart raw Wix currentCart
 * @returns {{ id: string|null, lines: Array, itemCount: number, subtotal: number, currency: string }}
 */
export function normalizeCart(cart) {
  const lineItems = cart?.lineItems || [];
  const lines = lineItems.map((li) => {
    let color = '';
    let size = '';
    for (const dl of li.descriptionLines || []) {
      const key = (dl.name?.original || dl.name?.translated || '').toLowerCase();
      const val = dl.plainText?.original || dl.plainText?.translated || dl.colorInfo?.original || dl.colorInfo?.translated || '';
      if (key.includes('colour') || key.includes('color')) color = val;
      else if (key.includes('size')) size = val;
    }
    const urlStr = typeof li.url === 'string' ? li.url : li.url?.relativePath || '';
    const slug = urlStr.replace(/[?#].*$/, '').replace(/^.*\/product-page\//, '').replace(/^.*\//, '');
    return {
      id: li._id,
      productId: li.catalogReference?.catalogItemId || '',
      productSlug: slug,
      productName: li.productName?.original || li.productName?.translated || '',
      price: Number(li.price?.amount || 0),
      currency: cart?.currency || STORE_CURRENCY,
      image: resolveWixImageUrl(li.image),
      color,
      size,
      quantity: li.quantity || 1,
    };
  });
  return {
    id: cart?._id || null,
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal: Number(cart?.subtotal?.amount ?? lines.reduce((sum, l) => sum + l.price * l.quantity, 0)),
    currency: cart?.currency || STORE_CURRENCY,
  };
}

/**
 * Get the current visitor's Wix cart (nav cart count + cart drawer + cart page).
 * @returns {Promise<{ id, lines, itemCount, subtotal, currency }>}
 *          Returns an empty cart shape when no cart exists yet (not an error).
 */
export async function getCart() {
  try {
    const cart = await wixClient.currentCart.getCurrentCart();
    return normalizeCart(cart);
  } catch (err) {
    // An empty/absent cart is normal for a first-time visitor — surface as an empty cart.
    if (err?.details?.applicationError?.code === 'OWNED_CART_NOT_FOUND' || /not.?found/i.test(err.message || '')) {
      return { id: null, lines: [], itemCount: 0, subtotal: 0, currency: STORE_CURRENCY };
    }
    throw new Error(`[queries.getCart] ${err.message}`);
  }
}

/**
 * Resolve a Wix MEDIA_IMAGE field value to a browser-usable https URL.
 * @wix/data returns image fields as a `wix:image://v1/<mediaId>/<filename>#...` URI
 * (or, occasionally, an object / a ready https URL). Returns null when unset.
 * @param {string|object|null} val
 * @returns {string|null}
 */
function resolveWixImageUrl(val) {
  if (!val) return null;
  if (typeof val === 'object') val = val.url || val.src || val.image || '';
  if (typeof val !== 'string' || !val) return null;
  if (/^https?:\/\//i.test(val)) return val;
  const m = val.match(/^wix:image:\/\/v1\/([^/]+)/i);
  return m ? `https://static.wixstatic.com/media/${m[1]}` : null;
}

/**
 * Get editable section images (the hero + editorial/"A New Path" photos the client manages
 * from the Wix CMS `SiteImages` collection). Public read. Each row's `imageUrl` is null until
 * the client uploads an image in the CMS — the frontend falls back to its bundled asset for
 * that section/slot when `imageUrl` is null, and shows the Wix image once one is uploaded.
 * @returns {Promise<Array<{ section: string, slot: number, imageUrl: string|null, alt: string, caption: string }>>}
 */
export async function getSiteImages() {
  try {
    const result = await wixClient.items
      .query(COLLECTIONS.SITE_IMAGES)
      .ascending('slot')
      .limit(50)
      .find();
    return (result.items || []).map((it) => ({
      section: it.section || '',
      slot: it.slot ?? 1,
      imageUrl: resolveWixImageUrl(it.image),
      alt: it.alt || '',
      caption: it.caption || '',
    }));
  } catch (err) {
    throw new Error(`[queries.getSiteImages] ${err.message}`);
  }
}
