'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '@/lib/types';
import { estimateHref } from '@/lib/links';
import { Photo } from './Photo';
import { Icon } from './Bits';

const PH = 'Illustrative placeholder — approved project photograph';

/** Lightbox state shared by every project list: open index, prev/next, focus return. */
function useLightbox(count: number) {
  const [i, setI] = useState<number | null>(null);
  const ret = useRef<HTMLElement | null>(null);
  const open = (k: number, el: HTMLElement) => {
    ret.current = el;
    setI(k);
  };
  const close = useCallback(() => {
    setI(null);
    setTimeout(() => ret.current?.focus(), 30);
  }, []);
  const step = useCallback((d: number) => setI((x) => (x === null || !count ? x : (x + d + count) % count)), [count]);
  return { i, open, close, step };
}

/** Before/after comparison — shown only when a genuine pair is supplied. */
function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ba" style={{ ['--pos' as string]: `${pos}%` }}>
      <img src={before} alt={`Before: ${alt}`} />
      <img src={after} alt={`After: ${alt}`} className="ba__after" />
      <span className="ba__k" style={{ left: 14 }}>
        Before
      </span>
      <span className="ba__k" style={{ right: 14 }}>
        After
      </span>
      <span className="ba__line" aria-hidden="true" />
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after" />
    </div>
  );
}

function Lightbox({ list, i, onClose, onStep, flags }: { list: Project[]; i: number; onClose: () => void; onStep: (d: number) => void; flags: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const p = list[i];

  useEffect(() => {
    closeRef.current?.focus();
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = o;
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && !(e.target instanceof HTMLInputElement)) onStep(1);
      else if (e.key === 'ArrowLeft' && !(e.target instanceof HTMLInputElement)) onStep(-1);
      else if (e.key === 'Tab' && ref.current) {
        const els = Array.from(ref.current.querySelectorAll<HTMLElement>('button, a[href], input')).filter((x) => !(x as HTMLButtonElement).disabled);
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);

  if (!p) return null;
  const pair = !!(p.beforeImage && p.afterImage);
  return (
    <div className="lb-bg" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="lb-title" className="lb" onClick={(e) => e.stopPropagation()}>
        <div className="lb__media">
          {pair ? <BeforeAfter before={p.beforeImage!} after={p.afterImage!} alt={p.imageAlt} /> : <Photo img={p.image ? { url: p.image, alt: p.imageAlt } : null} alt={p.imageAlt} placeholder="Illustrative placeholder — an approved project photograph goes here" />}
        </div>
        <div className="lb__side">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: '700 13px var(--f-d)', color: 'var(--muted)' }}>
              {String(i + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
            </span>
            <button ref={closeRef} type="button" className="lb__close" aria-label="Close project details" onClick={onClose}>
              <Icon n="x" />
            </button>
          </div>
          <span className="tags">
            <span className="tag">{p.categoryLabel}</span>
            {p.sample && <span className="tag tag--sample-l">Sample entry</span>}
          </span>
          <h2 id="lb-title">{p.title}</h2>
          <p>{p.description}</p>
          {flags && !pair && <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>A before-and-after comparison appears only when a genuine, matching image pair is supplied.</p>}
          <Link href={estimateHref(p.category)} className="btn btn--primary" style={{ alignSelf: 'flex-start' }}>
            Request a similar estimate
          </Link>
          {list.length > 1 && (
            <div className="lb__nav">
              <button type="button" aria-label="Previous project" onClick={() => onStep(-1)}>
                <Icon n="arrow-left" />
                Previous
              </button>
              <button type="button" aria-label="Next project" onClick={() => onStep(1)}>
                Next
                <Icon n="arrow-right" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ p, onOpen, Heading = 'h3', className = '', arrow, dark }: { p: Project; onOpen: (el: HTMLElement) => void; Heading?: 'h2' | 'h3'; className?: string; arrow?: boolean; dark?: boolean }) {
  return (
    <article className={`pcard ${className}`.trim()} data-reveal="">
      <Photo img={p.image ? { url: p.image, alt: p.imageAlt } : null} alt={p.imageAlt} placeholder={PH} tone={dark ? 'dark' : 'light'} />
      <div className="pcard__shade" aria-hidden="true" />
      {arrow && (
        <span className="pcard__arrow" aria-hidden="true">
          <Icon n="arrow-up-right" />
        </span>
      )}
      <div className="pcard__body">
        <span className="tags">
          {(arrow || dark) && <span className="tag">{p.categoryLabel}</span>}
          {p.sample && <span className="tag tag--sample">Sample entry</span>}
        </span>
        <Heading>{p.title}</Heading>
      </div>
      <button type="button" className="pcard__btn" aria-label={`View details: ${p.title}${p.sample ? ' (sample entry)' : ''}`} onClick={(e) => onOpen(e.currentTarget)} />
    </article>
  );
}

/** Home "Featured projects" rail: snap scrolling, prev/next buttons, drag with the mouse. */
export function ProjectRail({ projects, flags, children }: { projects: Project[]; flags: boolean; children: React.ReactNode }) {
  const lb = useLightbox(projects.length);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const by = (d: number) => {
    const el = rail.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: d * el.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' });
  };
  const endDrag = () => {
    if (rail.current) rail.current.style.scrollSnapType = '';
  };
  return (
    <>
      <div className="wrap sec-head">
        {children}
        <div className="flex-wrap" style={{ gap: 10, alignItems: 'center' }}>
          {projects.length > 1 && (
            <>
              <button type="button" className="circle-btn" aria-label="Scroll projects left" onClick={() => by(-1)}>
                <Icon n="arrow-left" />
              </button>
              <button type="button" className="circle-btn" aria-label="Scroll projects right" onClick={() => by(1)}>
                <Icon n="arrow-right" />
              </button>
            </>
          )}
          <Link href="/projects" className="link-u" style={{ marginLeft: 8 }}>
            View all
          </Link>
        </div>
      </div>
      {projects.length === 0 ? (
        <p className="wrap" style={{ fontSize: 19, color: 'var(--on-dark)' }}>
          Project stories will appear here once approved work is published.
        </p>
      ) : (
        <div
          ref={rail}
          className="rail"
          style={{ cursor: 'grab' }}
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse' || !rail.current) return;
            drag.current = { x: e.clientX, left: rail.current.scrollLeft, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || !rail.current) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 5) {
              d.moved = true;
              rail.current.style.scrollSnapType = 'none';
            }
            rail.current.scrollLeft = d.left - dx;
          }}
          onPointerUp={() => {
            endDrag();
            setTimeout(() => (drag.current = null), 50);
          }}
          onPointerLeave={() => {
            endDrag();
            drag.current = null;
          }}
        >
          {projects.map((p, k) => (
            <Card key={p.id} p={p} dark onOpen={(el) => !drag.current?.moved && lb.open(k, el)} />
          ))}
        </div>
      )}
      {lb.i !== null && <Lightbox list={projects} i={lb.i} onClose={lb.close} onStep={lb.step} flags={flags} />}
    </>
  );
}

/** Roofing / Remodeling page project grid. */
export function ProjectGrid({ projects, flags, empty }: { projects: Project[]; flags: boolean; empty: string }) {
  const lb = useLightbox(projects.length);
  if (!projects.length) return <p style={{ fontSize: 18, color: 'var(--slate)' }}>{empty}</p>;
  return (
    <>
      <div className="pgrid">
        {projects.map((p, k) => (
          <Card key={p.id} p={p} onOpen={(el) => lb.open(k, el)} />
        ))}
      </div>
      {lb.i !== null && <Lightbox list={projects} i={lb.i} onClose={lb.close} onStep={lb.step} flags={flags} />}
    </>
  );
}

const FILTERS = [
  ['all', 'All'],
  ['roofing', 'Roofing'],
  ['remodeling', 'Remodeling'],
] as const;

/** Projects page: filters with counts, bento grid, empty state, lightbox. */
export function ProjectsBrowser({ projects, initial, flags }: { projects: Project[]; initial: string; flags: boolean }) {
  const [filter, setFilter] = useState<string>(FILTERS.some(([k]) => k === initial) ? initial : 'all');
  const list = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
  const lb = useLightbox(list.length);
  const grid = useRef<HTMLDivElement>(null);

  const pick = (k: string) => {
    setFilter(k);
    // Keep the URL shareable (design: #/projects?cat=…)
    const url = k === 'all' ? '/projects' : `/projects?cat=${k}`;
    window.history.replaceState(null, '', url);
    if (grid.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) grid.current.animate?.([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)' });
  };
  const label = filter === 'all' ? '' : `${filter} `;

  return (
    <>
      <div role="group" aria-label="Filter projects by category" className="filters">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => pick(k)}>
            {l}
            <span>{k === 'all' ? projects.length : projects.filter((p) => p.category === k).length}</span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        Showing {list.length} {label}projects
      </p>
      {list.length ? (
        <div ref={grid} className="bento">
          {list.map((p, k) => (
            <Card key={p.id} p={p} Heading="h2" arrow className={k % 6 === 0 ? 'is-big' : k % 6 === 3 ? 'is-tall' : ''} onOpen={(el) => lb.open(k, el)} />
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <Icon n="images" />
          <h2>{filter === 'all' ? 'No projects published yet' : `No ${filter} projects published yet`}</h2>
          <p>Approved projects will appear here as they are published. In the meantime, you are welcome to tell us about your own project.</p>
          <div className="btns">
            {filter !== 'all' && projects.length > 0 && (
              <button type="button" className="btn btn--line" onClick={() => pick('all')}>
                Show all projects
              </button>
            )}
            <Link href="/estimate" className="btn btn--primary">
              Get an Estimate
            </Link>
          </div>
        </div>
      )}
      {lb.i !== null && <Lightbox list={list} i={lb.i} onClose={lb.close} onStep={lb.step} flags={flags} />}
    </>
  );
}
