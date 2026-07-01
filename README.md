# DA' (Dolce Attires) — Storefront

E-commerce storefront for **DA' (Dolce Attires)**, a Mauritius-based direct-to-consumer
minimalist-linen apparel brand. A **React + Vite** frontend on a **Wix Headless** backend
(Wix Stores catalogue + Wix eCom cart/checkout + Wix Forms + Wix CMS), with an immersive
3D "Wardrobe" shopping experience.

Everything the storefront shows or does — products, images, cart, checkout, forms — comes
from Wix at runtime. There is no static/hardcoded product data.

---

## Stack

- **React 18 + Vite 5** (JavaScript, no TypeScript)
- **Tailwind CSS** + brand CSS variables
- **GSAP** + **Lenis** (motion / smooth scroll), **three.js / @react-three** (3D wardrobe)
- **Wix Headless** via `@wix/sdk`, `@wix/ecom`, `@wix/redirects`, `@wix/data`
  - The integration layer lives in [`backend/`](backend/); the frontend imports it via the
    `@backend` path alias and never calls the Wix SDK/REST API directly.

---

## Quick start

**Prerequisites:** Node.js 18+ and npm.

```bash
cp .env.example .env      # the public Wix client ID is already filled in
npm install
npm run dev               # http://localhost:5173
```

Then open the printed URL (5173, or 4173 — see the note below).

> **Transferring across machines?** `node_modules/` contains OS-specific binaries
> (esbuild, rollup, etc.). After unzipping on a different OS, delete `node_modules/`
> and run `npm install` again.

### Ports matter

Run on **`5173`** (dev) or **`4173`** (preview) — these are the only two domains registered
as Wix OAuth redirect domains, so Wix auth + the hosted checkout only work there.

```bash
npm run dev                                  # dev server on 5173
npm run build && npm run preview -- --port 4173   # production preview on 4173
```

If port 5173 is busy, run dev on 4173 explicitly: `npm run dev -- --port 4173 --strictPort`.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_WIX_CLIENT_ID` | ✅ | **Public** Wix Headless OAuth client ID — browser-safe. The only variable the app needs. |

No admin key or secret is ever used by the frontend. (`WIX_SITE_ID` is recorded in
[`backend/.env.example`](backend/.env.example) for reference/admin use only — it is **not**
`VITE_`-prefixed and is never imported into client code.)

---

## Project structure

```
.
├── index.html                # Vite entry; loads /src/main.jsx
├── vite.config.js            # React plugin + the "@backend" -> ./backend alias
├── tailwind.config.js
├── .env / .env.example       # VITE_WIX_CLIENT_ID
├── public/
│   ├── content.json          # SERVED site copy/imagery config (fetched at runtime)
│   └── brand_assets/         # local brand images (hero/editorial/wardrobe)
├── data/
│   └── content.json          # EDITING SOURCE for content.json (copy to public/ to publish)
├── src/
│   ├── main.jsx, App.jsx     # app root + routes
│   ├── context/              # CatalogContext (products), CartContext (Wix cart)
│   ├── pages/                # Home, ShopPage, ProductPage, CartPage, About, Contact, Wardrobe
│   ├── components/           # Nav, Hero, ProductDetail, CartDrawer, PreorderModal, etc.
│   ├── hooks/                # useContent, useReveal, useLenis, useSiteImages, ...
│   └── lib/                  # assets.js (formatting + cart/line helpers)
└── backend/                  # Wix Headless integration layer (see below)
    ├── wix-client.js         # shared Wix SDK client + visitor-session persistence
    ├── queries.js            # READ functions (products, taxonomy, reviews, cart, images)
    ├── mutations.js          # WRITE functions (cart, checkout, forms)
    ├── constants.js          # IDs: products, collections, taxonomy, form IDs, currency
    ├── backend-spec.md       # the full backend contract
    └── schema/collections.json
```

---

## How the Wix integration works

The frontend imports named functions from `backend/` (alias `@backend`). All of them return
plain, frontend-ready objects and throw typed errors on failure.

### Catalogue (Wix Stores — Catalog V1)
- `getProducts()` / `getProductBySlug(slug)` — products with price, variants, options, and the
  Wix Media image URL. Loaded once at app root into **`CatalogContext`**.
- `getTaxonomy()` / `getCategories()` — the gender ▸ Tops/Bottoms ▸ subcategory mega-menu,
  built from live Wix collections (no hardcoded categories).
- Product images are uploaded to **Wix Media** and served from `static.wixstatic.com`.

### Cart (Wix eCom `currentCart`)
Managed in **`CartContext`**, backed entirely by the Wix cart:
- `addToCart({ productId, options, quantity })` — resolves the chosen Color/Size to the
  managed variant id, then adds to the visitor's Wix cart.
- `updateCartLineQuantity(lineId, qty)` / `removeCartLine(lineId)` — update the Wix cart.
- `getCart()` — reads the visitor's current Wix cart (used on load + after every change).
- **Session persistence:** `wix-client.js` stores the Wix visitor's OAuth tokens in
  `localStorage` (`ensureVisitorSession()`), so the **same visitor — and their cart — survives
  page reloads and return visits.**

### Checkout (Wix-hosted)
- `getCheckoutUrl()` creates a checkout from the current Wix cart and returns a single-use
  Wix-hosted checkout URL. The cart page's **"Proceed to Pre-Order"** redirects the browser to it.
- The buyer completes the order on Wix's hosted checkout page. See **Outstanding setup** for the
  one dashboard step needed to accept payment.

### Forms (Wix Forms API)
The newsletter, contact, and pre-order forms submit through the **Wix Forms Submissions API**:
- `submitNewsletter({ email })`, `submitContactForm({ name, email, message })`,
  `submitPreorder({ ... })`.
- Each submission triggers that form's **owner-notification automation**, so the store owner is
  emailed on every signup / message / pre-order. (Form IDs live in `backend/constants.js`.)

### Reviews & editable images (Wix CMS)
- `getReviews()` — Google-style reviews from the `Reviews` CMS collection (empty until real
  reviews are added; the UI renders an intentional empty state — no fabricated reviews).
- `getSiteImages()` — optional client-editable hero/editorial images from the `SiteImages`
  collection (falls back to the bundled brand assets when a slot is empty).

---

## The Wix backend

- **Wix project:** `Dolce Attires` — site ID `fd7f4afe-fd6d-4ba3-a780-6dd964351df3`, currency **MUR**.
- **Catalogue:** 5 products live on Wix Stores (Catalog V1, managed Color×Size variants), each
  with an image in Wix Media and mapped into gender/subcategory/legacy collections.
- **Forms:** Newsletter, Contact, Pre-order (Wix Forms app), each with an active owner-notification
  automation.
- Full contract: [`backend/backend-spec.md`](backend/backend-spec.md). Provisioned IDs:
  [`backend/schema/collections.json`](backend/schema/collections.json).

---

## Editing site content

Marketing copy and section imagery are defined in **`content.json`**:
- Edit **`data/content.json`** (the source), then copy it to **`public/content.json`** to publish
  (`public/content.json` is what the app fetches at runtime).
- Product data, prices, images, and reviews are **not** here — those are managed in the Wix
  dashboard (Stores + CMS) and load live.

---

## Outstanding setup (Wix dashboard — no code)

1. **Enable a payment method** so checkout can be completed. The cart hands off to the Wix hosted
   checkout, but to actually take payment the store needs a payment method enabled
   (*Wix dashboard → Settings → Accept Payments* — a Manual / bank-transfer method suits
   made-to-order pre-orders). It's currently a **development store**, so real card payments are in
   test mode until it's on a paid plan.
2. **Pre-order / contact autoresponder** (the customer "thank-you" email): create the email
   template in *Wix dashboard → Automations* (trigger **Wix Forms → Form submitted**, action
   **Send an email** to the submitter). The **owner notification already works**.
3. **Production domain:** before hosting remotely, add the production URL as an allowed Wix OAuth
   redirect domain (currently only `localhost:5173` and `localhost:4173` are registered) and set
   `VITE_WIX_CLIENT_ID` in the host's environment.

---

## Build & deploy

```bash
npm run build     # outputs static assets to dist/
npm run preview -- --port 4173   # preview the production build locally
```

Deploy `dist/` to any static host (Vercel, Netlify, etc.). Remember to:
- set `VITE_WIX_CLIENT_ID` in the host's environment, and
- add the deployed domain as an allowed Wix OAuth redirect domain (see Outstanding setup #3).

---

## Troubleshooting

- **`'vite' is not recognized` / native binary errors after copying between machines** — delete
  `node_modules/` and run `npm install` (binaries are OS-specific).
- **Cart looks empty after a refresh** — make sure the browser allows `localStorage` (the Wix
  visitor session is stored there); private-mode/blocked storage prevents cart persistence.
- **Wix auth / checkout fails** — confirm you're running on port **5173** or **4173** (the only
  registered redirect domains).
- **Products don't load** — check `VITE_WIX_CLIENT_ID` is set in `.env` and the dev server was
  restarted after creating `.env`.
