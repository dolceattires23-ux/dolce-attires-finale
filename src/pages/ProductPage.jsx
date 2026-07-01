import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { getProductBySlug } from '@backend/queries.js';
import ProductDetail from '../components/ProductDetail.jsx';

// 3.15 — PDP page (/product/:slug). Reads the product from the catalog cache (fetched once at
// root), falling back to getProductBySlug only if absent. null → 404 state.
export default function ProductPage() {
  const { slug } = useParams();
  const pc = useContent('productCard');
  const { getBySlug, productsState } = useCatalog();
  const [state, setState] = useState('loading'); // loading | ready | notfound | error
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let alive = true;
    setState('loading');
    const cached = getBySlug(slug);
    if (cached) {
      setProduct(cached);
      setState('ready');
      return undefined;
    }
    // Not in cache yet — wait for catalog or fetch directly.
    if (productsState === 'loading') return undefined;
    getProductBySlug(slug)
      .then((p) => {
        if (!alive) return;
        if (!p) setState('notfound');
        else {
          setProduct(p);
          setState('ready');
        }
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [slug, getBySlug, productsState]);

  return (
    <main className="pt-16 lg:pt-20">
      <div className="container-site py-10 md:py-16">
        {state === 'loading' && <Skeleton />}
        {state === 'ready' && product && <ProductDetail product={product} />}
        {(state === 'notfound' || state === 'error') && (
          <div className="mx-auto max-w-md py-16 text-center">
            <h1 className="font-display text-[34px]">{pc?.notFoundTitle}</h1>
            <p className="mt-3 text-[15px] text-text-muted">{pc?.notFoundBody}</p>
            <Link to="/men" className="da-btn da-btn-primary mt-6">
              {pc?.notFoundCtaLabel}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[6fr_5fr] lg:gap-14">
      <div className="animate-pulse bg-surface" style={{ aspectRatio: '4 / 5' }} />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse bg-surface" />
        <div className="h-10 w-3/4 animate-pulse bg-surface" />
        <div className="h-6 w-28 animate-pulse bg-surface" />
        <div className="mt-8 h-10 w-full animate-pulse bg-surface" />
        <div className="h-12 w-full animate-pulse bg-surface" />
      </div>
    </div>
  );
}
