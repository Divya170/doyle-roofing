import Link from 'next/link';

/** Phosphor duotone icon (decorative). */
export const Icon = ({ n, className, style }: { n: string; className?: string; style?: React.CSSProperties }) => (
  <i className={`ph-duotone ph-${n}${className ? ` ${className}` : ''}`} aria-hidden="true" style={style} />
);

/** The roof chevron from the wordmark. */
export const Chevron = ({ w = 30, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 34 22" aria-hidden="true">
    <path d="M2 20 L17 4 L32 20" fill="none" stroke="#C87943" strokeWidth="3.5" />
  </svg>
);

/** Pill CTA with the white circular arrow (design .btn-primary pattern). */
export function ArrowCta({ href, children, size = 'lg', className = '' }: { href: string; children: React.ReactNode; size?: 'lg' | 'md' | 'sm'; className?: string }) {
  return (
    <Link href={href} className={`btn btn--primary btn--arrow btn--${size} ${className}`.trim()}>
      {children}
      <span className="dot">
        <Icon n="arrow-up-right" />
      </span>
    </Link>
  );
}

/** Dashed review note ("Draft — approach to confirm"), only while Settings → review flags is on. */
export function Flag({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <span className="flag">
      <Icon n="note-pencil" />
      {children}
    </span>
  );
}

/** Splits a headline into the design's masked "rise" lines; the second line is warm-coloured. */
export function RiseLines({ a, b, start = 0 }: { a: string; b: string; start?: number }) {
  return (
    <>
      <span>
        <span className="rise" style={{ ['--i' as string]: start }}>
          {a}
        </span>
      </span>
      <span>
        <span className="rise warm" style={{ ['--i' as string]: start + 1 }}>
          {b}
        </span>
      </span>
    </>
  );
}

/** "Doyle Roofing & Remodeling" → ["DOYLE", "Roofing & Remodeling"] for the wordmark. */
export function wordmark(name: string) {
  const [first, ...rest] = (name || 'Doyle Roofing & Remodeling').split(' ');
  return [first.toUpperCase(), rest.join(' ')] as const;
}
