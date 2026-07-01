// backend/wix-client.js
// Shared Wix Headless SDK client for the DA' (Dolce Attires) React + Vite storefront.
//
// Auth model: public OAuth client ID only (VITE_WIX_CLIENT_ID). This is safe to ship in
// the browser bundle. NO admin key, NO secret is ever imported here. Import the named
// functions from queries.js / mutations.js.
//
// IMPORTANT — catalog version: this site runs Wix Stores **Catalog V1** (Catalog V1 confirmed
// via GET /stores/v3/provision/version -> "V1_CATALOG"). Product reads
// therefore use the V1 Stores REST API through the authenticated client's `fetchWithAuth`,
// NOT the V3-only `@wix/stores` `productsV3` SDK namespace (which fails on a V1 store).
// Cart / checkout use the version-agnostic @wix/ecom Current Cart + @wix/redirects modules.
//
// Reference docs:
//   - createClient + OAuthStrategy: https://dev.wix.com/docs/sdk/articles/set-up-a-client/about-the-wix-client
//   - currentCart:                  https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart/add-to-current-cart?apiView=SDK
//   - redirects:                    https://dev.wix.com/docs/api-reference/business-management/headless/redirects/create-redirect-session?apiView=SDK
//   - data items:                   https://dev.wix.com/docs/api-reference/business-solutions/cms/skills/cms-data-items-crud

import { createClient, OAuthStrategy } from '@wix/sdk';
import { currentCart, checkout } from '@wix/ecom';
import { redirects } from '@wix/redirects';
import { items } from '@wix/data';

// The public headless OAuth client ID (browser-safe). Set in .env as VITE_WIX_CLIENT_ID.
export const WIX_CLIENT_ID = import.meta.env.VITE_WIX_CLIENT_ID;

if (!WIX_CLIENT_ID) {
  // Fail loud in dev so a missing env var is obvious, never silent.
  // eslint-disable-next-line no-console
  console.error(
    '[backend/wix-client] VITE_WIX_CLIENT_ID is not set. Add it to .env (see backend/.env.example).'
  );
}

// --- Visitor session persistence ---------------------------------------------
// Persist the visitor's OAuth tokens (esp. the long-lived refresh token) in localStorage so the
// SAME visitor — and therefore their Wix cart — survives page reloads and return visits. Without
// this the SDK mints a fresh anonymous visitor on every load and the cart would appear empty.
const TOKENS_KEY = 'da_wix_session';

function loadTokens() {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function saveTokens(tokens) {
  try {
    if (typeof localStorage !== 'undefined' && tokens?.refreshToken?.value) {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    }
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// Single shared client for the whole app. Registers every module the storefront uses.
// Rehydrate any stored visitor tokens so a returning visitor keeps their cart.
export const wixClient = createClient({
  auth: OAuthStrategy({ clientId: WIX_CLIENT_ID, tokens: loadTokens() }),
  modules: {
    currentCart, // add to cart, read current cart, create checkout from cart
    checkout,    // checkout entity (used with redirects for the hosted checkout page)
    redirects,   // headless redirect session -> hosted Wix checkout URL
    items,       // CMS data items: Reviews (read), EmailSignups / ContactSubmissions (insert)
  },
});

/**
 * Ensure a stable visitor session exists and is persisted. Rehydrates stored tokens for a
 * returning visitor, or generates + stores a new visitor session on first visit.
 *
 * MEMOIZED: every caller shares one in-flight promise so concurrent callers (the module-load
 * kick-off below + the cart provider) can NEVER mint two different visitors — which would split
 * the cart between visitor identities and make it appear empty after a reload.
 * @returns {Promise<Object|null>} the active tokens (or null on failure)
 */
let _sessionPromise = null;
export function ensureVisitorSession() {
  if (_sessionPromise) return _sessionPromise;
  _sessionPromise = (async () => {
    try {
      let tokens = wixClient.auth.getTokens?.();
      if (!tokens?.refreshToken?.value) {
        tokens = await wixClient.auth.generateVisitorTokens();
        wixClient.auth.setTokens?.(tokens);
      }
      saveTokens(tokens);
      return tokens;
    } catch {
      return null;
    }
  })();
  return _sessionPromise;
}

if (typeof window !== 'undefined') {
  // Kick off session setup at load; the cart provider also awaits the same memoized promise.
  ensureVisitorSession();
}

// Wix Stores app id — required as catalogReference.appId when adding catalog items to the cart.
// From the Wix Stores app configuration.
export const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

export default wixClient;
