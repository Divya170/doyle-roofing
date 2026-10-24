import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default async function PrivacyPage() {
  const { settings: s } = await getSite();
  const paras = paragraphs(s.privacyPolicy);
  return (
    <section className="wrap pt-hero sec-b">
      <span className="chip-k">Privacy</span>
      <h1 className="h-xl" style={{ margin: '24px 0 32px' }}>
        Privacy policy.
      </h1>
      <div className="legal">
        {paras.length ? (
          paras.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p>
            The privacy policy is being finalized and will be published here once approved. Details sent through the estimate form — including any photos — are used only to respond to your request.
            {s.mailHref && (
              <>
                {' '}
                Questions can be sent to <a href={s.mailHref}>{s.email}</a>.
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
