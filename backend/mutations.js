// backend/mutations.js
// Typed WRITE functions for the DA' storefront. Each returns a frontend-ready result and
// throws a typed Error on failure. Import these by name; they wrap the Wix SDK and the
// Wix REST API so the frontend never calls them directly.
//
// The newsletter, contact, and pre-order forms submit through the Wix Forms Submissions API.
// Each submission triggers the live owner-notification automation on the matching Wix form,
// so the store owner is emailed on every signup / message / pre-order.
//
// Catalog is Wix Stores **Catalog V1 with MANAGED variants** (product.manageVariants === true).
// For a managed-variant V1 store, a cart/checkout catalog line item MUST reference the chosen
// variant by id: catalogReference = { appId, catalogItemId: <productId>, options: { variantId } }.
// The previous double-nested shape ({ options: { Color, Size } }) is the NON-managed-variant
// form and resolves to ZERO line items on this store — that was the addToCart defect. We now
// resolve the chosen { Color, Size } to a variantId via the V1 variants/query endpoint first.
//
// Docs grounding:
//   - V1 eCommerce integration (managed variants -> options.variantId):
//       https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/e-commerce-integration
//   - V1 query product variants (choices -> variantId):
//       https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v1/catalog/query-product-variants
//   - add to current cart:
//       https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart/add-to-current-cart
//   - create checkout (from line items, with buyer/billing/shipping):
//       https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/checkout/checkout/create-checkout
//   - create checkout from current cart:
//       https://dev.wix.com/docs/sdk/backend-modules/ecom/current-cart/create-checkout-from-current-cart
//   - create redirect session (hosted checkout URL):
//       https://dev.wix.com/docs/api-reference/business-management/headless/redirects/create-redirect-session?apiView=SDK
//   - data items insert:
//       https://dev.wix.com/docs/api-reference/business-solutions/cms/skills/cms-data-items-crud

import { wixClient } from './wix-client.js';
import { normalizeCart } from './queries.js';
import {
  COLLECTIONS,
  STORES_APP_ID,
  STORE_CURRENCY,
  V1_VARIANTS_QUERY_URL,
  DEFAULT_POSTFLOW_URL,
  FORM_IDS,
  FORM_SUBMISSIONS_URL,
} from './constants.js';

// ---------------------------------------------------------------------------
// Internal: create a Wix Forms submission. The shared client's fetchWithAuth attaches the
// visitor token + site context. A successful submission triggers that form's owner-notification
// automation (email to the store owner). Returns the new submission id.
// ---------------------------------------------------------------------------
async function createFormSubmission(formId, submissions) {
  const res = await wixClient.fetchWithAuth(FORM_SUBMISSIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission: { formId, submissions } }),
  });
  if (!res.ok) throw new Error(`form submission failed: HTTP ${res.status}`);
  const data = await res.json();
  return data?.submission?.id || null;
}

// ---------------------------------------------------------------------------
// Internal: resolve a managed V1 variant id from the chosen { Color, Size }.
// The V1 choices map is keyed by OPTION NAME -> choice display value, e.g.
// { Color: "Navy", Size: "M" } — exactly the shape product.variants[].choices returns.
// Returns the variant GUID to put in catalogReference.options.variantId.
// ---------------------------------------------------------------------------
async function resolveVariantId(productId, options = {}) {
  // Drop empty keys so a product with only one option still resolves.
  const choices = {};
  for (const [k, v] of Object.entries(options)) {
    if (v !== undefined && v !== null && v !== '') choices[k] = v;
  }
  const res = await wixClient.fetchWithAuth(V1_VARIANTS_QUERY_URL(productId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choices }),
  });
  if (!res.ok) throw new Error(`variant lookup failed: HTTP ${res.status}`);
  const data = await res.json();
  const variants = data.variants || [];
  // Prefer an exact match on every chosen option; fall back to the single result V1 returns.
  const exact = variants.find(
    (v) => v.choices && Object.keys(choices).every((k) => String(v.choices[k]) === String(choices[k]))
  );
  const chosen = exact || (variants.length === 1 ? variants[0] : null);
  const variantId = chosen?.id || chosen?.variantId;
  if (!variantId) {
    throw new Error(
      `no variant found for ${JSON.stringify(choices)} (matched ${variants.length} of ${variants.length})`
    );
  }
  return variantId;
}

/**
 * Add a product variant to the current visitor's cart.
 * FIXED: resolves the chosen { Color, Size } to the V1 managed-variant id and sends the
 * single-level catalogReference.options = { variantId }. Verified live: a real add returns
 * itemCount = 1 with a resolved line item (the old { options: { Color, Size } } returned 0).
 *
 * @param {Object} params
 * @param {string} params.productId   Wix Stores product GUID (from getProducts()/getProductBySlug().id)
 * @param {Object} [params.options]   Selected variant choices, e.g. { Color: "Navy", Size: "M" }
 * @param {number} [params.quantity=1]
 * @returns {Promise<{ cartId: string, itemCount: number }>}
 */
export async function addToCart({ productId, options = {}, quantity = 1 }) {
  if (!productId) throw new Error('[mutations.addToCart] productId is required');
  try {
    const variantId = await resolveVariantId(productId, options);
    const result = await wixClient.currentCart.addToCurrentCart({
      lineItems: [
        {
          quantity,
          catalogReference: {
            appId: STORES_APP_ID,
            catalogItemId: productId,
            // V1 MANAGED variants: single-level options.variantId (NOT options.options.*).
            options: { variantId },
          },
        },
      ],
    });
    return normalizeCart(result?.cart || result);
  } catch (err) {
    throw new Error(`[mutations.addToCart] ${err.message}`);
  }
}

/**
 * Update a Wix cart line item's quantity. Returns the updated normalized cart.
 * @param {string} lineItemId  the cart line `id` (from getCart()/addToCart())
 * @param {number} quantity    new quantity (>= 1)
 * @returns {Promise<Object>} normalized cart
 */
export async function updateCartLineQuantity(lineItemId, quantity) {
  if (!lineItemId) throw new Error('[mutations.updateCartLineQuantity] lineItemId is required');
  try {
    const result = await wixClient.currentCart.updateCurrentCartLineItemQuantity([
      { _id: lineItemId, quantity },
    ]);
    return normalizeCart(result?.cart || result);
  } catch (err) {
    throw new Error(`[mutations.updateCartLineQuantity] ${err.message}`);
  }
}

/**
 * Remove one or more line items from the Wix cart. Returns the updated normalized cart.
 * @param {string|string[]} lineItemId  a cart line id, or an array of them
 * @returns {Promise<Object>} normalized cart
 */
export async function removeCartLine(lineItemId) {
  const ids = Array.isArray(lineItemId) ? lineItemId : [lineItemId];
  if (!ids.length) throw new Error('[mutations.removeCartLine] lineItemId is required');
  try {
    const result = await wixClient.currentCart.removeLineItemsFromCurrentCart(ids);
    return normalizeCart(result?.cart || result);
  } catch (err) {
    throw new Error(`[mutations.removeCartLine] ${err.message}`);
  }
}

/**
 * Create a Wix-managed checkout from the current cart and return a single-use checkout URL.
 * The frontend should redirect the browser to the returned URL. After checkout, Wix returns
 * the visitor to `postFlowUrl` (must be under an allowed redirect domain — localhost today).
 *
 * This is the PRIMARY pre-order path: the buyer completes the Wix-hosted checkout choosing the
 * store's Manual Payment method (cash / bank transfer / pay-on-delivery), which records a real
 * Wix eCommerce order with paymentStatus NOT_PAID — i.e. the pre-order. The Manual Payment
 * method must be enabled once in the dashboard (no API exists to enable it — see backend-spec §6);
 * until then the hosted page loads but no payment option is offered.
 *
 * @param {Object} [params]
 * @param {string} [params.postFlowUrl] Where Wix returns the visitor after checkout.
 *        Must be an allowed redirect domain. Defaults to the current origin.
 * @returns {Promise<{ checkoutUrl: string, checkoutId: string }>}
 */
export async function getCheckoutUrl({ postFlowUrl } = {}) {
  try {
    const { checkoutId } = await wixClient.currentCart.createCheckoutFromCurrentCart({
      channelType: 'WEB',
    });
    if (!checkoutId) throw new Error('no checkoutId returned from createCheckoutFromCurrentCart');
    return { ...(await buildCheckoutRedirect(checkoutId, postFlowUrl)), checkoutId };
  } catch (err) {
    throw new Error(`[mutations.getCheckoutUrl] ${err.message}`);
  }
}

/**
 * PLACE A PRE-ORDER (primary, single-call PDP path).
 *
 * Builds a Wix checkout directly from one chosen variant (without first populating the current
 * cart), records the customer's pre-order intent in the `Preorders` CMS collection as a
 * guaranteed capture, and returns the Wix-hosted checkout URL for the buyer to finalize the
 * pre-order with the store's Manual Payment method. Use this from a PDP "Pre-order now" button.
 *
 * Flow (all visitor-permitted): resolve variantId -> createCheckout(lineItems + buyer/billing/
 * shipping) -> insert Preorders row -> createRedirectSession -> return hosted checkout URL.
 *
 * The completed hosted checkout becomes the real Wix order (paymentStatus NOT_PAID = pre-order).
 * If the buyer abandons the hosted page, the Preorders row still captured the intent — so a
 * pre-order is NEVER lost. If the dashboard Manual Payment method is not yet enabled, the buyer
 * cannot finalize online; the Preorders row is then the system of record (contact them to confirm).
 *
 * @param {Object} params
 * @param {string} params.productId         product GUID
 * @param {string} [params.productSlug]     product slug (stored for admin readability)
 * @param {string} [params.productName]
 * @param {number} [params.priceMUR]
 * @param {Object} [params.options]         chosen variant choices, e.g. { Color, Size }
 * @param {number} [params.quantity=1]
 * @param {Object} params.customer          { name, email, phone } — email required for checkout
 * @param {Object} [params.address]         { country?, city?, addressLine? } (defaults to MU/Port Louis)
 * @param {string} [params.note]
 * @param {string} [params.postFlowUrl]
 * @returns {Promise<{ checkoutUrl: string, checkoutId: string, preorderId: string }>}
 */
export async function placePreorder({
  productId,
  productSlug = '',
  productName = '',
  priceMUR,
  options = {},
  quantity = 1,
  customer = {},
  address = {},
  note = '',
  postFlowUrl,
} = {}) {
  if (!productId) throw new Error('[mutations.placePreorder] productId is required');
  if (!customer.email) throw new Error('[mutations.placePreorder] customer.email is required');
  try {
    const variantId = await resolveVariantId(productId, options);

    const contactDetails = {
      firstName: (customer.name || 'Customer').split(' ')[0] || 'Customer',
      lastName: (customer.name || '').split(' ').slice(1).join(' ') || 'Pre-order',
      phone: customer.phone || '',
    };
    const addr = {
      country: address.country || 'MU',
      city: address.city || 'Port Louis',
      addressLine: address.addressLine || 'To be confirmed',
    };

    // 1) Create the checkout from the single chosen variant.
    const created = await wixClient.checkout.createCheckout({
      lineItems: [
        {
          quantity,
          catalogReference: { appId: STORES_APP_ID, catalogItemId: productId, options: { variantId } },
        },
      ],
      channelType: 'WEB',
      checkoutInfo: {
        buyerInfo: { email: customer.email },
        billingInfo: { address: addr, contactDetails },
        shippingInfo: { shippingDestination: { address: addr, contactDetails } },
        buyerNote: note || 'PRE-ORDER (manual payment)',
      },
    });
    const checkout = created?.checkout || created;
    const checkoutId = checkout?._id || checkout?.id;
    if (!checkoutId) throw new Error('no checkoutId returned from createCheckout');

    // 2) Guaranteed capture: record the pre-order intent in the Preorders CMS collection.
    let preorderId = null;
    try {
      const inserted = await wixClient.items.insert(COLLECTIONS.PREORDERS, {
        productSlug,
        productName,
        productId,
        variantId,
        color: options.Color || '',
        size: options.Size || '',
        quantity,
        priceMUR: typeof priceMUR === 'number' ? priceMUR : null,
        customerName: customer.name || '',
        email: customer.email,
        phone: customer.phone || '',
        note,
        status: 'PENDING_CHECKOUT',
        submittedAt: new Date(),
      });
      preorderId = inserted?._id || null;
    } catch (_capErr) {
      // Capture is best-effort; never block the checkout redirect on the CMS insert.
      preorderId = null;
    }

    // 3) Hosted checkout URL for the buyer to finalize the pre-order.
    const { checkoutUrl } = await buildCheckoutRedirect(checkoutId, postFlowUrl);
    return { checkoutUrl, checkoutId, preorderId };
  } catch (err) {
    throw new Error(`[mutations.placePreorder] ${err.message}`);
  }
}

/**
 * Submit a pre-order through the Wix Forms API. A one-click "Reserve / Pre-order" that logs the
 * customer's intent and triggers the owner-notification automation on the Pre-order form. Works
 * with the public visitor identity — no payment provider required.
 *
 * @param {Object} params
 * @param {string} params.productSlug (required)
 * @param {string} [params.productName]
 * @param {Object} [params.options] { Color, Size }
 * @param {number} [params.quantity=1] [params.priceMUR]
 * @param {Object} params.customer { name, email, phone } — email required
 * @param {string} [params.note]
 * @returns {Promise<{ id: string }>}
 */
export async function submitPreorder({
  productSlug,
  productName = '',
  options = {},
  quantity = 1,
  priceMUR,
  customer = {},
  note = '',
}) {
  if (!productSlug) throw new Error('[mutations.submitPreorder] productSlug is required');
  if (!customer.email) throw new Error('[mutations.submitPreorder] customer.email is required');
  try {
    const noteWithPrice = [note, typeof priceMUR === 'number' ? `Price: Rs ${priceMUR}` : '']
      .filter(Boolean)
      .join(' | ');
    const id = await createFormSubmission(FORM_IDS.PREORDER, {
      name: customer.name || '',
      email: customer.email,
      phone: customer.phone || '',
      productName,
      productSlug,
      color: options.Color || '',
      size: options.Size || '',
      quantity: Number(quantity) || 1,
      note: noteWithPrice,
    });
    return { id };
  } catch (err) {
    throw new Error(`[mutations.submitPreorder] ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Internal: turn a checkoutId into a single-use Wix-hosted checkout URL.
// ---------------------------------------------------------------------------
async function buildCheckoutRedirect(checkoutId, postFlowUrl) {
  const origin =
    typeof window !== 'undefined' && window.location ? window.location.origin : DEFAULT_POSTFLOW_URL;
  const back = postFlowUrl || origin;
  const { redirectSession } = await wixClient.redirects.createRedirectSession({
    ecomCheckout: { checkoutId },
    callbacks: { postFlowUrl: back, thankYouPageUrl: back, cartPageUrl: origin },
  });
  const url = redirectSession?.fullUrl || redirectSession?.fullURL;
  if (!url) throw new Error('no redirect URL returned from createRedirectSession');
  return { checkoutUrl: url };
}

/**
 * Submit a newsletter signup through the Wix Forms API (§3.9 contact).
 * Triggers the owner-notification automation on the Newsletter form.
 * @param {Object} params
 * @param {string} params.email
 * @returns {Promise<{ id: string }>}
 */
export async function submitNewsletter({ email }) {
  if (!email) throw new Error('[mutations.submitNewsletter] email is required');
  try {
    const id = await createFormSubmission(FORM_IDS.NEWSLETTER, { email });
    return { id };
  } catch (err) {
    throw new Error(`[mutations.submitNewsletter] ${err.message}`);
  }
}

/**
 * Submit a contact message through the Wix Forms API (§3.9 contact).
 * Triggers the owner-notification automation on the Contact form.
 * @param {Object} params
 * @param {string} params.message  (required)
 * @param {string} [params.name]
 * @param {string} params.email    (required by the Wix Contact form)
 * @returns {Promise<{ id: string }>}
 */
export async function submitContactForm({ name = '', email = '', message }) {
  if (!message) throw new Error('[mutations.submitContactForm] message is required');
  try {
    const id = await createFormSubmission(FORM_IDS.CONTACT, { name, email, message });
    return { id };
  } catch (err) {
    throw new Error(`[mutations.submitContactForm] ${err.message}`);
  }
}

// Keep STORE_CURRENCY referenced for tooling that imports it via mutations (no-op export note).
export { STORE_CURRENCY };
