import { useEffect, useState } from 'react';
import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { getReviews } from '@backend/queries.js';
import { Eyebrow } from './ui/primitives.jsx';
import { GoogleG, StarRow } from './ui/icons.jsx';
import { relativeDate } from '../lib/assets.js';

// 3.10 — Testimonials as a Google-review interface. Aggregate header (avg + stars + Google "G" +
// count) and per-card (stars/name/avatar-initial/date/body/G). getReviews() returns [] by design
// today → render the intentional empty Google-review state. NEVER fabricate reviews/names/scores.

export default function Testimonials() {
  const t = useContent('testimonials');
  const brand = useContent('brand');
  const revealRef = useReveal({ stagger: 0.08 });
  const [reviews, setReviews] = useState(null); // null=loading, []=empty, [..]=present
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getReviews()
      .then((r) => alive && setReviews(Array.isArray(r) ? r : []))
      .catch(() => alive && (setError(true), setReviews([])));
    return () => {
      alive = false;
    };
  }, []);

  if (!t) return null;

  const loading = reviews === null && !error;
  const hasReviews = Array.isArray(reviews) && reviews.length > 0;
  const avg = hasReviews ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  return (
    <section ref={revealRef} className="section-pad">
      <div className="container-site">
        <div className="mb-10 text-center">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 data-reveal className="mt-3 font-display text-[clamp(32px,5vw,48px)] leading-tight">
            {t.heading}
          </h2>
        </div>

        {/* Aggregate header — always shows the Google attribution */}
        <div data-reveal className="mx-auto mb-10 flex max-w-md flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface px-6 py-6 text-center">
          <div className="flex items-center gap-2">
            <GoogleG size={22} />
            <span className="text-[14px] font-medium uppercase tracking-[0.1em] text-text">{t.googleLabel}</span>
          </div>
          {hasReviews ? (
            <>
              <div className="flex items-center gap-3">
                <span className="font-display text-[40px] leading-none">{avg}</span>
                <StarRow count={Math.round(avg)} size={20} />
              </div>
              <p className="text-[13px] text-text-muted">
                {t.aggregatePrefix} {reviews.length} {t.aggregateSuffix}
              </p>
            </>
          ) : (
            <>
              <StarRow count={0} size={20} />
              <p className="text-[13px] text-text-muted">{t.aggregateSuffix}</p>
            </>
          )}
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-hairline bg-surface" />
            ))}
          </div>
        ) : hasReviews ? (
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <EmptyState t={t} brand={brand} />
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }) {
  const initial = review.avatarInitial || (review.reviewerName ? review.reviewerName.charAt(0) : 'G');
  return (
    <article data-reveal className="flex flex-col rounded-2xl border border-hairline bg-background p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-[15px] font-medium text-primary">
          {initial}
        </span>
        <div className="flex-1">
          <p className="text-[14px] font-medium">{review.reviewerName}</p>
          <p className="text-[12px] text-text-muted">{relativeDate(review.reviewDate)}</p>
        </div>
        <GoogleG size={18} />
      </div>
      <StarRow count={review.rating} size={15} />
      <p className="mt-3 text-[14px] leading-relaxed text-text-muted">{review.reviewBody}</p>
    </article>
  );
}

function EmptyState({ t, brand }) {
  return (
    <div data-reveal className="mx-auto max-w-xl rounded-2xl border border-dashed border-hairline bg-background p-8 text-center">
      <div className="mb-4 flex items-center justify-center gap-2 opacity-60">
        <GoogleG size={20} />
        <StarRow count={0} size={18} />
      </div>
      <h3 className="font-display text-[26px]">{t.emptyTitle}</h3>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-text-muted">{t.emptyBody}</p>
      <a
        href={brand?.instagram || '#'}
        target="_blank"
        rel="noreferrer"
        className="da-btn da-btn-outline mt-6"
      >
        {t.emptyCtaLabel}
      </a>
    </div>
  );
}
