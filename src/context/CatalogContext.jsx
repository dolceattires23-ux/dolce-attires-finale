import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProducts, getCategories, getTaxonomy } from '@backend/queries.js';

// Catalog state — products + taxonomy + (legacy) categories fetched once at app root
// (backend-spec §2/§7: getTaxonomy() is the PRIMARY dynamic source for the mega-menu and the
// gender/subcategory filters; getProducts() once for the grid; filtering is client-side, no
// re-fetch on chip change). getCategories() is kept only as a back-compat degrade target.
// Shared by the nav mega-menu, the shop pages, and the PDP (reads from this cache by slug,
// falling back to getProductBySlug only if absent).

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [taxonomy, setTaxonomy] = useState(null);
  const [categories, setCategories] = useState([]);
  const [productsState, setProductsState] = useState('loading'); // loading | ready | error
  const [taxonomyState, setTaxonomyState] = useState('loading'); // loading | ready | error
  const [productsError, setProductsError] = useState(null);

  const loadProducts = useCallback(async () => {
    setProductsState('loading');
    setProductsError(null);
    try {
      // Single source of truth: the live Wix Stores catalogue. No static/local fallback —
      // if Wix fails the grid shows an honest error state, never fabricated products.
      const list = await getProducts();
      setProducts(list);
      setProductsState('ready');
    } catch (err) {
      setProducts([]);
      setProductsError(err?.message || 'Could not load products from Wix.');
      setProductsState('error');
    }
  }, []);

  const loadTaxonomy = useCallback(async () => {
    setTaxonomyState('loading');
    try {
      const tax = await getTaxonomy();
      setTaxonomy(tax);
      setTaxonomyState('ready');
    } catch (err) {
      // Degrade: try the flat list; if that also fails the nav hides the mega-menu (backend-spec §2).
      setTaxonomy(null);
      setTaxonomyState('error');
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch {
        setCategories([]);
      }
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadTaxonomy();
  }, [loadProducts, loadTaxonomy]);

  const getBySlug = useCallback((slug) => products.find((p) => p.slug === slug) || null, [products]);

  const value = useMemo(
    () => ({
      products,
      taxonomy,
      categories,
      productsState,
      taxonomyState,
      productsError,
      reloadProducts: loadProducts,
      getBySlug,
    }),
    [products, taxonomy, categories, productsState, taxonomyState, productsError, loadProducts, getBySlug]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider');
  return ctx;
}
