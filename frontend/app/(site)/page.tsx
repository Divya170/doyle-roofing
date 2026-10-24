import Link from 'next/link';
import { getSite } from '@/lib/api';
import { Photo } from '@/components/site/Photo';
import { ArrowCta, Chevron, Flag, Icon } from '@/components/site/Bits';
import { HomeHero, ProcessSteps } from '@/components/site/Interactive';
import { ProjectRail } from '@/components/site/Projects';

export default async function HomePage() {
  const { settings: s, services, steps, projects, images } = await getSite();
  const flags = s.showReviewFlags;
  const marquee = [0, 1].flatMap(() => ['Roofing', 'Remodeling', s.locationLabel, 'Request an estimate'].filter(Boolean));
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      <HomeHero images={images} location={s.locationLabel} />

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {marquee.map((t, i) => (
            <span key={i} className={`marquee__item${i % 2 ? ' is-outline' : ''}`}>
              {t}
              <Chevron w={44} h={28} />
            </span>
          ))}
        </div>
      </div>

      <section aria-labelledby="svc-h" className="wrap sec">
        <div className="sec-head" data-reveal="">
          <h2 id="svc-h" className="h-xl" style={{ maxWidth: '14ch' }}>
            Two crafts. One clear process.
          </h2>
          <p>Pick the side of the house you are thinking about — the roof above it or the rooms inside it.</p>
        </div>
        <div className="tiles">
          <Link href="/roofing" className="tile" data-reveal="">
            <Photo img={images['roof-tile']} tone="dark" alt="roofing work" placeholder="Illustrative placeholder — roofing photograph" />
            <div className="tile__shade" aria-hidden="true" />
            <span className="tile__arrow" aria-hidden="true">
              <Icon n="arrow-up-right" />
            </span>
            <div className="tile__body">
              <span className="tile__k">01 — Roofing</span>
              <span className="tile__t">Protection starts at the top.</span>
              <span className="tile__chips">
                {services.roofing.map((x) => (
                  <span key={x.id}>{x.name}</span>
                ))}
              </span>
            </div>
          </Link>
          <Link href="/remodeling" className="tile tile--sand" data-reveal="">
            <Photo img={images['rem-tile']} tone="sand" alt="remodeling work" placeholder="Illustrative placeholder — remodeling photograph" />
            <div className="tile__shade" aria-hidden="true" />
            <span className="tile__arrow" aria-hidden="true">
              <Icon n="arrow-up-right" />
            </span>
            <div className="tile__body">
              <span className="tile__k">02 — Remodeling</span>
              <span className="tile__t">Spaces reworked around how you live.</span>
              <span className="tile__chips">
                {services.remodeling.map((x) => (
                  <span key={x.id}>{x.name}</span>
                ))}
              </span>
            </div>
          </Link>
        </div>
        <div className="minis">
          <Link href="/estimate" className="mini mini--orange" data-reveal="">
            <Icon n="chats-circle" />
            <span>
              <b>Not sure which one you need?</b>
              <small>Describe it in your own words — we will sort out the category.</small>
            </span>
          </Link>
          <Link href="/projects" className="mini" data-reveal="">
            <Icon n="images-square" />
            <span>
              <b>See the project gallery</b>
              <small>Roofing and remodeling work, filterable by category.</small>
            </span>
          </Link>
          {(s.telHref || s.mailHref) && (
            <div className="mini mini--dark" data-reveal="">
              <Icon n="phone-call" />
              <span className="col" style={{ gap: 6 }}>
                {s.telHref && <a href={s.telHref}>{s.phone}</a>}
                {s.mailHref && <a href={s.mailHref}>{s.email}</a>}
              </span>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="rail-h" className="dark rail-sec">
        <ProjectRail projects={featured} flags={flags}>
          <div className="col" style={{ gap: 16 }}>
            <span className="chip-k chip-k--line">Featured projects</span>
            <h2 id="rail-h" className="h-xl">
              Work, shown plainly.
            </h2>
            {flags && featured.some((p) => p.sample) && <span style={{ fontSize: 15, color: 'var(--on-dark-2)' }}>Sample entries — to be replaced with approved client projects.</span>}
          </div>
        </ProjectRail>
      </section>

      {steps.length > 0 && <ProcessSteps steps={steps} flag={<Flag show={flags}>Draft — approach to confirm</Flag>} />}

      <section aria-labelledby="final-h" className="wrap sec sec-b">
        <div className="final" data-reveal="">
          <div className="col" style={{ gap: 22 }}>
            <h2 id="final-h">Have a project in mind? Start with the details.</h2>
            <p>Four short steps: the project, the property, the details and how to reach you. Photos are optional.</p>
            <ArrowCta href="/estimate" className="alink-self">
              Tell Us About Your Project
            </ArrowCta>
          </div>
          <Link href="/estimate" aria-label="Get an estimate" className="badge">
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="dr-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <text style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15.5, letterSpacing: 4, textTransform: 'uppercase' }} fill="currentColor">
                <textPath href="#dr-circle">Get an estimate · Get an estimate · </textPath>
              </text>
            </svg>
            <span>
              <Icon n="arrow-up-right" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
