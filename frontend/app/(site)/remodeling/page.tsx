import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { estimateHref, projectsHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { ArrowCta, Flag, RiseLines } from '@/components/site/Bits';
import { Faqs, RemodelTabs } from '@/components/site/Interactive';
import { ProjectGrid } from '@/components/site/Projects';

export const metadata: Metadata = {
  title: 'Remodeling',
  description: 'Kitchen, bathroom, interior and exterior remodeling. Tell us which space you are planning — you do not need finished plans to start.',
};

export default async function RemodelingPage() {
  const { settings: s, services, faqs, projects, images } = await getSite();
  const flags = s.showReviewFlags;
  const mine = projects.filter((p) => p.category === 'remodeling');
  return (
    <>
      <section aria-labelledby="rem-h1" className="pt-hero page-hero page-hero--sand">
        <div className="wrap split">
          <div className="col" style={{ gap: 24 }}>
            <span className="chip-k chip-k--sand rise">Remodeling</span>
            <h1 id="rem-h1" className="h-page h-lines">
              <RiseLines a="Start with how" b="you live." start={1} />
            </h1>
            <p className="lead rise" style={{ ['--i' as string]: 3 }}>
              Tell us which space you are thinking about, what is not working today and what you would like it to become. You do not need finished plans to start.
            </p>
            <div className="btns rise" style={{ ['--i' as string]: 4 }}>
              <ArrowCta href={estimateHref('remodeling')} size="md">
                Enquire about a remodel
              </ArrowCta>
              <a href="#rem-projects" className="btn btn--line btn--md">
                See remodeling projects
              </a>
            </div>
          </div>
          <div className="duo">
            <Photo img={images['rem-hero']} tone="sand" eager className="clip-in" alt="renovated interior" placeholder="Illustrative placeholder — renovated interior" />
            <Photo img={images['rem-hero-2']} className="clip-in" alt="remodeling detail" placeholder="Illustrative — detail" />
          </div>
        </div>
      </section>

      <section aria-labelledby="rem-svc-h" className="wrap sec">
        <div className="sec-head" data-reveal="">
          <h2 id="rem-svc-h" className="h-xl">
            Which space are you planning?
          </h2>
          <Flag show={flags}>Candidate categories — confirm before launch</Flag>
        </div>
        <RemodelTabs services={services.remodeling} />
      </section>

      <section id="rem-projects" aria-labelledby="rem-proj-h" className="wrap sec" style={{ scrollMarginTop: 100 }}>
        <div className="sec-head" style={{ marginBottom: 28 }}>
          <h2 id="rem-proj-h" className="h-l">
            Remodeling projects
          </h2>
          <a href={projectsHref('remodeling')} className="link-u">
            All remodeling projects
          </a>
        </div>
        <ProjectGrid projects={mine} flags={flags} empty="No remodeling projects have been published yet." />
      </section>

      <section aria-labelledby="rem-faq-h" className="wrap sec faq-sec">
        <div>
          <h2 id="rem-faq-h" className="h-l">
            Remodeling questions
          </h2>
          <Flag show={flags}>Draft answers — client review</Flag>
        </div>
        <Faqs items={faqs.remodeling} prefix="mf" />
      </section>

      <section aria-label="Remodeling enquiry" className="wrap sec sec-b">
        <div className="cta-band cta-band--sand" data-reveal="">
          <h2 className="h-cta">Plans still taking shape? Start here.</h2>
          <ArrowCta href={estimateHref('remodeling')}>Enquire about a remodel</ArrowCta>
        </div>
      </section>
    </>
  );
}
