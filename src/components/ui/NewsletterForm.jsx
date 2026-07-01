import { useState } from 'react';
import { ArrowRight } from './icons.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared email-capture form (footer · newsletter · limited-release waitlist). Equal-height
// input + button (0px). States: idle → pending → success (fade-swap) / inline error.
// Animates transform/opacity only.
export function NewsletterForm({
  onSubmit,
  placeholder = 'Email address',
  ctaLabel = 'Subscribe',
  successMessage = 'Welcome.',
  errorMessage = 'Something went wrong. Please try again.',
  invalidMessage = 'Please enter a valid email address.',
  dark = false,
  stacked = false,
  privacyNote,
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pending | success | error
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'pending') return;
    if (!EMAIL_RE.test(email.trim())) {
      setStatus('error');
      setMsg(invalidMessage);
      return;
    }
    setStatus('pending');
    setMsg('');
    try {
      await onSubmit(email.trim());
      setStatus('success');
      setMsg(successMessage);
      setEmail('');
    } catch {
      setStatus('error');
      setMsg(errorMessage);
    }
  };

  const fieldText = dark ? 'text-primary placeholder:text-primary/45' : 'text-text placeholder:text-text-muted/70';
  const border = dark ? 'border-white/25 focus-within:border-gold' : 'border-secondary/30 focus-within:border-secondary';

  if (status === 'success') {
    return (
      <p
        className={`text-[15px] ${dark ? 'text-gold-soft' : 'text-accent'}`}
        role="status"
        style={{ animation: 'da-fade-in 0.4s ease' }}
      >
        {msg}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={stacked ? 'space-y-3' : ''}>
      <div className={`flex ${stacked ? 'flex-col gap-3 sm:flex-row' : 'flex-row'} items-stretch`}>
        <div className={`flex flex-1 items-center border-b ${border} transition-colors`}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className={`h-12 w-full bg-transparent text-[15px] outline-none ${fieldText}`}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'pending'}
          className={`da-btn ${dark ? 'da-btn-primary-invert' : 'da-btn-primary'} ${
            stacked ? 'w-full sm:w-auto' : ''
          } ml-0 sm:ml-4 disabled:opacity-60`}
          style={{ minWidth: stacked ? undefined : 140 }}
        >
          {status === 'pending' ? '…' : ctaLabel}
          {!stacked && <ArrowRight size={15} className="ml-1" />}
        </button>
      </div>
      {privacyNote && status !== 'error' && (
        <p className={`mt-3 text-[12px] ${dark ? 'text-primary/45' : 'text-text-muted'}`}>{privacyNote}</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-[13px] text-red-700" role="alert">
          {msg}
        </p>
      )}
    </form>
  );
}
