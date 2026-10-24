'use client';

import { RequestList } from '@/components/admin/RequestList';
import type { Estimate } from '@/lib/types';

const photoText = (n?: number) => (n ? `${n} photo${n === 1 ? '' : 's'}` : '—');

export default function EstimatesPage() {
  return (
    <RequestList<Estimate>
      kind="estimates"
      title="Estimate requests"
      searchLabel="Search by reference, name, email, location or description"
      noneText="No estimate requests yet. Requests sent from the website appear here."
      typeFilter
      columns={[
        { head: 'Name', cell: (x) => <strong>{x.name}</strong> },
        { head: 'Project', cell: (x) => x.typeLabel, nowrap: true },
        { head: 'Property · location', cell: (x) => `${x.property} · ${x.location}` },
        { head: 'Timeline', cell: (x) => x.timeline },
        { head: 'Photos', cell: (x) => photoText(x.photoCount), nowrap: true },
      ]}
      card={(x) => ({ title: x.name, line: `${x.typeLabel} · ${x.property} · ${x.location}`, meta: `${x.timeline}${x.photoCount ? ` · ${photoText(x.photoCount)}` : ''}` })}
    />
  );
}
