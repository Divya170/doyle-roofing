'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/links';
import { Chevron, Icon, wordmark } from './Bits';

const isCurrent = (path: string, href: string) => (href === '/' ? path === '/' : path.startsWith(href));
/** Pages that open with a dark hero: the header starts transparent/light-on-dark (design onDark). */
const DARK_HERO = ['/', '/roofing'];

export function Header({ name, phone, telHref, email, mailHref, address }: { name: string; phone: string | null; telHref: string | null; email: string | null; mailHref: string | null; address: string }) {
  const path = usePathname() || '/';
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const bar = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [top, sub] = wordmark(name);

  // Scroll progress bar + header state (design tick())
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
      setScrolled(y > 12);
      setOverHero(y < Math.max(300, window.innerHeight * 0.7) - 80);
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
  }, [path]);

  const close = useCallback(() => {
    setMenu(false);
    setTimeout(() => openBtn.current?.focus(), 20);
  }, []);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    closeBtn.current?.focus();
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && menuRef.current) {
        const els = Array.from(menuRef.current.querySelectorAll<HTMLElement>('button, a[href]'));
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
    const onResize = () => window.innerWidth >= 1000 && setMenu(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = o;
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menu, close]);

  const onDark = DARK_HERO.includes(path) && overHero && !menu;

  return (
    <>
      <div ref={bar} className="progress" aria-hidden="true" />
      <header className={`hdr${onDark ? ' on-dark' : ''}${scrolled ? ' is-scrolled' : ''}`}>
        <div className="hdr__bar">
          <Link href="/" className="logo" aria-label={`${name}, home`}>
            <Chevron />
            <span>
              <b>{top}</b>
              <small>{sub}</small>
            </span>
          </Link>
          <nav aria-label="Primary" className="nav">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={isCurrent(path, n.href) ? 'page' : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hdr__act">
            <Link href="/estimate" className="btn btn--primary btn--arrow hdr__cta">
              Get an Estimate
              <span className="dot">
                <Icon n="arrow-up-right" />
              </span>
            </Link>
            <button ref={openBtn} type="button" className="menu-btn" aria-expanded={menu} aria-controls="mobile-menu" aria-label="Open menu" onClick={() => setMenu(true)}>
              <Icon n="list" />
            </button>
          </div>
        </div>
      </header>
      {menu && (
        <div id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" aria-label="Site menu" className="mmenu">
          <div className="mmenu__top">
            <b>{top}</b>
            <button ref={closeBtn} type="button" className="mmenu__close" aria-label="Close menu" onClick={close}>
              <Icon n="x" />
            </button>
          </div>
          <nav aria-label="Mobile">
            <ul>
              {NAV.map((n, i) => (
                <li key={n.href} style={{ ['--i' as string]: i }}>
                  <Link href={n.href} aria-current={isCurrent(path, n.href) ? 'page' : undefined}>
                    <span>0{i + 1}</span>
                    <span>{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mmenu__foot">
            <Link href="/estimate" className="btn btn--primary">
              Get an Estimate
            </Link>
            <div className="mmenu__contact">
              {telHref && <a href={telHref}>{phone}</a>}
              {mailHref && <a href={mailHref}>{email}</a>}
              {address && <span>{address}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
