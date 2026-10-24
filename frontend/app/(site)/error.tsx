'use client';

import Link from 'next/link';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="state" role="alert">
      <span className="chip-k">Something went wrong</span>
      <h1>This page didn’t load.</h1>
      <p>Please try again. You can still request an estimate or call us.</p>
      <div className="btns">
        <button type="button" className="btn btn--line btn--md" onClick={reset}>
          Try again
        </button>
        <Link href="/estimate" className="btn btn--primary btn--md">
          Get an Estimate
        </Link>
      </div>
    </section>
  );
}
