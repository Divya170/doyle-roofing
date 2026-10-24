/**
 * Shared, framework-free helpers for the public estimate form.
 * Patterns and messages are the design's own; unit-tested in rules.spec.ts.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Houston, TX — used for admin timestamps and CSV exports. */
export const TZ = 'America/Chicago';

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Strip control characters (keep newlines when multiline), normalise line endings, trim. */
export const tidy = (v: unknown, multiline = false) =>
  str(v)
    .replace(multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();

/** Single-line value with internal whitespace collapsed. */
export const line = (v: unknown) => tidy(v).replace(/\s+/g, ' ');

export const digits = (v: unknown) => str(v).replace(/\D/g, '');

/** Design: only digits, spaces and ( ) + . - with 10–11 digits (US number, optional leading 1). */
export const phoneOk = (v: string) => {
  const d = digits(v);
  return !/[^\d\s()+.\-]/.test(v) && d.length >= 10 && d.length <= 11;
};

/** Honeypot field `website` (hidden from people). */
export const isHoneypot = (v: unknown) => str(v).trim() !== '';

/** CSV cell, quoted, with spreadsheet-formula injection neutralised. */
export function csvSafe(v: unknown): string {
  let x = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(x)) x = `'${x}`;
  return `"${x.replace(/"/g, '""')}"`;
}

/** Public reference (design: "DRR-xxxxx"): DRR-1001, DRR-1002, … */
export const publicRef = (id: number) => `DRR-${1000 + id}`;

/** Lead statuses (Handoff: "status tracking"). */
export const REQUEST_STATUSES = ['new', 'contacted', 'assessment', 'estimate_sent', 'won', 'closed'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  assessment: 'Assessment booked',
  estimate_sent: 'Estimate sent',
  won: 'Won',
  closed: 'Closed',
};

/** Idempotency-Key header: printable, 8–200 chars, else ignored. */
export const cleanIdemKey = (v: unknown) => {
  const s = str(Array.isArray(v) ? v[0] : v).trim();
  return /^[\x21-\x7e]{8,200}$/.test(s) ? s : null;
};
