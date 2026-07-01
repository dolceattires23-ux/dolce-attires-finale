// Wardrobe scene data — plain JSON-shaped objects, the stable contract <WardrobeStage> renders.
// All spatial values are renderer-agnostic so a future Three.js/R3F WardrobeStage3D reuses them
// verbatim: hotspot/spotlight coordinates are NORMALIZED 0..1 (x,y over the backplate), and each
// scene carries cameraKeyframes (also 0..1 focal points + zoom) for a future camera dolly.
// The 2D renderer maps {x,y} → CSS percentages and uses cameraKeyframes only as parallax hints.
//
// buildScenes(content) injects the brand copy/images from content.json (wardrobe.*) so nothing is
// hardcoded twice. Product hotspots reference real catalog slugs (resolved live via getBySlug).

export function buildScenes(wardrobe) {
  const wings = wardrobe?.wings || [];
  const byId = (id) => wings.find((w) => w.id === id) || {};
  const men = byId('men');
  const women = byId('women');

  return [
    {
      id: 'entrance',
      kind: 'doors', // the doors-part entrance (split the symmetric backplate L/R)
      backplate: wardrobe?.entranceImage,
      backplateMobile: wardrobe?.entranceImageMobile,
      alt: wardrobe?.entranceImageAlt,
      eyebrow: wardrobe?.eyebrow,
      title: wardrobe?.heading,
      intro: wardrobe?.intro,
      layers: [],
      hotspots: [],
      spotlights: [],
      cameraKeyframes: [
        { t: 0, focus: { x: 0.5, y: 0.5 }, zoom: 1.0 },
        { t: 1, focus: { x: 0.5, y: 0.5 }, zoom: 1.06 },
      ],
    },
    {
      id: 'men',
      kind: 'wing',
      backplate: men.image,
      alt: men.imageAlt,
      eyebrow: men.eyebrow,
      title: men.title,
      note: men.note,
      to: men.to,
      groups: men.groups,
      // Parallax planes (foreground moves faster than background) — 2D depth hint, reused as 3D depth.
      layers: [
        { depth: 0.0 }, // backplate
      ],
      // Hotspots → product mini-cards (normalized coords over the backplate).
      hotspots: [
        { id: 'm1', slug: 'essential-linen-shirt-short-sleeve', x: 0.27, y: 0.4 },
        { id: 'm2', slug: 'linen-pants', x: 0.5, y: 0.52 },
        { id: 'm3', slug: 'quarter-zip-sweatshirt', x: 0.8, y: 0.46 },
      ],
      spotlights: [
        { id: 's-m', slug: 'essential-linen-shirt-short-sleeve', label: 'The Linen Shirt' },
      ],
      cameraKeyframes: [
        { t: 0, focus: { x: 0.35, y: 0.5 }, zoom: 1.04 },
        { t: 1, focus: { x: 0.65, y: 0.5 }, zoom: 1.0 },
      ],
    },
    {
      id: 'women',
      kind: 'wing',
      backplate: women.image,
      alt: women.imageAlt,
      eyebrow: women.eyebrow,
      title: women.title,
      note: women.note,
      to: women.to,
      groups: women.groups,
      layers: [{ depth: 0.0 }],
      hotspots: [
        { id: 'w1', slug: 'linen-shirt-long-sleeve', x: 0.3, y: 0.44 },
        { id: 'w2', slug: 'linen-pants', x: 0.58, y: 0.55 },
        { id: 'w3', slug: 'striped-pants-unisex', x: 0.78, y: 0.5 },
      ],
      spotlights: [{ id: 's-w', slug: 'linen-shirt-long-sleeve', label: 'The Atelier Edit' }],
      cameraKeyframes: [
        { t: 0, focus: { x: 0.65, y: 0.5 }, zoom: 1.04 },
        { t: 1, focus: { x: 0.4, y: 0.5 }, zoom: 1.0 },
      ],
    },
  ];
}
