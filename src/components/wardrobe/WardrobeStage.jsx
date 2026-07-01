import { lazy, Suspense } from 'react';
import WardrobeStage2D from './WardrobeStage2D.jsx';

const WardrobeStage3D = lazy(() => import('./WardrobeStage3D.jsx'));

const RENDERERS = {
  '2d': WardrobeStage2D,
  '3d': WardrobeStage3D,
};

function Fallback3D() {
  return (
    <div className="flex h-screen items-center justify-center bg-walnut-deep">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
        <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-gold/60">Loading Wardrobe</p>
      </div>
    </div>
  );
}

export default function WardrobeStage({ renderer = '2d', catalogProducts, ...props }) {
  const Renderer = RENDERERS[renderer] || WardrobeStage2D;

  if (renderer === '3d') {
    return (
      <Suspense fallback={<Fallback3D />}>
        <Renderer {...props} catalogProducts={catalogProducts} />
      </Suspense>
    );
  }

  return <Renderer {...props} />;
}
