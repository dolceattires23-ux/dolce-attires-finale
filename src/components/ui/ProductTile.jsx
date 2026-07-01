import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../hooks/useContent.js';
import { useCart } from '../../context/CartContext.jsx';
import { productImage, productAspect } from './primitives.jsx';
import { formatPrice } from '../../lib/assets.js';

export default function ProductTile({ product, onQuickView, eager = false, aspect }) {
  const pc = useContent('productCard');
  const { addItem, adding } = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [feedback, setFeedback] = useState(null);
  const panelRef = useRef(null);

  if (!product) return null;

  const colorOption = (product.options || []).find((o) => /colou?r/i.test(o.name));
  const colors = colorOption?.choices || [];
  const sizeOption = (product.options || []).find((o) => /size/i.test(o.name));
  const sizes = sizeOption?.choices || [];
  const ratio = aspect || productAspect(product);
  const isPreorder = product.isPreorder || false;
  const ready = Boolean(color && size);

  const handleAdd = async () => {
    if (!ready) return;
    setFeedback(null);
    // Key the variant choices by the product's actual option names (e.g. "Color"/"Size").
    const options = {};
    if (colorOption?.name && color) options[colorOption.name] = color;
    if (sizeOption?.name && size) options[sizeOption.name] = size;
    const res = await addItem({ product, options, quantity: 1 });
    if (res.ok) {
      setFeedback('added');
      setTimeout(() => {
        setFeedback(null);
        setPickerOpen(false);
        setColor('');
        setSize('');
      }, 1200);
    }
  };

  const openPicker = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPickerOpen(true);
    setFeedback(null);
  };

  const closePicker = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setPickerOpen(false);
    setColor('');
    setSize('');
    setFeedback(null);
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePicker();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [pickerOpen]);

  const btnLabel = isPreorder ? 'Pre-Order' : (pc?.addToCartLabel || 'Add to Cart');

  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-xl bg-surface" style={{ aspectRatio: ratio }}>
          <img
            src={productImage(product)}
            alt={product.name}
            loading={eager ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="absolute inset-x-3 bottom-3 translate-y-2 rounded-lg bg-background/95 py-2.5 text-center text-[11px] uppercase tracking-[0.15em] text-secondary opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            >
              {pc?.quickViewLabel || 'Quick view'}
            </button>
          )}
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-[14px] leading-snug">{product.name}</p>
          <p className="shrink-0 text-[13px] text-text-muted">{formatPrice(product.price, product.currency)}</p>
        </div>
      </Link>

      {/* Colour dots (display only when picker is closed) */}
      {!pickerOpen && colors.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          {colors.map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="inline-block h-3 w-3 rounded-full border border-black/10"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      )}

      {/* Add-to-cart trigger */}
      {!pickerOpen && (
        <button
          type="button"
          onClick={openPicker}
          className={`mt-3 w-full rounded-lg py-2.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
            isPreorder
              ? 'bg-accent text-primary hover:bg-accent/90'
              : 'bg-secondary text-primary hover:bg-black'
          }`}
        >
          {btnLabel}
        </button>
      )}

      {/* Inline colour + size picker */}
      {pickerOpen && (
        <div
          ref={panelRef}
          className="mt-3 rounded-xl border border-hairline bg-background p-4 shadow-lg"
          style={{ animation: 'da-fade-in 0.2s ease' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Colour */}
          {colors.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                Colour{color ? ` — ${color}` : ''}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => {
                  const active = color === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={active}
                      onClick={(e) => { e.stopPropagation(); setColor(c.name); }}
                      className={`relative h-7 w-7 rounded-md border transition-all ${
                        active ? 'border-secondary ring-2 ring-secondary/25' : 'border-black/15 hover:border-secondary/50'
                      }`}
                    >
                      <span className="absolute inset-0.5 block rounded" style={{ backgroundColor: c.value }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-text-muted">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => {
                  const active = size === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      aria-pressed={active}
                      onClick={(e) => { e.stopPropagation(); setSize(s.name); }}
                      className={`h-8 min-w-[36px] rounded-md border px-2 text-[11px] uppercase tracking-[0.08em] transition-colors ${
                        active ? 'border-secondary bg-secondary text-primary' : 'border-black/15 hover:border-secondary/60'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm / Cancel */}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!ready || adding}
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
              className={`flex-1 rounded-lg py-2 text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
                feedback === 'added'
                  ? 'bg-green-800 text-white'
                  : isPreorder
                    ? 'bg-accent text-primary hover:bg-accent/90'
                    : 'bg-secondary text-primary hover:bg-black'
              }`}
            >
              {adding ? '...' : feedback === 'added' ? 'Added!' : ready ? (isPreorder ? 'Confirm Pre-Order' : 'Confirm') : 'Select options'}
            </button>
            <button
              type="button"
              onClick={closePicker}
              className="rounded-lg border border-hairline px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-text-muted transition-colors hover:border-secondary hover:text-secondary"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
