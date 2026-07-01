import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useContent, usePrefersReducedMotion } from '../hooks/useContent.js';
import { submitPreorder } from '@backend/mutations.js';
import { CloseIcon } from './ui/icons.jsx';
import { formatPrice } from '../lib/assets.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pre-order capture modal — the always-working path (backend submitPreorder, no card charged).
// Collects name/email/phone/note for the chosen Colour+Size, then confirms. Sharp 0px modal.
export default function PreorderModal({ product, options, onClose }) {
  const pc = useContent('productCard');
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const el = panelRef.current;
    if (el && !reduced) gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, reduced]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = pc?.preorderNameRequired;
    if (!EMAIL_RE.test(form.email.trim())) errs.email = pc?.preorderEmailInvalid;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus('pending');
    try {
      await submitPreorder({
        productSlug: product.slug,
        productName: product.name,
        productId: product.id,
        options,
        quantity: 1,
        priceMUR: product.price,
        customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
        note: form.note.trim(),
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={pc?.preorderHeading}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-secondary/55" onClick={onClose} />
      <div ref={panelRef} className="relative w-full max-w-md bg-background p-7 shadow-primary" data-lenis-prevent>
        <button type="button" aria-label={pc?.preorderClose || 'Close'} onClick={onClose} className="absolute right-4 top-4 p-1">
          <CloseIcon size={20} />
        </button>

        {status === 'success' ? (
          <div className="py-4 text-center" style={reduced ? undefined : { animation: 'da-fade-in 0.4s ease' }}>
            <h3 className="font-display text-[28px]">{pc?.preorderSuccessTitle}</h3>
            <p className="mt-3 text-[15px] text-text-muted">{pc?.preorderSuccessBody}</p>
            <button type="button" onClick={onClose} className="da-btn da-btn-primary mt-6 w-full">
              {pc?.preorderClose || 'Close'}
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow text-text-muted">{pc?.preorderLabel}</p>
            <h3 className="mt-2 font-display text-[26px] leading-tight">{product.name}</h3>
            <p className="mt-1 text-[14px] text-text-muted">
              {[options.Color, options.Size].filter(Boolean).join(' · ')} · {formatPrice(product.price, product.currency)}
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-text-muted">{pc?.preorderIntro}</p>

            <form onSubmit={submit} noValidate className="mt-5 space-y-4">
              <Field label={pc?.preorderNameLabel} value={form.name} onChange={set('name')} error={errors.name} />
              <Field label={pc?.preorderEmailLabel} type="email" value={form.email} onChange={set('email')} error={errors.email} />
              <Field label={pc?.preorderPhoneLabel} value={form.phone} onChange={set('phone')} />
              <Field label={pc?.preorderNoteLabel} value={form.note} onChange={set('note')} textarea />
              {status === 'error' && (
                <p className="text-[13px] text-red-700" role="alert">
                  {pc?.preorderErrorPrefix}
                </p>
              )}
              <button type="submit" disabled={status === 'pending'} className="da-btn da-btn-primary w-full">
                {status === 'pending' ? pc?.preorderSubmittingLabel : pc?.preorderSubmitLabel}
              </button>
              <p className="text-center text-[11px] text-text-muted">{pc?.checkoutManualNote}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', error, textarea }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] uppercase tracking-[0.1em] text-text-muted">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={onChange}
          rows={2}
          className="w-full border border-hairline bg-white px-3 py-2 text-[14px] outline-none focus:border-secondary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="h-11 w-full border border-hairline bg-white px-3 text-[14px] outline-none focus:border-secondary"
        />
      )}
      {error && <span className="mt-1 block text-[12px] text-red-700">{error}</span>}
    </label>
  );
}
