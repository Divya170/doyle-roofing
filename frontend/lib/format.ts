/** Houston, TX */
export const TZ = 'America/Chicago';

/** Admin timestamps, shown in Houston time. */
export function fmtStamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** Design fmtSize(): bytes → "820 KB" / "3.4 MB". */
export const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export const paragraphs = (s: string) =>
  (s || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Lead statuses (mirrors backend REQUEST_STATUSES). */
export const STATUSES = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['assessment', 'Assessment booked'],
  ['estimate_sent', 'Estimate sent'],
  ['won', 'Won'],
  ['closed', 'Closed'],
] as const;

export const DELIVERY: Record<string, string> = { disabled: 'Not configured', pending: 'Queued', sent: 'Sent', failed: 'Failed' };
