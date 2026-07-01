import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useCart } from '../context/CartContext.jsx';
import { productImage } from './ui/primitives.jsx';
import { formatPrice, stripHtml } from '../lib/assets.js';
import { WhatsAppIcon, ArrowRight } from './ui/icons.jsx';

export default function ProductDetail({ product, modal = false }) {
  const pc = useContent('productCard');
  const brand = useContent('brand');
  const { addItem, adding } = useCart();
  const navigate = useNavigate();

  const colorOption = useMemo(() => (product.options || []).find((o) => /colou?r/i.test(o.name)), [product]);
  const sizeOption = useMemo(
    () => (product.options || []).find((o) => /size/i.test(o.name)) || { choices: [] },
    [product]
  );
  const colors = colorOption?.choices || [];
  const sizes = sizeOption?.choices || [];

  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [feedback, setFeedback] = useState(null);

  const ready = Boolean(color && size);
  // Build the variant choices keyed by the product's ACTUAL option names (e.g. "Color"/"Size"),
  // so the Wix managed-variant lookup gets valid choice titles.
  const options = {};
  if (colorOption?.name && color) options[colorOption.name] = color;
  if (sizeOption?.name && size) options[sizeOption.name] = size;
  const isPreorder = product.isPreorder || false;

  const whatsappHref = `https://wa.me/${brand?.whatsappNumber || '23059102655'}?text=${encodeURIComponent(
    `Hi Dolce Attires, I'd like to ask about the ${product.name}${color ? ` (${color}` : ''}${size ? `, ${size})` : color ? ')' : ''}.`
  )}`;

  const selectPrompt = `Please select a colour${colors.length && sizes.length ? ' and a size' : sizes.length ? ' size' : ' colour'} first.`;

  const onAdd = async () => {
    if (!ready) {
      setFeedback({ type: 'error', msg: selectPrompt });
      return;
    }
    setFeedback(null);
    const res = await addItem({ product, options, quantity: 1 });
    if (res.ok) {
      setFeedback({ type: 'success', msg: 'Added to cart!' });
      setTimeout(() => setFeedback(null), 2000);
    } else {
      setFeedback({ type: 'error', msg: res.error || 'Something went wrong.' });
    }
  };

  const onBuyNow = async () => {
    if (!ready) {
      setFeedback({ type: 'error', msg: selectPrompt });
      return;
    }
    setFeedback(null);
    const res = await addItem({ product, options, quantity: 1 });
    if (res.ok) navigate('/cart');
  };

  const desc = stripHtml(product.description) || pc?.accordion?.[0]?.body;

  return (
    <div className={`grid grid-cols-1 gap-8 lg:gap-14 ${modal ? 'lg:grid-cols-2' : 'lg:grid-cols-[6fr_5fr]'}`}>
      <div className="min-w-0 overflow-hidden rounded-2xl bg-surface" style={{ aspectRatio: '4 / 5' }}>
        <img
          src={productImage(product)}
          alt={product.name}
          className="h-full w-full object-cover"
          loading={modal ? 'lazy' : 'eager'}
        />
      </div>

      <div className={`min-w-0 ${modal ? 'flex flex-col overflow-y-auto pr-1' : ''}`} data-lenis-prevent={modal ? '' : undefined}>
        <p className="eyebrow text-text-muted">
          {(product.subcategories?.[0] || pc?.eyebrow || 'Linen Essentials').toString().replace(/-/g, ' ')}
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-tight md:text-[44px]">{product.name}</h1>
        <p className="mt-3 text-[20px] text-text">{formatPrice(product.price, product.currency)}</p>
        <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-text-muted">{pc?.dutiesNote}</p>

        {isPreorder && (
          <span className="mt-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-accent">
            Pre-Order
          </span>
        )}

        {colors.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-[13px]">
              {pc?.colorLabelPrefix} {color && <span className="text-text-muted">— {color}</span>}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => {
                const active = color === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={active}
                    onClick={() => setColor(c.name)}
                    className={`relative h-9 w-9 rounded-lg border transition-all ${
                      active ? 'border-secondary ring-2 ring-secondary/20' : 'border-black/15 hover:border-secondary/50'
                    }`}
                  >
                    <span className="absolute inset-1 block rounded" style={{ backgroundColor: c.value }} />
                  </button>
                );
              })}
            </div>
            {!color && <p className="mt-2 text-[12px] text-text-muted">{pc?.selectColorPrompt}</p>}
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-[13px]">{pc?.sizeLabelPrefix}</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const active = size === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSize(s.name)}
                    className={`h-11 min-w-[48px] rounded-lg border px-3 text-[13px] uppercase tracking-[0.08em] transition-colors ${
                      active ? 'border-secondary bg-secondary text-primary' : 'border-black/15 hover:border-secondary/60'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            {!size && <p className="mt-2 text-[12px] text-text-muted">{pc?.selectSizePrompt}</p>}
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            disabled={adding}
            onClick={onBuyNow}
            className="da-btn da-btn-primary w-full"
          >
            {isPreorder ? 'Pre-Order Now' : 'Buy Now'}
            <ArrowRight size={15} className="ml-1" />
          </button>
          <button
            type="button"
            disabled={adding}
            onClick={onAdd}
            className="da-btn da-btn-outline w-full"
          >
            {adding ? '...' : pc?.addToCartLabel || 'Add to Cart'}
          </button>
          {!ready && (
            <p className="text-center text-[12px] text-text-muted">
              {pc?.selectColorPrompt} &amp; {pc?.selectSizePrompt?.toLowerCase()}
            </p>
          )}
          {feedback?.type === 'success' && (
            <p className="text-center text-[13px] text-green-700" role="status">{feedback.msg}</p>
          )}
          {feedback?.type === 'error' && (
            <p className="text-center text-[13px] text-red-700" role="alert">{feedback.msg}</p>
          )}
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-text-muted transition-colors hover:text-secondary"
        >
          <WhatsAppIcon size={16} />
          {pc?.whatsappLabel}
        </a>

        <div className="mt-8 border-t border-hairline">
          {(pc?.accordion || []).map((item, i) => (
            <AccordionRow key={item.title} title={item.title} body={i === 0 && desc ? desc : item.body} />
          ))}
        </div>

        {modal && (
          <Link to={`/product/${product.slug}`} className="da-bracket-link mt-6 self-start">
            <span className="da-bracket-label">View full details</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function AccordionRow({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-[13px] uppercase tracking-[0.12em]">{title}</span>
        <span className="text-lg leading-none text-text-muted">{open ? '–' : '+'}</span>
      </button>
      {open && <p className="pb-5 pr-4 text-[14px] leading-relaxed text-text-muted">{body}</p>}
    </div>
  );
}
