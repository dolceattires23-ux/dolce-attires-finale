import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, MeshReflectorMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const WALNUT = '#3a2218';
const WALNUT_LIGHT = '#4d3020';
const WALNUT_DEEP = '#1a0f08';
const GOLD = '#c9a96e';
const GOLD_SOFT = '#d4b982';
const IVORY = '#f5f0e8';
const MARBLE = '#d8d0c4';

// ── Texture loader hook (imperative, no crash on failure) ────────────────
function useImageTexture(url) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!url) { setTexture(null); return; }
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        setTexture(tex);
      },
      undefined,
      () => { if (!cancelled) setTexture(null); }
    );
    return () => { cancelled = true; };
  }, [url]);

  return texture;
}

// ── Room ─────────────────────────────────────────────────────────────────
function WardrobeRoom() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <MeshReflectorMaterial
          blur={[200, 80]}
          resolution={512}
          mixBlur={0.85}
          mixStrength={0.35}
          roughness={0.25}
          depthScale={0.6}
          color={MARBLE}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 3.25, -6]} receiveShadow>
        <planeGeometry args={[20, 6.5]} />
        <meshStandardMaterial color={WALNUT} roughness={0.85} />
      </mesh>
      <mesh position={[-10, 3.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 6.5]} />
        <meshStandardMaterial color={WALNUT} roughness={0.85} />
      </mesh>
      <mesh position={[10, 3.25, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 6.5]} />
        <meshStandardMaterial color={WALNUT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 6.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color={WALNUT_LIGHT} roughness={0.9} />
      </mesh>
      <CrownMolding />
    </group>
  );
}

function CrownMolding() {
  const mat = useMemo(() => ({ color: GOLD, metalness: 0.6, roughness: 0.3 }), []);
  return (
    <group>
      <mesh position={[0, 6.3, -5.95]}><boxGeometry args={[20, 0.15, 0.12]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[-9.95, 6.3, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[14, 0.15, 0.12]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[9.95, 6.3, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[14, 0.15, 0.12]} /><meshStandardMaterial {...mat} /></mesh>
      <mesh position={[0, 0.05, -5.95]}><boxGeometry args={[20, 0.1, 0.08]} /><meshStandardMaterial {...mat} /></mesh>
    </group>
  );
}

// ── Cabinet ──────────────────────────────────────────────────────────────
function WardrobeCabinet({ position, width = 2.4, height = 5.2, depth = 0.8 }) {
  const t = 0.06;
  return (
    <group position={position}>
      <mesh position={[0, height / 2, -depth / 2 + 0.02]} receiveShadow><boxGeometry args={[width, height, 0.04]} /><meshStandardMaterial color={WALNUT_DEEP} roughness={0.75} /></mesh>
      <mesh position={[-width / 2 + t / 2, height / 2, 0]} castShadow><boxGeometry args={[t, height, depth]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.65} /></mesh>
      <mesh position={[width / 2 - t / 2, height / 2, 0]} castShadow><boxGeometry args={[t, height, depth]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.65} /></mesh>
      <mesh position={[0, height, 0]} castShadow><boxGeometry args={[width, t, depth]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.65} /></mesh>
      <mesh position={[0, 0.08, 0]}><boxGeometry args={[width, 0.16, depth]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.65} /></mesh>
      <mesh position={[0, height + 0.04, 0]}><boxGeometry args={[width + 0.04, 0.05, depth + 0.04]} /><meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} /></mesh>
      {/* Hanging rod */}
      <mesh position={[0, height * 0.75, -depth / 4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, width - 0.2, 16]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Shelf */}
      <mesh position={[0, height * 0.42, 0]}><boxGeometry args={[width - 0.14, 0.04, depth - 0.06]} /><meshStandardMaterial color={WALNUT_LIGHT} roughness={0.65} /></mesh>
      {/* Cabinet spot */}
      <pointLight position={[0, height * 0.95, 0]} intensity={0.6} color="#ffeedd" distance={3} decay={2} />
    </group>
  );
}

// ── Hanging garment with product image texture ───────────────────────────
function HangingGarment({ position, imageUrl, fallbackColor, onClick, hovered, name }) {
  const meshRef = useRef();
  const [localHover, setLocalHover] = useState(false);
  const isHighlighted = hovered || localHover;
  const baseZ = position[2];
  const texture = useImageTexture(imageUrl);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, isHighlighted ? baseZ + 0.2 : baseZ, delta * 8);
    const mats = Array.isArray(meshRef.current.material) ? meshRef.current.material : [meshRef.current.material];
    for (const m of mats) {
      if (m.emissiveIntensity !== undefined) {
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, isHighlighted ? 0.3 : 0, delta * 8);
      }
    }
  });

  const w = 0.7;
  const h = 0.95;

  return (
    <group>
      {/* Hanger */}
      <mesh position={[position[0], position[1] + 0.08, position[2]]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.14, 0.013, 8, 24, Math.PI]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[position[0], position[1] + 0.21, position[2]]}>
        <cylinderGeometry args={[0.008, 0.008, 0.07, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Garment — textured plane if image loaded, coloured box as fallback */}
      <mesh
        ref={meshRef}
        position={position}
        castShadow
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => { e.stopPropagation(); setLocalHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setLocalHover(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[w, h]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            transparent
            roughness={0.5}
            emissive={GOLD}
            emissiveIntensity={0}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color={fallbackColor || '#333'}
            roughness={0.6}
            emissive={GOLD}
            emissiveIntensity={0}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Subtle label below garment on hover */}
      {isHighlighted && name && (
        <group position={[position[0], position[1] - h / 2 - 0.15, position[2] + 0.05]}>
          <mesh>
            <planeGeometry args={[0.9, 0.18]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.65} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Shelf item with product image ────────────────────────────────────────
function ShelfItem({ position, imageUrl, fallbackColor, onClick, name }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const texture = useImageTexture(imageUrl);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const s = hovered ? 1.1 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 10);
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity, hovered ? 0.25 : 0, delta * 8
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[0.45, 0.3, 0.35]} />
      {texture ? (
        <meshStandardMaterial
          map={texture}
          roughness={0.5}
          emissive={GOLD}
          emissiveIntensity={0}
        />
      ) : (
        <meshStandardMaterial
          color={fallbackColor || '#555'}
          roughness={0.55}
          emissive={GOLD}
          emissiveIntensity={0}
        />
      )}
    </mesh>
  );
}

// ── Center island ────────────────────────────────────────────────────────
function CenterIsland() {
  return (
    <group position={[0, 0, 1]}>
      <RoundedBox args={[3, 0.9, 1.4]} radius={0.04} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WALNUT_LIGHT} roughness={0.65} />
      </RoundedBox>
      <mesh position={[0, 0.92, 0]}><boxGeometry args={[3.1, 0.04, 1.5]} /><meshStandardMaterial color={MARBLE} roughness={0.15} metalness={0.05} /></mesh>
      <mesh position={[0, 0.945, 0]}><boxGeometry args={[3.14, 0.02, 1.54]} /><meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} /></mesh>
      {[-0.9, 0, 0.9].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.45, 0.71]}><boxGeometry args={[0.8, 0.35, 0.02]} /><meshStandardMaterial color={WALNUT} roughness={0.7} /></mesh>
          <mesh position={[x, 0.45, 0.74]}><boxGeometry args={[0.3, 0.02, 0.03]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.2} /></mesh>
        </group>
      ))}
      <spotLight position={[0, 4, 0]} angle={0.5} penumbra={0.8} intensity={2} color="#fff5e6" castShadow />
    </group>
  );
}

// ── Logo ─────────────────────────────────────────────────────────────────
function LogoWall() {
  const mat = useMemo(() => ({ color: GOLD_SOFT, metalness: 0.7, roughness: 0.2, emissive: GOLD, emissiveIntensity: 0.15 }), []);
  return (
    <group position={[0, 5, -5.9]}>
      <mesh><planeGeometry args={[5, 0.003]} /><meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, -0.7, 0]}><planeGeometry args={[5, 0.003]} /><meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} /></mesh>
      <Float speed={0.5} rotationIntensity={0} floatIntensity={0.1}>
        <group position={[0, -0.35, 0.02]}>
          <mesh position={[-0.3, 0, 0]}><boxGeometry args={[0.03, 0.4, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
          <mesh position={[-0.15, 0, 0]}><boxGeometry args={[0.25, 0.03, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
          <mesh position={[-0.15, -0.19, 0]}><boxGeometry args={[0.25, 0.03, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
          <mesh position={[-0.02, -0.05, 0]}><boxGeometry args={[0.03, 0.32, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
          <mesh position={[0.18, 0, 0]} rotation={[0, 0, 0.12]}><boxGeometry args={[0.03, 0.42, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
          <mesh position={[0.36, 0, 0]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.03, 0.42, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
          <mesh position={[0.27, -0.05, 0]}><boxGeometry args={[0.16, 0.03, 0.02]} /><meshStandardMaterial {...mat} /></mesh>
        </group>
      </Float>
    </group>
  );
}

// ── Lighting ─────────────────────────────────────────────────────────────
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#ffeedd" />
      <spotLight position={[0, 6.2, 0]} angle={1} penumbra={0.5} intensity={3} color="#ffe8cc" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} />
      <spotLight position={[-6.5, 5.5, -4]} angle={0.6} penumbra={0.8} intensity={2} color="#ffd9a0" />
      <spotLight position={[-2.5, 5.5, -4]} angle={0.6} penumbra={0.8} intensity={2} color="#ffd9a0" />
      <spotLight position={[2.5, 5.5, -4]} angle={0.6} penumbra={0.8} intensity={2} color="#ffd9a0" />
      <spotLight position={[6.5, 5.5, -4]} angle={0.6} penumbra={0.8} intensity={2} color="#ffd9a0" />
      <pointLight position={[0, 3, 6]} intensity={1} color="#ffe0b0" distance={14} />
      <pointLight position={[-5, 2, 4]} intensity={0.5} color="#ffeedd" distance={10} />
      <pointLight position={[5, 2, 4]} intensity={0.5} color="#ffeedd" distance={10} />
      <pointLight position={[-9, 3, -3]} intensity={0.4} color="#ffd080" distance={6} />
      <pointLight position={[9, 3, -3]} intensity={0.4} color="#ffd080" distance={6} />
    </>
  );
}

function CameraBreathing() {
  const time = useRef(0);
  const { camera } = useThree();
  useFrame((_, delta) => {
    time.current += delta * 0.2;
    camera.position.y = 3.2 + Math.sin(time.current) * 0.06;
  });
  return null;
}

// ── Garment slot definitions (positions in the cabinets) ─────────────────
// Each slot maps to a product from the catalog by index. "hang" = hanging on
// the rod (rendered as a textured plane); "shelf" = folded on a shelf (textured box).
const SLOTS = [
  // Cabinet 1 (left)
  { pos: [-7.4, 3.9, -4.6], type: 'hang' },
  { pos: [-6.7, 3.9, -4.6], type: 'hang' },
  { pos: [-6.0, 3.9, -4.6], type: 'hang' },
  { pos: [-7.0, 2.35, -4.65], type: 'shelf' },
  { pos: [-6.2, 2.35, -4.65], type: 'shelf' },
  // Cabinet 2
  { pos: [-3.4, 3.9, -4.6], type: 'hang' },
  { pos: [-2.7, 3.9, -4.6], type: 'hang' },
  { pos: [-2.0, 3.9, -4.6], type: 'hang' },
  { pos: [-2.9, 2.35, -4.65], type: 'shelf' },
  // Cabinet 3
  { pos: [2.0, 3.9, -4.6], type: 'hang' },
  { pos: [2.7, 3.9, -4.6], type: 'hang' },
  { pos: [3.4, 3.9, -4.6], type: 'hang' },
  { pos: [2.5, 2.35, -4.65], type: 'shelf' },
  // Cabinet 4 (right)
  { pos: [6.0, 3.9, -4.6], type: 'hang' },
  { pos: [6.7, 3.9, -4.6], type: 'hang' },
  { pos: [7.4, 3.9, -4.6], type: 'hang' },
  { pos: [6.5, 2.35, -4.65], type: 'shelf' },
];

const FALLBACK_COLORS = ['#1a1a2e', '#2c1810', '#f5f0e8', '#0d1b2a', '#f0ead6', '#2c2c2c', '#8b7355', '#3d2b1f', '#1a2332', '#c9b99a', '#e8dcc8', '#4a3728'];

function AllGarments({ products, onSelect, selectedId }) {
  return (
    <group>
      {SLOTS.map((slot, i) => {
        const product = products[i % products.length];
        const imageUrl = product?.image || null;
        const fallback = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        const name = product?.name || '';

        if (slot.type === 'hang') {
          return (
            <HangingGarment
              key={i}
              position={slot.pos}
              imageUrl={imageUrl}
              fallbackColor={fallback}
              name={name}
              hovered={selectedId === i}
              onClick={() => onSelect({ id: i, product })}
            />
          );
        }
        return (
          <ShelfItem
            key={i}
            position={slot.pos}
            imageUrl={imageUrl}
            fallbackColor={fallback}
            name={name}
            onClick={() => onSelect({ id: i, product })}
          />
        );
      })}
    </group>
  );
}

// ── Main scene ───────────────────────────────────────────────────────────
function Scene({ products, onSelect, selectedId }) {
  return (
    <>
      <Lighting />
      <CameraBreathing />
      <WardrobeRoom />
      <WardrobeCabinet position={[-6.5, 0, -5.1]} width={2.6} height={5.2} depth={0.8} />
      <WardrobeCabinet position={[-2.5, 0, -5.1]} width={2.6} height={5.2} depth={0.8} />
      <WardrobeCabinet position={[2.5, 0, -5.1]} width={2.6} height={5.2} depth={0.8} />
      <WardrobeCabinet position={[6.5, 0, -5.1]} width={2.6} height={5.2} depth={0.8} />
      <AllGarments products={products} onSelect={onSelect} selectedId={selectedId} />
      <CenterIsland />
      <LogoWall />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.55}
        minDistance={4}
        maxDistance={14}
        target={[0, 2.5, -2]}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
      />
    </>
  );
}

// ── Exported component ───────────────────────────────────────────────────
export default function WardrobeStage3D({ scenes, catalogProducts, renderHotspotCard }) {
  const [selected, setSelected] = useState(null);

  const hotspots = useMemo(() => {
    const list = [];
    for (const scene of scenes || []) {
      for (const h of scene.hotspots || []) list.push(h);
    }
    return list;
  }, [scenes]);

  const handleSelect = useCallback((item) => {
    setSelected((prev) => (prev?.id === item.id ? null : item));
  }, []);

  const mappedHotspot = useMemo(() => {
    if (!selected || !hotspots.length) return null;
    return hotspots[selected.id % hotspots.length];
  }, [selected, hotspots]);

  const products = catalogProducts || [];

  return (
    <div className="relative h-screen w-full bg-walnut-deep">
      <Canvas
        shadows
        camera={{ position: [0, 3.2, 8], fov: 55, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        style={{ background: WALNUT_DEEP }}
      >
        <fog attach="fog" args={[WALNUT_DEEP, 14, 28]} />
        <Suspense fallback={null}>
          <Scene products={products} onSelect={handleSelect} selectedId={selected?.id} />
        </Suspense>
      </Canvas>

      {/* Overlay heading */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center px-6 pt-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">The Dolce Attires</p>
        <h1 className="mt-3 font-display text-[clamp(32px,6vw,64px)] font-light leading-tight text-ivory">
          Virtual Wardrobe
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ivory/60">
          Explore our collection in an immersive luxury space.
          Click on garments to discover each piece.
        </p>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
        <p className="rounded-full bg-black/50 px-5 py-2.5 text-[11px] uppercase tracking-[0.15em] text-ivory/50 backdrop-blur-sm">
          Drag to rotate · Scroll to zoom
        </p>
      </div>

      {/* Product info card */}
      {selected && mappedHotspot && renderHotspotCard && (
        <div
          className="pointer-events-auto absolute bottom-20 right-6 z-30 w-72 md:bottom-auto md:right-8 md:top-1/2 md:-translate-y-1/2"
          style={{ animation: 'da-fade-in 0.3s ease' }}
        >
          {renderHotspotCard(mappedHotspot, scenes?.[1], 'spotlight')}
          <button
            onClick={() => setSelected(null)}
            className="mt-2 w-full rounded bg-gold/20 py-2 text-[11px] uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/30"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
