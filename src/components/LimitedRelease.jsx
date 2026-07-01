import { useContent } from '../hooks/useContent.js';
import { useReveal } from '../hooks/useReveal.js';
import { Eyebrow } from './ui/primitives.jsx';
import Countdown from './ui/Countdown.jsx';
import { assetUrl } from '../lib/assets.js';
import { ArrowRight } from './ui/icons.jsx';

export default function LimitedRelease() {
  const lr = useContent('limitedRelease');
  const revealRef = useReveal();
  if (!lr) return null;

  return (
    <section ref={revealRef} className="bg-accent text-primary rounded-3xl mx-4 md:mx-8 my-4">
      <div className="container-site section-pad">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow dark className="text-gold-soft">
              {lr.eyebrow}
            </Eyebrow>
            <h2 data-reveal className="mt-4 font-display text-[clamp(34px,5vw,52px)] font-light leading-[1.05]">
              {lr.heading}
            </h2>
            <p data-reveal className="mt-4 max-w-md text-[15px] leading-relaxed text-primary/75">
              {lr.scarcityLine}
            </p>
            <div data-reveal className="mt-8">
              <Countdown targetDate={lr.launchDate} labels={lr.timerLabels} dark size="lg" />
            </div>
            <div data-reveal className="mt-9">
              <a
                href="https://tally.so/r/RGrlZd"
                target="_blank"
                rel="noreferrer"
                className="da-btn da-btn-primary-invert"
              >
                {lr.ctaLabel}
                <ArrowRight size={15} className="ml-1" />
              </a>
            </div>
          </div>

          <div data-reveal className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4 / 5' }}>
            <img src={assetUrl(lr.image)} alt={lr.imageAlt || ''} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
