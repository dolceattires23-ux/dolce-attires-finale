import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { usePrefersReducedMotion } from '../../hooks/useContent.js';

// Elegant countdown — 4 square (0px) hairline blocks DD/HH/MM/SS, Cormorant numerals. Each tick
// micro-animates the changed digit (y/opacity, transform only). targetDate = Date | ISO string.
function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: ms <= 0,
  };
}

export default function Countdown({ targetDate, labels = {}, dark = false, size = 'md' }) {
  const reduced = usePrefersReducedMotion();
  const [t, setT] = useState(() => diff(targetDate));

  useEffect(() => {
    const id = window.setInterval(() => setT(diff(targetDate)), 1000);
    return () => window.clearInterval(id);
  }, [targetDate]);

  const blocks = [
    { v: t.days, l: labels.days || 'Days' },
    { v: t.hours, l: labels.hours || 'Hours' },
    { v: t.minutes, l: labels.minutes || 'Minutes' },
    { v: t.seconds, l: labels.seconds || 'Seconds' },
  ];

  return (
    <div className={`flex gap-2.5 sm:gap-3 ${dark ? 'text-ivory' : 'text-text'}`} role="timer" aria-label="Time remaining">
      {blocks.map((b) => (
        <Block key={b.l} value={b.v} label={b.l} dark={dark} reduced={reduced} size={size} />
      ))}
    </div>
  );
}

function Block({ value, label, dark, reduced, size }) {
  const numRef = useRef(null);
  const prev = useRef(value);
  const padded = String(value).padStart(2, '0');
  const dims = size === 'lg' ? 'min-w-[72px] px-3 py-4 text-[40px] md:text-[52px]' : 'min-w-[60px] px-2.5 py-3 text-[32px] md:text-[40px]';

  useEffect(() => {
    if (reduced || prev.current === value) {
      prev.current = value;
      return;
    }
    prev.current = value;
    const el = numRef.current;
    if (el) gsap.fromTo(el, { y: -8, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
  }, [value, reduced]);

  return (
    <div className={`flex flex-col items-center border ${dark ? 'border-white/20' : 'border-secondary/20'}`}>
      <span ref={numRef} className={`font-display font-light leading-none ${dims}`}>
        {padded}
      </span>
      <span className={`pb-2 text-[9px] uppercase tracking-[0.14em] ${dark ? 'text-ivory/60' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

// Next local midnight (treated as the visitor's clock; Mauritius is UTC+4 and these are client-side).
export function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}
