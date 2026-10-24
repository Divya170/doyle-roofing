import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { estimateHref, projectsHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { ArrowCta, Flag, RiseLines } from '@/components/site/Bits';
import { Faqs, RoofPanels } from '@/components/site/Interactive';
import { ProjectGrid } from '@/components/site/Projects';

export const metadata: Metadata = {
  title: 'Roofing',
  description: 'Roof repair, replacement, inspection and maintenance. Tell us what you are seeing and request a roofing estimate.',
};

export default async function RoofingPage() {
  const { settings: s, services, faqs, projects, images } = await getSite();
  const flags = s.showReviewFlags;
  const mine = projects.filter((p) => p.category === 'roofing');
  return (
    <>
      <section aria-labelledby="roof-h1" className="dark pt-hero page-hero">
        <div className="wrap split">
          <div className="col" style={{ gap: 24 }}>
            <span className="chip-k chip-k--line rise">Roofing</span>
            <h1 id="roof-h1" className="h-page h-lines">
              <RiseLines a="Roofing work," b="explained clearly." start={1} />
            </h1>
          </div>
          <div className="col rise" style={{ gap: 24, ['--i' as string]: 3 }}>
            <p className="lead">Whether you have noticed a problem or are planning ahead, start by telling us what you are seeing. Those details shape the conversation about the right next step for your roof.</p>
            <div className="btns">
              <ArrowCta href={estimateHref('roofing')} size="md">
                Request a roofing estimate
              </ArrowCta>
              <a href="#roof-projects" className="btn btn--ghost btn--md" style={{ background: 'transparent' }}>
                See roofing projects
              </a>
            </div>
          </div>
        </div>
        <div className="wrap">
          <div className="wide-photo clip-in">
            <Photo img={images['roof-hero']} tone="dark" eager alt="roofing work" placeholder="Illustrative placeholder — roofing hero photograph" />
          </div>
        </div>
      </section>

      <section aria-labelledby="roof-svc-h" className="wrap sec">
        <div className="sec-head" data-reveal="">
          <h2 id="roof-svc-h" className="h-xl">
            What are you dealing with?
          </h2>
          <Flag show={flags}>Candidate services — confirm before launch</Flag>
        </div>
        <RoofPanels services={services.roofing} />
      </section>

      <section aria-labelledby="roof-detail-h" className="wrap sec materials">
        <div className="materials__grid" data-reveal="">
          <Photo img={images['roof-material-1']} alt="roofing material close-up" placeholder="Illustrative — material close-up" />
          <Photo img={images['roof-material-2']} alt="roofing process detail" placeholder="Illustrative — process detail" />
          <Photo img={images['roof-material-3']} alt="finished roof edge" placeholder="Illustrative — finished edge" />
        </div>
        <div className="col" style={{ gap: 16 }} data-reveal="">
          <span className="label">Materials &amp; process</span>
          <h2 id="roof-detail-h" style={{ font: '800 clamp(28px,3.2vw,46px)/1.04 var(--f-d)', letterSpacing: '-.035em', color: 'var(--slate)' }}>
            The details that sit above your ceiling.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.65 }}>
            {images['roof-material-1'] ? 'A closer look at materials and the way the work is carried out.' : `Material options and process photography will be added here once supplied and approved by ${s.businessName}.`}
          </p>
        </div>
      </section>

      <section id="roof-projects" aria-labelledby="roof-proj-h" className="wrap sec" style={{ scrollMarginTop: 100 }}>
        <div className="sec-head" style={{ marginBottom: 28 }}>
          <h2 id="roof-proj-h" className="h-l">
            Roofing projects
          </h2>
          <a href={projectsHref('roofing')} className="link-u">
            All roofing projects
          </a>
        </div>
        <ProjectGrid projects={mine} flags={flags} empty="No roofing projects have been published yet." />
      </section>

      <section aria-labelledby="roof-faq-h" className="wrap sec faq-sec">
        <div>
          <h2 id="roof-faq-h" className="h-l">
            Roofing questions
          </h2>
          <Flag show={flags}>Draft answers — client review</Flag>
        </div>
        <Faqs items={faqs.roofing} prefix="rf" />
      </section>

      <section aria-label="Roofing estimate" className="wrap sec sec-b">
        <div className="cta-band" data-reveal="">
          <h2 className="h-cta">Tell us what is happening with your roof.</h2>
          <ArrowCta href={estimateHref('roofing')}>Request a roofing estimate</ArrowCta>
        </div>
      </section>
    </>
  );
}
