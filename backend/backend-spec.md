# DA' (Dolce Attires) — Wix Headless Backend Contract

Authoritative contract between the Wix Headless backend and the React frontend.
The frontend imports from `backend/` and follows this contract.

## 0. Status

- Wix project: `dolce-attires` (metaSiteId `fd7f4afe-fd6d-4ba3-a780-6dd964351df3`), namespace HEADLESS.
- Headless client ID: `VITE_WIX_CLIENT_ID` = `753bcac1-37a2-47fc-92fd-32d9e0bc51b1` — **set** in `.env`. Redirect domains: localhost:5173 + localhost:4173 only.
- Payment currency: **MUR**.
- Backend mode: **CMS (5 collections) + Wix Stores catalog (Catalog V1) + eCommerce cart/checkout + working PRE-ORDER flow + gender/subcategory taxonomy**, on a Headless project.
- **Catalog version is V1** with **managed variants**. Product reads use the V1 Stores REST API (wired inside `queries.js`). Cart/checkout/pre-order use `@wix/ecom` (`currentCart` + `checkout`) + `@wix/redirects`. **You do not need to know any of this** — call the functions below.
- **Catalogue (5 products live):**
  1. All 5 products exist on Catalog V1 with managed Color×Size variants. **`getProducts()` returns 5 products and `getProductBySlug()` resolves all 5 slugs.**
  2. Each is mapped into its gender/subcategory/legacy collections, so **Trousers** and the **Unisex** gender are **populated**.
  3. The mislabeled product (slug `essential-linen-shirt-short-sleeve`, formerly named "Essential Linen Shirt (Long-Sleeve)" on Wix) was **renamed** to "Essential Linen Shirt — Short Sleeve"; its slug is unchanged.
  4. `constants.PRODUCTS` now holds the current live GUIDs only (old 404 GUIDs dropped). `LIVE_PRODUCT_SLUGS` = all 5 slugs.
- **Changed 2026-06-10 (gender + subcategory taxonomy):**
  1. `getProducts()` and `getProductBySlug()` return three **additive fields** per product: `genders`, `subcategories`, `taxonomy` (existing fields unchanged). See §2.
  2. **`getTaxonomy()`** — powers the dynamic gender ▸ Tops/Bottoms ▸ subcategory mega-menu. See §2.
  3. `getCategories()` is **kept** (back-compat flat list) but `getTaxonomy()` is the primary nav/filter source.
  4. 13 V1 Stores collections (3 gender + 10 subcategory). Full IDs in `schema/collections.json`.
- **Earlier:** `addToCart` resolves `{Color,Size}` → managed variant id; pre-order flow (`placePreorder` / `submitPreorder` + `Preorders` collection).

> ### Live-store status — RESOLVED (2026-06-10)
> The earlier live-store drift (only 2 of 5 products existed) is **resolved**. All 5 products are live; build the grid + menu **purely from what `getProducts()` / `getTaxonomy()` return** — never hardcode a product or a count. The only intentionally empty taxonomy leaves now are the by-design ones (see §1).

## 1. Data model

### CMS collections
| Collection | Field | Type | Permissions | Item count |
|------------|-------|------|-------------|-----------|
| `Reviews` | reviewerName / rating / reviewBody / reviewDate / avatarInitial / source | TEXT / NUMBER / TEXT / DATE / TEXT / TEXT | read ANYONE, write ADMIN | **0 (empty by design)** |
| `EmailSignups` | email / submittedAt / sourceSection | TEXT / DATETIME / TEXT | insert ANYONE, read ADMIN | 0 |
| `ContactSubmissions` | name / email / message / submittedAt | TEXT / TEXT / TEXT / DATETIME | insert ANYONE, read ADMIN | 0 |
| `Preorders` | productSlug / productName / productId / variantId / color / size / quantity / priceMUR / customerName / email / phone / note / wixOrderId / status / submittedAt | TEXT… / NUMBER / DATETIME | insert ANYONE, read ADMIN | 0 |
| `SiteImages` | section / slot / image / alt / caption | TEXT / NUMBER / MEDIA_IMAGE / TEXT / TEXT | read ANYONE, write ADMIN | 3 (image fields empty) |

### Stores catalog (Catalog V1, **managed variants**, currency MUR) — ALL 5 products LIVE
| Product (slug) | Live? | Price (MUR) | Colors | Sizes | Variants | Genders | Subcategories |
|----------------|-------|-------------|--------|-------|----------|---------|---------------|
| essential-linen-shirt-short-sleeve | ✅ | 1170 | Cream, White, Navy, Black, Light Blue | S–XL | 20 | men, women | shirts |
| linen-shirt-long-sleeve | ✅ | 1170 | Cream, White, Navy, Black | S–XL | 16 | men, women | shirts |
| linen-pants | ✅ | 1470 | Cream, Navy, Black, Light Blue | S–XL | 16 | men, women | trousers |
| striped-pants-unisex | ✅ | 1470 | Navy, Black | S–XL | 8 | unisex | trousers |
| quarter-zip-sweatshirt | ✅ | 1470 | Cream, Navy, Black | S–XL | 12 | men, women | quarter-zips, knitwear |

All live variants are perpetually in-stock/orderable (inventory tracking off — no fabricated stock). Color hex is shared across the catalog (Cream `#F5F0E8`, White `#FFFFFF`, Navy `#1B2A4A`, Black `#1A1A1A`, Light Blue `#A8C4D4`). Full IDs in `backend/schema/collections.json`.

### Collections / taxonomy (all are V1 Stores collections — V1 has no native hierarchy)
**Gender** (3): `men` · `women` · `unisex`.
**Subcategory leaves** (11): `shirts` (reused) · `henleys` · `polo-shirts` · `quarter-zips` · `knitwear` · `trousers` · `chinos` · `tailored-pants` · `blouses` · `elegant-tops` · `skirts`.
**Legacy / curation** (kept, not deleted): `newest-drops` (featured) · `pants` · `sweatshirts`.

The MEN/WOMEN ▸ TOPS/BOTTOMS ▸ leaf hierarchy is a **backend convention** (the `TAXONOMY` map in `constants.js`, mirrored in `schema/collections.json`), shaped over the live collections by `getTaxonomy()`:
```
MEN   Tops: Shirts, Henleys, Polo Shirts, Quarter Zips, Knitwear   Bottoms: Trousers, Chinos, Tailored Pants
WOMEN Tops: Blouses, Shirts, Knitwear, Elegant Tops                Bottoms: Trousers, Tailored Pants, Skirts
```
**Empty today (by design — render an intentional empty state, never fabricate products):** `henleys`, `polo-shirts`, `chinos`, `tailored-pants`, `blouses`, `elegant-tops`, `skirts`. **Non-empty:** `shirts` (2), `quarter-zips` (1), `knitwear` (1), `trousers` (2), `men` (4), `women` (4), `unisex` (1), `newest-drops` (2).

> Counts come from real product memberships (V1's `numberOfProducts` counter is unreliable — reads 0). `getTaxonomy().…​.productCount` is computed, authoritative, and correctly 0 for the by-design empty leaves.

## 2. Frontend wiring — per dynamic section

Import all functions from `backend/` (see §4). Every function is `async` and **throws** a typed `Error` on failure — wrap calls and render an error state.

| Brief §2 section | Function | Returns / Accepts | States to render |
|------------------|----------|-------------------|------------------|
| **nav mega-menu + gender/subcategory filters (§3.4 / §3.6) — PRIMARY** | **`getTaxonomy()`** | `{ genders: [ { slug, name, productCount, groups: [ { name:'Tops'\|'Bottoms', subcategories:[ { slug, name, productCount } ] } ] } ], unisex: { slug, name, productCount }\|null, featured: [ { slug, name, productCount } ] }` | loading → menu skeleton; render gender columns → Tops/Bottoms groups → leaf links; a leaf with `productCount: 0` renders muted / "coming soon"; error → degrade to flat `getCategories()` or hide menu |
| `shop` legacy flat filter row (§3.4, optional/back-compat) | `getCategories()` | `Array<{ id, name, slug }>` (flat: legacy + gender + subcategory + featured, ordered) | loading → chips; render your own "All" chip first; error → "All" only |
| `shop` (product grid, §3.4) | `getProducts()` | `Array<{ id, slug, name, description, price, currency, inStock, image, categories[], genders[], subcategories[], taxonomy[], options[], variants[] }>` | loading → grid; **returns 5 products**; error → retry |
| `product-card` / PDP (§3.5) | `getProductBySlug(slug)` | one product object (same new fields) or **`null`** if not found | loading; not-found (null) → 404; error |
| **PDP add-to-cart** (§3.5) | **`addToCart({ productId, options, quantity })`** — `options` is `{ Color, Size }` display names from the chosen variant, e.g. `{ Color: "Navy", Size: "M" }` | `{ cartId, itemCount }` — itemCount increments to 1+ | disabled until both Color + Size chosen; success → toast + refresh cart count; error |
| `nav` cart (count + drawer) | `getCart()` | `{ id, lineItems[], itemCount, currency }` (empty cart is a normal, non-error result) | empty cart; populated drawer; error |
| cart → checkout (nav/drawer CTA) | `getCheckoutUrl({ postFlowUrl })` → `window.location = checkoutUrl` | `{ checkoutUrl, checkoutId }` (single-use hosted URL) | disabled while pending; error. See pre-order note. |
| **PDP "Pre-order now" (PRIMARY)** | **`placePreorder({ productId, productSlug, productName, priceMUR, options, quantity, customer:{name,email,phone}, address?, note?, postFlowUrl? })`** | `{ checkoutUrl, checkoutId, preorderId }` → redirect | collect `customer.email` + Color/Size first; disabled while pending; success → redirect; error |
| **"Reserve / Pre-order" (FALLBACK, no redirect)** | **`submitPreorder({ productSlug, productName, productId, variantId?, options, quantity, priceMUR, customer:{name,email,phone}, note? })`** | `{ id }` | input → pending → "Pre-order received" message; error inline |
| `reviews` (Google-review UI, §3.8) | `getReviews()` | `Array<{ id, reviewerName, rating, reviewBody, reviewDate, avatarInitial, source }>` | **empty `[]` is expected today** — render the empty Google-review state; never fabricate. loading; error |
| `contact` newsletter (§3.9) | `submitNewsletter({ email, sourceSection })` | `{ id }` | input → pending → success; error inline |
| `contact` message (§3.9, optional) | `submitContactForm({ name, email, message })` | `{ id }` | pending → success; error inline |
| Hero photo (§3.2) + Editorial "A New Path" photos (§3.6) | `getSiteImages()` | `Array<{ section, slot, imageUrl, alt, caption }>` — `section` is `hero`\|`editorial`, `slot` 1-based; `imageUrl` null until the client uploads in the Wix CMS | read once on load; render the CMS `imageUrl` when set, else the bundled fallback |

### New product fields — how to use them (concrete)
Every product from `getProducts()`/`getProductBySlug()` carries:
- **`genders: string[]`** — subset of `['men','women','unisex']`. Filter the grid by gender chip via `product.genders.includes(activeGender)`.
- **`subcategories: string[]`** — leaf slugs, e.g. `['shirts']` or `['quarter-zips','knitwear']`. Filter by a chosen subcategory via `product.subcategories.includes(activeLeaf)`.
- **`taxonomy: Array<{ gender, group, subcategorySlug, subcategoryName }>`** — the resolved menu paths this product sits under (e.g. quarter-zip → `{men,Tops,quarter-zips}`, `{men,Tops,knitwear}`, `{women,Tops,knitwear}`). Use it for breadcrumbs / "shown under" labels.
- **`categories: string[]`** — UNCHANGED: every collection slug the product is in (incl. gender + legacy). Back-compat for the flat filter.

**Mega-menu wiring (concrete):** call `getTaxonomy()` once on mount. Render a column per `genders[]` entry; under each, the `groups[]` (Tops, then Bottoms); under each group, its `subcategories[]` as links to `?gender=<slug>&sub=<leafSlug>`. Show `unisex` as its own flat entry and `featured` (Newest Drops) as a lead chip. Filtering the grid is **client-side** against `getProducts()` using `genders`/`subcategories` — no re-fetch on menu change. A leaf with `productCount === 0` should look intentional (muted, "coming soon", or disabled), not broken.

### Pre-order — how it works (read before building the PDP CTA)
The store has **no card processor connected**. Pre-orders go through the **real Wix Store/eCommerce flow**, recorded as a Wix order with `paymentStatus = NOT_PAID` (the pre-order).

- **PRIMARY (`placePreorder` or cart → `getCheckoutUrl`)** — returns the Wix-hosted checkout URL; redirect the browser there. The buyer finalizes with the store's **Manual Payment** method. `placePreorder` ALSO writes a `Preorders` row first (intent captured even if abandoned). Use `placePreorder` for a single-variant PDP "Pre-order now"; `getCheckoutUrl` for the cart CTA.
- **FALLBACK (`submitPreorder`)** — pure CMS capture, no redirect, no payment provider needed. Always works with the public client ID. Use it for a one-click "Reserve" or until Manual Payment is enabled (§6.1).

> **Auth:** Do NOT call any Wix order/checkout/collection API from the frontend — admin-scoped calls would 403 with the public client ID. Only call the `backend/` functions. Order creation happens server-side when the buyer completes the hosted checkout.

Product image: each product object carries `image` (Wix Stores media URL or `null`). Product images were not uploaded to Wix Media (see §6), so the storefront should render the local fallback from `PRODUCT_IMAGE_FALLBACK` (in `constants.js`) keyed by slug when `image` is null. WhatsApp `wa.me/23059102655` stays a plain client-side deep link (no backend).

## 3. npm dependencies

```
@wix/sdk
@wix/ecom
@wix/redirects
@wix/data
```
Install latest stable (`npm i @wix/sdk @wix/ecom @wix/redirects @wix/data`). `@wix/ecom` provides both `currentCart` and `checkout`. `@wix/stores` is **not** required — product, category, gender, and subcategory reads all use the V1 REST API inside `backend/queries.js`. Do **not** add `@wix/site-*` packages.

## 4. Import path

`backend/` sits at the repo root, a sibling of `src/`. Import directly:

```js
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getTaxonomy,   // dynamic gender/subcategory mega-menu
  getReviews,
  getCart,
  getSiteImages,
} from '../backend/queries.js';
import {
  addToCart,
  getCheckoutUrl,
  placePreorder,
  submitPreorder,
  submitNewsletter,
  submitContactForm,
} from '../backend/mutations.js';
```

Or add a Vite alias in `vite.config.js` (optional):
```js
resolve: { alias: { '@backend': path.resolve(__dirname, 'backend') } }
// then: import { getTaxonomy } from '@backend/queries.js';
```

## 5. Environment variables

- `VITE_WIX_CLIENT_ID` — public headless OAuth client ID, safe in the browser bundle (already in `.env`; documented in `backend/.env.example`).
- No admin secret ships to the frontend. `WIX_SITE_ID` is in `.env` for admin use only and is **not** `VITE_`-prefixed — never import it into client code.

## 6. Outstanding manual steps

1. **Enable the Manual Payment method (pre-order finalization)** — *required for the PRIMARY self-serve pre-order path to complete online.* No public API connects/enables a payment method (Site Payment Method Types API is read-only; connected-methods list is empty, re-verified). Dashboard: **Settings → Accept Payments → Manual Payment Method**. Until then the hosted checkout loads but offers no finalize option; `Preorders` (`submitPreorder`/`placePreorder`) is the working capture channel.
2. **Product images on Wix Media** — uploaded for all 5 products and attached as each product's main media. The storefront reads `product.image` from the Wix media URL; there is no local image fallback.
3. **Real Google reviews** — `Reviews` empty by design. Client supplies real reviews; seed them later.
4. **Price / color / stock confirmation** — prices caption-sourced; color lists the conservative caption subset; inventory tracking off. Client to confirm. (Note: `quarter-zip-sweatshirt` has a pre-existing `priceData.price` of 800 on Wix vs the recorded 1470 list price — left untouched; client to reconcile if needed.)
5. **Delivery / shipping policy** — a default "Free shipping / International" region exists and auto-selects at checkout. Client refines later (CLIENT.md Q4).
6. **Custom domain** — optional; billing + DNS ownership. Not done.

### Catalogue status
- ✅ **All 5 products live** — `linen-shirt-long-sleeve`, `linen-pants`, `striped-pants-unisex` (plus the two originals) on Catalog V1 with managed Color×Size variants, each mapped into its gender/subcategory/legacy collections. Store is 5/5 live; Trousers + Unisex populated.
- ✅ **Product name fix** — the product with slug `essential-linen-shirt-short-sleeve` was renamed from "Essential Linen Shirt (Long-Sleeve)" to "Essential Linen Shirt — Short Sleeve" (slug unchanged).

## 7. Implementation notes

- Build the nav mega-menu + gender/subcategory filters from `getTaxonomy()` — never hardcode genders, groups, leaves, or counts. `getCategories()` remains for any legacy flat filter.
- Filter the grid client-side by `product.genders` / `product.subcategories` (and the legacy `product.categories`); no re-fetch on menu/chip change. A product can appear under multiple genders/leaves.
- The by-design empty leaves (henleys, polo-shirts, chinos, tailored-pants, blouses, elegant-tops, skirts) and an empty `getReviews()` are the normal current state — render intentional empty states; never fabricate products, counts, or reviews. Trousers + Unisex are now populated.
- `addToCart` / `placePreorder` / `submitPreorder` need the exact `{ Color, Size }` display names the user selected (matching `variants[].choices`). Gate the CTA until both are chosen; the backend resolves the managed variant id.
- For the Color swatch UI, `options[].choices[].value` is the hex code and `.name` is the display label. Hex is consistent across the catalog (same color name → same hex).
- Until §6.1 (Manual Payment) is done, prefer surfacing `submitPreorder` as the primary CTA copy ("Pre-order — we'll confirm by email/WhatsApp"); switch the headline CTA to the hosted-checkout path once Manual Payment is live.
