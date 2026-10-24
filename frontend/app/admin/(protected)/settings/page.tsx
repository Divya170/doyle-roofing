'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminSettings } from '@/lib/types';
import { EMAIL_RE } from '@/lib/validation';
import { fmtStamp } from '@/lib/format';
import { AdminHeader, ErrorBox, Field, LoadingRows } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = Omit<AdminSettings, 'updatedAt' | 'email' | 'phone' | 'addressLine1' | 'addressLine2'> & { email: string; phone: string; addressLine1: string; addressLine2: string };
type ToggleKey = 'showReviewFlags' | 'estimatesOpen' | 'photoUploadsOpen';

const toForm = (s: AdminSettings): Form => ({
  businessName: s.businessName,
  contactName: s.contactName,
  phone: s.phone || '',
  email: s.email || '',
  addressLine1: s.addressLine1 || '',
  addressLine2: s.addressLine2 || '',
  locationLabel: s.locationLabel,
  statement: s.statement,
  privacyPolicy: s.privacyPolicy,
  showReviewFlags: s.showReviewFlags,
  estimatesOpen: s.estimatesOpen,
  photoUploadsOpen: s.photoUploadsOpen,
});

/** Mirrors the backend rules for instant feedback; the API checks again. */
function check(f: Form) {
  const e: Record<string, string> = {};
  if (f.businessName.trim().length < 2) e.businessName = 'Enter the business name.';
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = 'Enter an email address in the format name@example.com.';
  const d = f.phone.replace(/\D/g, '');
  if (f.phone.trim() && (/[^\d\s()+.\-]/.test(f.phone) || d.length < 10 || d.length > 11)) e.phone = 'Enter a valid phone number with area code, e.g. (713) 555-0142.';
  if (f.statement.length > 400) e.statement = 'Keep the statement under 400 characters.';
  if (f.locationLabel.length > 60) e.locationLabel = 'Use 60 characters or fewer.';
  return e;
}

export default function SettingsPage() {
  const { toast } = useAdmin();
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<AdminSettings>('/admin/settings', { admin: true })
      .then((s) => {
        setSaved(s);
        setForm(toForm(s));
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setDone(false);
    if (errors[k as string])
      setErrors((p) => {
        const n = { ...p };
        delete n[k as string];
        return n;
      });
  };

  const dirty = !!(form && saved && JSON.stringify(form) !== JSON.stringify(toForm(saved)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const fe = check(form);
    setErrors(fe);
    if (Object.keys(fe).length) return document.getElementById(`st-${Object.keys(fe)[0]}`)?.focus();
    setSaving(true);
    try {
      const s = await api<AdminSettings>('/admin/settings', {
        method: 'PATCH',
        admin: true,
        body: { ...form, email: form.email.trim() || null, phone: form.phone.trim() || null, addressLine1: form.addressLine1.trim() || null, addressLine2: form.addressLine2.trim() || null },
      });
      setSaved(s);
      setForm(toForm(s));
      setDone(true);
      toast('Settings saved.');
    } catch (err) {
      const ce = err as ClientApiError;
      setErrors(ce.errors || {});
      if (!Object.keys(ce.errors || {}).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!form) return <LoadingRows rows={8} />;

  const text = (k: 'businessName' | 'contactName' | 'phone' | 'email' | 'addressLine1' | 'addressLine2' | 'locationLabel', label: string, opts: { max?: number; help?: string; type?: string; autoComplete?: string } = {}) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={opts.help}>
      <input id={`st-${k}`} className="control" type={opts.type || 'text'} autoComplete={opts.autoComplete} maxLength={opts.max || 160} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: 'statement' | 'privacyPolicy', label: string, max: number, help?: string, rows = 4) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={help ?? `${form[k].length.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`}>
      <textarea id={`st-${k}`} className="control" rows={rows} maxLength={max} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const toggle = (k: ToggleKey, label: string, help: string) => (
    <div>
      <label className="adm-check">
        <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />
        {label}
      </label>
      <p className="help" style={{ marginLeft: 30 }}>
        {help}
      </p>
    </div>
  );

  return (
    <>
      <AdminHeader eyebrow="SETTINGS" title="Business & settings">
        {saved && <span className="small">Last saved {fmtStamp(saved.updatedAt)}</span>}
      </AdminHeader>
      <form onSubmit={save} noValidate className="col" style={{ gap: 20, maxWidth: 900 }}>
        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-pub-h">
          <h2 id="st-pub-h" className="adm-section-h">
            Estimate form &amp; display
          </h2>
          {toggle('estimatesOpen', 'Accept estimate requests online', 'When off, the estimate page shows a “paused” message with your phone and email, and the API rejects new requests.')}
          {toggle('photoUploadsOpen', 'Allow photo uploads on the estimate form', 'When off, the photo drop zone is hidden in step 3 and uploads are refused. Requests can still be sent without photos.')}
          {toggle('showReviewFlags', 'Show review markers', 'Dashed notes next to content the client still has to confirm (draft steps, sample projects, unconfirmed services). Turn off before launch.')}
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-co-h">
          <h2 id="st-co-h" className="adm-section-h">
            Business &amp; contact
          </h2>
          <p className="small" style={{ margin: 0 }}>
            Used in the header, footer, estimate page, About page, FAQ answers ({'{phone}'}, {'{email}'}, {'{address}'}) and emails. Leave phone, email or address empty to hide them on the site.
          </p>
          <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '18px' }}>
            {text('businessName', 'Business name *', { max: 120, autoComplete: 'organization' })}
            {text('contactName', 'Principal / contact person', { max: 120 })}
            {text('phone', 'Phone', { type: 'tel', max: 30, autoComplete: 'tel', help: 'Confirm the area code with the client.' })}
            {text('email', 'Email', { type: 'email', max: 160, autoComplete: 'email', help: 'Also receives new-request emails unless NOTIFY_TO is set in backend/.env.' })}
            {text('addressLine1', 'Address line 1', { max: 160 })}
            {text('addressLine2', 'Address line 2 (city, state, ZIP)', { max: 160 })}
            {text('locationLabel', 'Location label', { max: 60, help: 'Short label shown on the site, e.g. “Houston, TX”.' })}
          </div>
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-copy-h">
          <h2 id="st-copy-h" className="adm-section-h">
            Page copy &amp; legal
          </h2>
          {area('statement', 'About — company statement', 400, undefined, 3)}
          {area('privacyPolicy', 'Privacy policy (blank line = new paragraph)', 20000, 'Use the wording the client (or their adviser) has approved. Empty = the page says the policy is being finalized.', 10)}
        </section>

        <div className="adm-actions" style={{ position: 'sticky', bottom: 0, padding: '14px 0', background: 'var(--a-bg)' }}>
          <button type="submit" className="abtn" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {dirty && (
            <button type="button" className="abtn abtn--line" onClick={() => saved && setForm(toForm(saved))}>
              Discard changes
            </button>
          )}
          {done && !dirty && (
            <span className="small" role="status">
              ✓ Saved —{' '}
              <a href="/" target="_blank" rel="noreferrer">
                view the site ↗
              </a>
            </span>
          )}
        </div>
      </form>
    </>
  );
}
