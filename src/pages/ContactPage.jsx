import { useState } from 'react';
import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { submitContactForm } from '@backend/mutations.js';
import { Eyebrow } from '../components/ui/primitives.jsx';
import { WhatsAppIcon, ArrowRight } from '../components/ui/icons.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 3.18 — Contact (ref contact--buck-mason). Two-column: form left (submitContactForm) + info
// right; FAQ accordion full-width below. WhatsApp deep-link. Calm, minimalist.

export default function ContactPage() {
  const c = useContent('contact');
  const ref = useReveal();
  if (!c) return null;

  return (
    <main className="pt-16 lg:pt-20">
      <div ref={ref} className="container-site py-14 md:py-20">
        <div className="mb-12 max-w-2xl">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h1 data-reveal className="mt-3 font-display text-[clamp(40px,6vw,60px)] font-light leading-none">
            {c.heading}
          </h1>
          <p data-reveal className="mt-4 max-w-md text-[16px] leading-relaxed text-text-muted">
            {c.body}
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-[3fr_2fr] md:gap-16">
          <div data-reveal>
            <ContactForm c={c} />
          </div>
          <div data-reveal>
            <Info c={c} />
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FaqSection c={c} />
    </main>
  );
}

function ContactForm({ c }) {
  const f = c.form;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = f.invalidEmail;
    if (!form.message.trim()) errs.message = f.requiredMessage;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus('pending');
    try {
      await submitContactForm({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="border border-hairline bg-surface p-8 text-center" style={{ animation: 'da-fade-in 0.4s ease' }}>
        <h3 className="font-display text-[26px]">{f.successTitle}</h3>
        <p className="mt-3 text-[15px] text-text-muted">{f.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field label={f.nameLabel} value={form.name} onChange={set('name')} />
      <Field label={f.emailLabel} type="email" value={form.email} onChange={set('email')} error={errors.email} />
      <Field label={f.messageLabel} value={form.message} onChange={set('message')} error={errors.message} textarea />
      {status === 'error' && (
        <p className="text-[13px] text-red-700" role="alert">
          {f.errorMessage}
        </p>
      )}
      <button type="submit" disabled={status === 'pending'} className="da-btn da-btn-primary">
        {status === 'pending' ? f.submittingLabel : f.submitLabel}
        <ArrowRight size={15} className="ml-1" />
      </button>
    </form>
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
          rows={5}
          className="w-full border border-hairline bg-white px-3 py-2.5 text-[15px] outline-none focus:border-secondary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="h-12 w-full border border-hairline bg-white px-3 text-[15px] outline-none focus:border-secondary"
        />
      )}
      {error && <span className="mt-1 block text-[12px] text-red-700">{error}</span>}
    </label>
  );
}

function Info({ c }) {
  return (
    <div>
      <p className="eyebrow mb-5 text-text-muted">{c.infoHeading}</p>
      <ul className="space-y-4">
        {(c.info || []).map((item) => (
          <li key={item.label} className="border-b border-hairline pb-4">
            <p className="text-[12px] uppercase tracking-[0.1em] text-text-muted">{item.label}</p>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[16px] transition-opacity hover:opacity-60">
                {item.value}
              </a>
            ) : (
              <p className="mt-1 text-[16px]">{item.value}</p>
            )}
          </li>
        ))}
      </ul>
      <a
        href={c.info?.find((i) => i.label === 'WhatsApp')?.href || 'https://wa.me/23059102655'}
        target="_blank"
        rel="noreferrer"
        className="da-btn da-btn-outline mt-7 w-full"
      >
        <WhatsAppIcon size={16} className="mr-1" />
        {c.whatsappLabel}
      </a>
    </div>
  );
}

function FaqSection({ c }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="bg-surface">
      <div className="container-site py-16 md:py-20">
        <h2 data-reveal className="mb-8 font-display text-[clamp(28px,4vw,40px)]">
          {c.faqHeading}
        </h2>
        <div className="mx-auto max-w-3xl border-t border-hairline" data-reveal>
          {(c.faqs || []).map((item) => (
            <FaqRow key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqRow({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-hairline">
      <button type="button" className="flex w-full items-center justify-between gap-4 py-5 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="font-display text-[20px] md:text-[22px]">{q}</span>
        <span className="shrink-0 text-2xl leading-none text-text-muted">{open ? '–' : '+'}</span>
      </button>
      {open && <p className="pb-6 pr-8 text-[15px] leading-relaxed text-text-muted">{a}</p>}
    </div>
  );
}
