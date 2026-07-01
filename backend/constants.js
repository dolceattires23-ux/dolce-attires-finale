// backend/constants.js
// Canonical IDs for the DA' (Dolce Attires) backend. Single source of truth — no inline
// collection names or product/category IDs anywhere else in backend/. Mirrors
// backend/schema/collections.json. Imported via queries.js / mutations.js only.

// --- CMS collections ---
export const COLLECTIONS = {
  REVIEWS: 'Reviews',
  EMAIL_SIGNUPS: 'EmailSignups',
  CONTACT_SUBMISSIONS: 'ContactSubmissions',
  // Pre-order capture (visitor-insert, admin-read) — records a customer's pre-order intent.
  PREORDERS: 'Preorders',
  // Editable section imagery (public read, admin write). Client swaps the hero + editorial
  // ("A New Path") photos from the Wix CMS; getSiteImages() reads them. See backend-spec §2.
  SITE_IMAGES: 'SiteImages',
};

// --- Wix Forms ---
// The newsletter, contact, and pre-order forms submit through the Wix Forms Submissions API
// (namespace wix.form_app.form). Each submission triggers the live owner-notification automation
// on the matching form, so the store owner is emailed on every signup / message / pre-order.
export const FORM_IDS = {
  NEWSLETTER: '12a0d41d-4907-4cb5-9c8b-1a661958af48',
  CONTACT: '17f8c186-99dd-427d-a664-cab17d2c5ad0',
  PREORDER: '1cc690ff-cd14-4b11-9ce8-4aa8d747f646',
};

// Wix Forms Submissions endpoint. The shared client's fetchWithAuth injects the visitor token.
export const FORM_SUBMISSIONS_URL = 'https://www.wixapis.com/form-submission-service/v4/submissions';

// --- Wix Stores (Catalog V1) ---
export const STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

// Product GUIDs (stable). Slugs are the frontend-facing keys for getProductBySlug().
//
// All 5 products exist live on Wix Stores (Catalog V1) with MANAGED Color×Size variants, and
// getProductBySlug() resolves all 5 slugs. Colors reuse the live catalog's hex values for swatch
// consistency (Cream #F5F0E8, White #FFFFFF, Navy #1B2A4A, Black #1A1A1A, Light Blue #A8C4D4).
export const PRODUCTS = {
  'essential-linen-shirt-short-sleeve': '159b185f-a47d-4d24-953c-54a7ef3ea2a8',
  'linen-shirt-long-sleeve': 'ae11e3e5-77ca-47b4-afc2-5de877c9c8fa',
  'linen-pants': '2404eeb3-4a59-4d7c-99b2-57dd0437ae14',
  'striped-pants-unisex': '189ad2f4-2c9b-42fb-86f5-7470df357603',
  'quarter-zip-sweatshirt': 'd7d66100-7a00-46bb-b2fa-41590393fcad',
};

// Slugs of the products confirmed to exist live on Wix (the subset of PRODUCTS that resolves).
// All 5 product slugs resolve; Trousers + Unisex are populated.
export const LIVE_PRODUCT_SLUGS = [
  'essential-linen-shirt-short-sleeve',
  'linen-shirt-long-sleeve',
  'linen-pants',
  'striped-pants-unisex',
  'quarter-zip-sweatshirt',
];

// Category / collection (V1 Stores collection) GUIDs by slug.
// Three dimensions now live as V1 collections (V1 has no native hierarchy — see TAXONOMY below):
//   1. GENDER       — men / women / unisex
//   2. SUBCATEGORY  — the leaf categories (shirts, henleys, …, skirts)
//   3. LEGACY/curation — newest-drops, pants, sweatshirts (kept for back-compat; not in the tree)
export const CATEGORIES = {
  // legacy / curation (kept — do not delete)
  'newest-drops': '94f60067-93d2-4d69-8320-3cdbb6ce98b9',
  pants: 'e79ef267-57b3-404c-a70a-1bcae1021a61',
  sweatshirts: 'a09e9f68-cbcd-42d2-beef-7633ac86db28',
  // gender
  men: '9b56c8cd-95f8-4308-bcce-b02fdcdecac8',
  women: '5c922aa5-8dec-4c80-8a55-e8a0336efb85',
  unisex: '351204f7-983d-495b-9563-a352a2b3ce1e',
  // subcategory leaves
  shirts: 'f69c62b5-33ce-4b8a-8965-238184dfb9d4', // reused (pre-existing)
  henleys: 'a02a044d-d3bf-4ab7-8dac-d8b2618fa6aa',
  'polo-shirts': 'f0923443-40a8-4eb8-b2e6-7356a128fd49',
  'quarter-zips': 'f7671833-6d94-4908-83ce-abeb2087d39e',
  knitwear: '4e72203c-dd9d-4a59-a407-aaff0239cf6c',
  trousers: '4c89f018-e55e-42da-9139-3ab2aedf9ae0',
  chinos: '0d4c9b27-6126-4f3c-a304-3a9227efea0e',
  'tailored-pants': '5ea07147-7969-45ac-ab9b-43e9c4b78bae',
  blouses: '75840b06-3cf2-4c67-a5e4-b1e32a4b8fbb',
  'elegant-tops': '4c6aad02-b66b-4e79-aa28-51919848253e',
  skirts: 'f2a64503-30ac-4ec1-a352-7e37b9155380',
};

// Gender collections (the three gender chips / shop-by-gender routes).
export const GENDERS = {
  men: '9b56c8cd-95f8-4308-bcce-b02fdcdecac8',
  women: '5c922aa5-8dec-4c80-8a55-e8a0336efb85',
  unisex: '351204f7-983d-495b-9563-a352a2b3ce1e',
};

// Set of gender slugs — used to split a product's collection memberships into genders vs subcategories.
export const GENDER_SLUGS = ['men', 'women', 'unisex'];

// Human-readable names by slug (mirrors the Wix collections). Covers every collection.
export const CATEGORY_NAMES = {
  'newest-drops': 'Newest Drops',
  pants: 'Pants',
  sweatshirts: 'Sweatshirts',
  men: 'Men',
  women: 'Women',
  unisex: 'Unisex',
  shirts: 'Shirts',
  henleys: 'Henleys',
  'polo-shirts': 'Polo Shirts',
  'quarter-zips': 'Quarter Zips',
  knitwear: 'Knitwear',
  trousers: 'Trousers',
  chinos: 'Chinos',
  'tailored-pants': 'Tailored Pants',
  blouses: 'Blouses',
  'elegant-tops': 'Elegant Tops',
  skirts: 'Skirts',
};

// The two product groups inside each gender's mega-menu, in display order.
export const MENU_GROUPS = ['Tops', 'Bottoms'];

// --- The taxonomy tree (MEN/WOMEN ▸ TOPS/BOTTOMS ▸ leaf) ---
// V1 collections are FLAT (no parent/child field), so the hierarchy lives here as a code-side map
// keyed by gender slug → group → ordered leaf slugs. getTaxonomy() reads the LIVE gender +
// subcategory collections from Wix and shapes them with this map, so the mega-menu renders from
// the live Wix collections (ids in CATEGORIES) — never a frontend hardcode.
//
// Unisex is intentionally NOT given a Tops/Bottoms tree here: it is surfaced as a flat gender
// (getTaxonomy().unisex) and a product tagged `unisex` may also be cross-listed under Men/Women by
// the frontend if desired. Newest Drops is a cross-cutting curation collection (getTaxonomy().featured),
// not part of the gender tree.
export const TAXONOMY = {
  men: {
    Tops: ['shirts', 'henleys', 'polo-shirts', 'quarter-zips', 'knitwear'],
    Bottoms: ['trousers', 'chinos', 'tailored-pants'],
  },
  women: {
    Tops: ['blouses', 'shirts', 'knitwear', 'elegant-tops'],
    Bottoms: ['trousers', 'tailored-pants', 'skirts'],
  },
};

// Cross-cutting curation collections surfaced as top-level "featured" chips (not inside the gender tree).
export const FEATURED_SLUGS = ['newest-drops'];

// All subcategory (leaf) slugs that participate in the taxonomy tree, deduped across genders/groups.
// Used to classify a product's memberships into `subcategories` and to compute empty-leaf states.
export const SUBCATEGORY_SLUGS = Array.from(
  new Set(
    Object.values(TAXONOMY).flatMap((groups) => Object.values(groups).flat())
  )
);

// Legacy flat-filter display order (back-compat for getCategories()). "Newest Drops" leads; the
// rest follow the brief's original order. getCategories() still returns the flat list in this order
// so any existing flat-filter UI keeps working during the migration to getTaxonomy().
export const CATEGORY_DISPLAY_ORDER = ['newest-drops', 'shirts', 'pants', 'sweatshirts'];

export const STORE_CURRENCY = 'MUR';

// --- Wix Stores V1 REST endpoints used inside queries.js / mutations.js ---
// (Encapsulated here so the frontend never sees a raw URL. The V1 store has managed variants,
//  so adding a catalog item to the cart REQUIRES resolving the chosen Color/Size to a variantId
//  via the variants/query endpoint, then passing catalogReference.options = { variantId }.)
export const V1_VARIANTS_QUERY_URL = (productId) =>
  `https://www.wixapis.com/stores-reader/v1/products/${productId}/variants/query`;

// Wix-managed checkout default return target for the headless redirect session. Must be an
// allowed redirect domain on the OAuth app (localhost:5173 + localhost:4173 today — see
// backend-spec §6 to add a production domain).
export const DEFAULT_POSTFLOW_URL = 'http://localhost:5173';
