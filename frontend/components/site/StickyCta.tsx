'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Design sticky mobile CTA (below 640px via CSS), hidden on the estimate page itself. */
export function StickyCta() {
  const path = usePathname();
  if (path?.startsWith('/estimate')) return null;
  return (
    <div className="sticky-cta">
      <Link href="/estimate" className="btn btn--primary">
        Get an Estimate
      </Link>
    </div>
  );
}
