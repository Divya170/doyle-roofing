import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { ArrowCta, Flag, Icon } from '@/components/site/Bits';
import { Faqs, Statement } from '@/components/site/Interactive';

export const metadata: Metadata = {
  title: 'About & FAQs',
  description: 'Business facts, the working approach and answers to common questions.',
};

export default async function AboutPage() {
  const { settings: s, steps, faqs } = await getSite();
  const flags = s.showReviewFlags;
  const facts: { k: string; v: string; icon: string; href?: string | null }[] = [
    { k: 'Business', v: s.businessName, icon: 'house-line' },
    { k: 'Principal', v: s.contactName, icon: 'user' },
    { k: 'Services', v: 'Roofing · Remodeling', icon: 'hammer' },
    { k: 'Address', v: s.address, icon: 'map-pin', href: s.mapHref },
    { k: 'Phone', v: s.phone || '', icon: 'phone', href: s.telHref },
    { k: 'Email', v: s.email || '', icon: 'envelope-simple', href: s.mailHref },
  ].filter((f) => f.v);
  return (
    <>
      <section aria-labelledby="about-h1" className="wrap pt-hero">
        <span className="chip-k rise">About &amp; FAQs</span>
        <Statement text={s.statement || `${s.businessName} works on roofing and home remodeling projects.`} />
      </section>

      <section aria-labelledby="facts-h" className="wrap" style={{ paddingTop: 'clamp(56px,7vw,96px)' }}>
        <h2 id="facts-h" className="label" style={{ margin: '0 0 20px' }}>
          Business facts
        </h2>
        <dl className="facts">
          {facts.map((f, i) => (
            <div key={f.k} className={`fact${i === 0 ? ' fact--dark' : i === 3 ? ' fact--soft' : ''}`} data-reveal="">
              <dt>
                <Icon n={f.icon} />
                {f.k}
              </dt>
              <dd>
                {f.href ? (
                  <a href={f.href} {...(f.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}>
                    {f.v}
                  </a>
                ) : (
                  f.v
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {steps.length > 0 && (
        <section aria-labelledby="approach-h" className="wrap sec">
          <div className="sec-head" style={{ marginBottom: 36 }}>
            <h2 id="approach-h" className="h-xl">
              Working approach
            </h2>
            <Flag show={flags}>Draft — approach to confirm</Flag>
          </div>
          <ol className="approach">
            {steps.map((st, i) => (
              <li key={st.id} data-reveal="">
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{st.title}</h3>
                <p>{st.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="faq-h" className="wrap sec faq-sec">
        <div>
          <h2 id="faq-h" className="h-l">
            Common questions
          </h2>
          <Flag show={flags}>Draft answers — client review</Flag>
        </div>
        <Faqs items={faqs.general} prefix="gf" />
      </section>

      <section aria-label="Estimate" className="wrap sec sec-b">
        <div className="cta-band" data-reveal="">
          <h2 className="h-cta">Ready to talk about your project?</h2>
          <ArrowCta href="/estimate">Get an Estimate</ArrowCta>
        </div>
      </section>
    </>
  );
}
