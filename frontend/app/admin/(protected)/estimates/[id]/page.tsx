'use client';

import { RequestDetail, tel } from '@/components/admin/RequestDetail';
import { fmtSize } from '@/lib/format';
import type { Estimate } from '@/lib/types';

const isHeic = (m: string) => /heic|heif/i.test(m);

export default function EstimateDetailPage() {
  return (
    <RequestDetail<Estimate>
      kind="estimates"
      noun="estimate request"
      mailSubject={(x) => `Your ${x.typeLabel.toLowerCase()} estimate request ${x.publicRef || ''}`.trim()}
      fields={(x) => {
        const rows: [string, React.ReactNode, boolean?][] = [
          ['Project', x.typeLabel],
          x.type === 'roofing' ? ['What’s going on with the roof', x.roofIssues.join(', ') || '—'] : ['Areas involved', x.areas.join(', ') || '—'],
        ];
        if (x.type === 'roofing') rows.push(['Roof age', x.roofAge || '—']);
        rows.push(
          ['Property type', x.property],
          ['Location', x.location],
          ['Preferred timeline', x.timeline],
          ['Budget range', x.budget],
          ['Phone', x.phone ? <a href={tel(x.phone)}>{x.phone}</a> : '—'],
          ['Email', x.email ? <a href={`mailto:${x.email}`}>{x.email}</a> : '—'],
          ['Description', x.description, true],
        );
        return rows;
      }}
      extra={(x) => (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef2f1' }}>
          <h2 className="h-card" style={{ marginBottom: 10 }}>
            Customer photos{x.photos ? ` (${x.photos.length})` : ''}
          </h2>
          {!x.photos?.length ? (
            <p className="small" style={{ margin: 0 }}>
              No photos were attached.
            </p>
          ) : (
            <ul className="photos" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {x.photos.map((p) => (
                <li key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  {isHeic(p.mime) ? (
                    <a href={`${p.url}?download=1`} className="abtn abtn--line abtn--sm" style={{ minHeight: 96, flexDirection: 'column', textAlign: 'center' }}>
                      Download
                      <span className="small">HEIC can’t be previewed</span>
                    </a>
                  ) : (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.name} full size (opens in a new tab)`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} loading="lazy" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, background: '#eef2f1', display: 'block' }} />
                    </a>
                  )}
                  <span className="small" style={{ overflowWrap: 'anywhere' }}>
                    {p.name} · {fmtSize(p.size)}{' '}
                    <a href={`${p.url}?download=1`} style={{ fontWeight: 600 }}>
                      Download
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    />
  );
}
