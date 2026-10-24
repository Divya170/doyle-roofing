import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { Icon } from '@/components/site/Bits';
import { ProjectsBrowser } from '@/components/site/Projects';

export const metadata: Metadata = {
  title: 'Project gallery',
  description: 'Browse roofing and remodeling work by category.',
};

export default async function ProjectsPage({ searchParams }: { searchParams: { cat?: string } }) {
  const { settings: s, projects } = await getSite();
  const anySample = projects.some((p) => p.sample);
  return (
    <div className="wrap pt-hero sec-b">
      <div className="split" style={{ alignItems: 'end' }}>
        <h1 className="h-lines" style={{ font: '800 clamp(46px,8vw,124px)/.92 var(--f-d)', letterSpacing: '-.05em', color: 'var(--slate)' }}>
          <span>
            <span className="rise">Project</span>
          </span>
          <span>
            <span className="rise" style={{ color: 'var(--btn)', ['--i' as string]: 1 }}>
              gallery.
            </span>
          </span>
        </h1>
        <div className="col rise" style={{ gap: 16, ['--i' as string]: 2 }}>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>Browse roofing and remodeling work by category. Open any project for photographs and details.</p>
          {s.showReviewFlags && anySample && (
            <p className="note-box">
              <Icon n="info" />
              <span>Entries marked “Sample entry” are placeholders showing how approved projects will appear. They do not represent completed {s.businessName} work.</span>
            </p>
          )}
        </div>
      </div>
      <ProjectsBrowser projects={projects} initial={typeof searchParams.cat === 'string' ? searchParams.cat : 'all'} flags={s.showReviewFlags} />
    </div>
  );
}
