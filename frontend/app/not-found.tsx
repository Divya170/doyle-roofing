import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main id="main" className="state">
      <span className="chip-k">Page not found</span>
      <h1>We couldn’t find that page.</h1>
      <p>The page may have moved. Start from the home page or tell us about your project.</p>
      <div className="btns">
        <Link href="/" className="btn btn--line btn--md">
          Back to home
        </Link>
        <Link href="/estimate" className="btn btn--primary btn--md">
          Get an Estimate
        </Link>
      </div>
    </main>
  );
}
