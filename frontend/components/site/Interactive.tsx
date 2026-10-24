'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Faq, ServiceItem, SiteImages, Step } from '@/lib/types';
import { estimateHref } from '@/lib/links';
import { Photo } from './Photo';
import { ArrowCta, Icon, RiseLines } from './Bits';

/* ------------------------------------------------------------------ */
/* Home hero: "I'm planning" Roofing / Remodeling toggle with cross-fade */
/* ------------------------------------------------------------------ */
const MODES = [
  { v: 'roofing', label: 'Roofing', line: 'Start with what you are seeing on your roof, and plan the right next step from there.', href: '/roofing', cta: 'Explore roofing' },
  { v: 'remodeling', label: 'Remodeling', line: 'Tell us which space is not working and what you would like it to become.', href: '/remodeling', cta: 'Explore remodeling' },
] as const;

export function HomeHero({ images, location }: { images: SiteImages; location: string }) {
  const [mode, setMode] = useState(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const m = MODES[mode];
  const onKey = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const n = mode ? 0 : 1;
    setMode(n);
    btns.current[n]?.focus();
  };
  return (
    <section aria-labelledby="home-h1" className="hero">
      <div className="hero__img" style={{ opacity: mode === 0 ? 1 : 0 }}>
        <Photo img={images['home-hero-roof']} tone="dark" eager alt="residential exterior and roofline" placeholder="Illustrative placeholder — residential exterior / roofline photograph" />
      </div>
      <div className="hero__img" style={{ opacity: mode === 1 ? 1 : 0 }}>
        <Photo img={images['home-hero-remodel']} tone="dark" alt="renovated interior" placeholder="Illustrative placeholder — renovated interior photograph" />
      </div>
      <div className="hero__shade" aria-hidden="true" />
      <svg className="hero__lines" aria-hidden="true" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <path d="M0 380 L360 120 L720 380" fill="none" stroke="#C87943" strokeWidth="1" />
        <path d="M480 380 L840 60 L1200 380" fill="none" stroke="#F5E9DF" strokeWidth="1" />
      </svg>
      <div className="hero__in">
        <div className="hero__txt">
          <span className="chip-k chip-k--dark rise">Roofing &amp; Remodeling{location ? ` · ${location}` : ''}</span>
          <h1 id="home-h1" className="h-mega h-lines">
            <RiseLines a="Built to Protect." b="Designed to Improve." start={1} />
          </h1>
          <p className="rise" style={{ ['--i' as string]: 3 }}>
            Explore roofing and remodeling services designed to help you plan your next home improvement project with confidence.
          </p>
          <div className="btns rise" style={{ ['--i' as string]: 4 }}>
            <ArrowCta href="/estimate">Get an Estimate</ArrowCta>
            <Link href="/projects" className="btn btn--ghost btn--lg">
              Explore Our Projects
            </Link>
          </div>
        </div>
        <div className="mode rise" style={{ ['--i' as string]: 5 }}>
          <span id="hero-mode-label" className="mode__k">
            I’m planning
          </span>
          <div role="radiogroup" aria-labelledby="hero-mode-label" className="mode__seg">
            <span aria-hidden="true" className="mode__thumb" style={{ transform: mode ? 'translateX(100%)' : 'none' }} />
            {MODES.map((o, k) => (
              <button key={o.v} ref={(el) => (btns.current[k] = el)} type="button" role="radio" aria-checked={mode === k} tabIndex={mode === k ? 0 : -1} onClick={() => setMode(k)} onKeyDown={onKey}>
                {o.label}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mode__line">
            {m.line}
          </p>
          <Link href={m.href} className="mode__go">
            {m.cta}
            <Icon n="arrow-right" style={{ fontSize: 18 }} />
          </Link>
        </div>
      </div>
      <div className="cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* "How it works": sticky aside, steps highlight as they cross centre  */
/* ------------------------------------------------------------------ */
export function ProcessSteps({ steps, flag }: { steps: Step[]; flag: React.ReactNode }) {
  const [on, setOn] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (!list.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting && setOn(Number((en.target as HTMLElement).dataset.step))), { rootMargin: '-45% 0px -45% 0px' });
    list.current.querySelectorAll('[data-step]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [steps.length]);
  const n = Math.max(steps.length, 1);
  return (
    <section aria-labelledby="proc-h" className="wrap sec proc">
      <div className="proc__aside">
        <span className="chip-k">How it works</span>
        <h2 id="proc-h" className="h-xl">
          From first message to estimate.
        </h2>
        {flag}
        <div className="proc__bar" aria-hidden="true">
          <div style={{ width: `${((Math.min(on, n - 1) + 1) / n) * 100}%` }} />
        </div>
        <ArrowCta href="/estimate" size="md" className="alink-self">
          Start step one
        </ArrowCta>
      </div>
      <ol ref={list}>
        {steps.map((st, i) => (
          <li key={st.id} data-step={i} className={i <= on ? 'is-on' : ''}>
            <span className="proc__n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3>{st.title}</h3>
            <p>{st.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Roofing: expanding service panels                                   */
/* ------------------------------------------------------------------ */
export function RoofPanels({ services }: { services: ServiceItem[] }) {
  const [on, setOn] = useState(0);
  if (!services.length) return <p className="note-box">Roofing services are being confirmed. Describe what you are seeing in the estimate form.</p>;
  return (
    <div className="panels">
      {services.map((s, i) => {
        const a = on === i;
        return (
          <div key={s.id} className={`panel${a ? ' is-on' : ''}`} onMouseEnter={() => setOn(i)}>
            <Photo img={s.image ? { url: s.image, alt: s.alt } : null} tone="dark" alt={s.alt || s.name} placeholder="Illustrative placeholder" />
            <div className="panel__shade" aria-hidden="true" />
            {a ? (
              <div aria-live="polite" className="panel__body">
                <span className="panel__num">0{i + 1}</span>
                <h3>{s.name}</h3>
                <p>{s.need}</p>
                <Link href={estimateHref('roofing')} className="btn btn--white btn--sm" aria-label={`Request an estimate for ${s.name.toLowerCase()}`}>
                  Request an estimate <Icon n="arrow-up-right" />
                </Link>
              </div>
            ) : (
              <button type="button" className="panel__btn" aria-expanded="false" aria-label={`Show ${s.name}`} onClick={() => setOn(i)} onFocus={() => setOn(i)}>
                <span>0{i + 1}</span>
                <span>{s.name}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Remodeling: vertical tabs with cross-fading image panel             */
/* ------------------------------------------------------------------ */
export function RemodelTabs({ services }: { services: ServiceItem[] }) {
  const [on, setOn] = useState(0);
  if (!services.length) return <p className="note-box">Remodeling categories are being confirmed. Describe your project in the estimate form.</p>;
  const n = services.length;
  const go = (k: number) => {
    setOn(k);
    document.getElementById(`rt-${k}`)?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    let k = on;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (on + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (on + n - 1) % n;
    else if (e.key === 'Home') k = 0;
    else if (e.key === 'End') k = n - 1;
    else return;
    e.preventDefault();
    go(k);
  };
  const act = services[Math.min(on, n - 1)];
  return (
    <div className="explorer">
      <div role="tablist" aria-label="Remodeling categories" aria-orientation="vertical" className="tabs-v">
        {services.map((s, i) => (
          <button key={s.id} id={`rt-${i}`} type="button" role="tab" aria-selected={on === i} aria-controls="rem-panel" tabIndex={on === i ? 0 : -1} onClick={() => setOn(i)} onMouseEnter={() => setOn(i)} onKeyDown={onKey}>
            <span>0{i + 1}</span>
            <span>{s.name}</span>
            <i className="ph-duotone ph-arrow-right" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div id="rem-panel" role="tabpanel" aria-labelledby={`rt-${on}`} className="tabpanel">
        {services.map((s, i) => (
          <div key={s.id} className={`tabpanel__img${on === i ? ' is-on' : ''}`} aria-hidden={on !== i}>
            <Photo img={s.image ? { url: s.image, alt: s.alt } : null} alt={s.alt || s.name} placeholder="Illustrative placeholder" />
          </div>
        ))}
        <div className="tabpanel__shade" aria-hidden="true" />
        <div aria-live="polite" className="tabpanel__body">
          <h3>{act.name}</h3>
          <p>{act.need}</p>
          <Link href={estimateHref('remodeling')} className="btn btn--white btn--sm">
            Enquire about this <Icon n="arrow-up-right" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion (aria-expanded, animated height)                      */
/* ------------------------------------------------------------------ */
export function Faqs({ items, prefix }: { items: Faq[]; prefix: string }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  if (!items.length) return <p>Answers to common questions will be added here.</p>;
  return (
    <div className="faqs">
      {items.map((q) => {
        const o = !!open[q.id];
        const b = `${prefix}${q.id}-b`;
        const p = `${prefix}${q.id}-p`;
        return (
          <div key={q.id} className={`faq${o ? ' is-open' : ''}`}>
            <h3>
              <button id={b} type="button" aria-expanded={o} aria-controls={p} onClick={() => setOpen((s) => ({ ...s, [q.id]: !s[q.id] }))}>
                <span>{q.q}</span>
                <span>
                  <Icon n="plus" />
                </span>
              </button>
            </h3>
            <div id={p} role="region" aria-labelledby={b} className="faq__panel">
              <div>
                <p>{q.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* About statement: words light up as it scrolls through the viewport  */
/* ------------------------------------------------------------------ */
export function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const words = text.split(/\s+/).filter(Boolean);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('[data-w]'));
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (r.height + vh * 0.4)));
      spans.forEach((s, i) => (s.style.opacity = i / spans.length < p ? '1' : '0.18'));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, [text]);
  return (
    <h1 id="about-h1" ref={ref} className="statement">
      {words.map((w, i) => (
        <span key={i} data-w="">
          {w}{' '}
        </span>
      ))}
    </h1>
  );
}
