import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { submitNewsletter } from '@backend/mutations.js';
import { Eyebrow } from './ui/primitives.jsx';
import { NewsletterForm } from './ui/NewsletterForm.jsx';

// 3.11 — Newsletter "Join The Inner Circle". Centered band, email + Subscribe
// (submitNewsletter sourceSection 'inner-circle'), privacy microcopy, success fade-swap.

export default function Newsletter() {
  const n = useContent('newsletter');
  const revealRef = useReveal();
  if (!n) return null;

  return (
    <section ref={revealRef} className="bg-secondary text-primary rounded-3xl mx-4 md:mx-8 my-4">
      <div className="container-site py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow dark className="text-gold-soft">
            {n.eyebrow}
          </Eyebrow>
          <h2 data-reveal className="mt-4 font-display text-[clamp(34px,5vw,52px)] font-light leading-tight">
            {n.heading}
          </h2>
          <p data-reveal className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-primary/75">
            {n.body}
          </p>
          <div data-reveal className="mx-auto mt-8 max-w-md">
            <NewsletterForm
              sourceSection="inner-circle"
              placeholder={n.placeholder}
              ctaLabel={n.ctaLabel}
              onSubmit={(email) => submitNewsletter({ email, sourceSection: 'inner-circle' })}
              successMessage={n.successMessage}
              errorMessage={n.errorMessage}
              invalidMessage={n.invalidMessage}
              privacyNote={n.privacyNote}
              dark
              stacked
            />
          </div>
        </div>
      </div>
    </section>
  );
}
