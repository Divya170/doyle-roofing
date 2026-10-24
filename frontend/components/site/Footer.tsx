import Link from 'next/link';
import type { PublicSettings } from '@/lib/types';
import { ArrowCta, wordmark } from './Bits';

export function Footer({ s }: { s: PublicSettings }) {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr__top">
          <p>Let’s talk about your home.</p>
          <ArrowCta href="/estimate">Get an Estimate</ArrowCta>
        </div>
        <div className="ftr__grid">
          <nav aria-label="Footer pages" className="ftr__col">
            <span className="label" style={{ color: 'var(--on-dark-2)' }}>
              Pages
            </span>
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/about">About &amp; FAQs</Link>
            <Link href="/estimate">Request an Estimate</Link>
          </nav>
          <nav aria-label="Footer services" className="ftr__col">
            <span className="label" style={{ color: 'var(--on-dark-2)' }}>
              Services
            </span>
            <Link href="/roofing">Roofing</Link>
            <Link href="/remodeling">Remodeling</Link>
          </nav>
          <div className="ftr__col">
            <span className="label" style={{ color: 'var(--on-dark-2)' }}>
              Contact
            </span>
            {s.telHref && <a href={s.telHref}>{s.phone}</a>}
            {s.mailHref && <a href={s.mailHref}>{s.email}</a>}
            {s.address &&
              (s.mapHref ? (
                <a href={s.mapHref} target="_blank" rel="noopener">
                  {s.address}
                </a>
              ) : (
                <span>{s.address}</span>
              ))}
          </div>
        </div>
        <div className="ftr__bot">
          <span>
            © {new Date().getFullYear()} {s.businessName}
          </span>
          {s.showReviewFlags && <span>Illustrative imagery and draft content pending client approval.</span>}
          <span className="flex-wrap" style={{ gap: '8px 20px' }}>
            <Link href="/privacy">Privacy</Link>
            <a href="/admin" rel="nofollow">
              Staff sign-in
            </a>
          </span>
        </div>
      </div>
      <div className="ftr__word" aria-hidden="true">
        {wordmark(s.businessName)[0]}
      </div>
    </footer>
  );
}
