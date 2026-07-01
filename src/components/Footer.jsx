import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { submitNewsletter } from '@backend/mutations.js';
import { NewsletterForm } from './ui/NewsletterForm.jsx';
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from './ui/icons.jsx';

// 3.0c — global footer. Charcoal band: full-width newsletter row, 4 link columns (accordion on
// mobile), social row, wordmark, copyright + policy links. WhatsApp deep-link from content.

const SOCIAL_ICON = { Instagram: InstagramIcon, Facebook: FacebookIcon, WhatsApp: WhatsAppIcon };

export default function Footer() {
  const f = useContent('footer');
  const newsletter = useContent('newsletter');
  const revealRef = useReveal({ stagger: 0.06, duration: 0.5 });
  if (!f) return null;

  return (
    <footer ref={revealRef} className="bg-secondary text-primary">
      <div className="container-site py-16 md:py-20">
        {/* Newsletter row */}
        <div className="mb-14 grid items-end gap-8 border-b border-white/12 pb-14 md:grid-cols-2 md:gap-16">
          <div data-reveal>
            <h2 className="font-display text-[32px] leading-tight md:text-[40px]">{f.newsletterHeading}</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-primary/70">{newsletter?.body}</p>
          </div>
          <div data-reveal>
            <NewsletterForm
              sourceSection="footer"
              placeholder={f.newsletterPlaceholder}
              ctaLabel={f.newsletterButton}
              onSubmit={(email) => submitNewsletter({ email, sourceSection: 'footer' })}
              successMessage={newsletter?.successMessage}
              errorMessage={newsletter?.errorMessage}
              invalidMessage={newsletter?.invalidMessage}
              dark
            />
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:gap-8">
          {(f.columns || []).map((col) => (
            <FooterColumn key={col.title} col={col} />
          ))}
        </div>

        {/* Wordmark + social + legal */}
        <div className="mt-16 flex flex-col gap-8 border-t border-white/12 pt-8 md:flex-row md:items-end md:justify-between">
          <div data-reveal>
            <Link to="/" className="font-display text-[30px] tracking-[0.16em]">
              {f.wordmark}
            </Link>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-primary/60">{f.blurb}</p>
          </div>
          <div className="flex items-center gap-5" data-reveal>
            {(f.columns?.find((c) => c.title === 'Connect')?.links || []).map((l) => {
              const Icon = SOCIAL_ICON[l.label];
              return (
                <a
                  key={l.label}
                  href={l.external}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={l.label}
                  className="text-primary/70 transition-colors hover:text-gold"
                >
                  {Icon ? <Icon size={20} /> : l.label}
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-[12px] uppercase tracking-[0.12em] text-primary/50 md:flex-row md:items-center md:justify-between">
          <p>{f.legal}</p>
          <div className="flex gap-5">
            <span>{f.localeNote}</span>
            {(f.policyLinks || []).map((p) => (
              <Link key={p.label} to={p.to} className="transition-colors hover:text-primary">
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Column: static list desktop; "+" accordion on mobile.
function FooterColumn({ col }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-reveal>
      <button
        type="button"
        className="flex w-full items-center justify-between md:pointer-events-none md:cursor-default"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="eyebrow text-primary/55">{col.title}</span>
        <span className="text-lg leading-none text-primary/55 md:hidden">{open ? '–' : '+'}</span>
      </button>
      <ul className={`mt-4 space-y-3 text-[14px] text-primary/80 ${open ? 'block' : 'hidden'} md:block`}>
        {(col.links || []).map((l) =>
          l.external ? (
            <li key={l.label}>
              <a href={l.external} target="_blank" rel="noreferrer" className="transition-colors hover:text-gold">
                {l.label}
              </a>
            </li>
          ) : (
            <li key={l.label}>
              <Link to={l.to} className="transition-colors hover:text-gold">
                {l.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
