'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminProject, Category } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

interface Form {
  id?: number;
  category: Category | '';
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  beforeImage: string;
  afterImage: string;
  featured: boolean;
  sample: boolean;
  published: boolean;
}

const BLANK: Form = { category: '', title: '', description: '', image: '', imageAlt: '', beforeImage: '', afterImage: '', featured: false, sample: false, published: false };

const toForm = (p: AdminProject): Form => ({
  id: p.id,
  category: p.category,
  title: p.title,
  description: p.description,
  image: p.image || '',
  imageAlt: p.imageAlt,
  beforeImage: p.beforeImage || '',
  afterImage: p.afterImage || '',
  featured: p.featured,
  sample: p.sample,
  published: p.published,
});

const IMAGE_OK = /^(\/uploads\/[\w.-]+|https:\/\/\S+)$/;

/** Mirrors the backend's validateProject() for instant feedback. */
function validate(f: Form) {
  const e: Record<string, string> = {};
  const t = f.title.trim();
  const d = f.description.trim();
  if (!f.category) e.category = 'Choose Roofing or Remodeling.';
  if (t.length < 2) e.title = 'Enter a project title.';
  else if (t.length > 120) e.title = 'Use 120 characters or fewer.';
  if (d.length > 1500) e.description = 'Use 1,500 characters or fewer.';
  else if (f.published && d.length < 20) e.description = 'Add a description (at least 20 characters) before publishing.';
  for (const [k, v] of [['image', f.image], ['beforeImage', f.beforeImage], ['afterImage', f.afterImage]] as const) {
    if (v.trim() && !IMAGE_OK.test(v.trim())) e[k] = 'Upload an image or use an https:// URL.';
  }
  if (f.image.trim() && !f.imageAlt.trim()) e.imageAlt = 'Describe the photo for screen-reader users.';
  if (f.imageAlt.trim().length > 200) e.imageAlt = 'Use 200 characters or fewer.';
  if (!!f.beforeImage.trim() !== !!f.afterImage.trim()) e[f.beforeImage.trim() ? 'afterImage' : 'beforeImage'] = 'Add both a before and an after photo, or neither.';
  return e;
}

const toBody = (f: Form) => ({
  category: f.category,
  title: f.title.trim(),
  description: f.description.trim(),
  image: f.image.trim(),
  imageAlt: f.imageAlt.trim(),
  beforeImage: f.beforeImage.trim(),
  afterImage: f.afterImage.trim(),
  featured: f.featured,
  sample: f.sample,
  published: f.published,
});

function moved<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = list.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export default function ProjectsAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminProject[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [edit, setEdit] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminProject | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError('');
    api<{ items: AdminProject[]; total: number }>('/admin/projects', { admin: true })
      .then((r) => setItems(r.items))
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const filtered = !!(q.trim() || cat || status);
  const needle = q.trim().toLowerCase();
  const shown = (items || []).filter((p) => (!cat || p.category === cat) && (!status || (status === 'published' ? p.published : !p.published)) && (!needle || p.title.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle)));

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setEdit((p) => (p ? { ...p, [k]: v } : p));
    if (errors[k as string])
      setErrors((p) => {
        const { [k as string]: _gone, ...rest } = p;
        return rest;
      });
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = validate(edit);
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setSaving(true);
    try {
      if (edit.id) await api(`/admin/projects/${edit.id}`, { method: 'PATCH', admin: true, body: toBody(edit) });
      else await api('/admin/projects', { method: 'POST', admin: true, body: toBody(edit) });
      toast(edit.id ? 'Project saved.' : 'Project added.');
      setEdit(null);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      setErrors(ce.errors || {});
      toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = moved(items, i, dir);
    if (next === items) return;
    setItems(next); // optimistic; the server confirms the order
    try {
      const r = await api<AdminProject[]>('/admin/projects/reorder', { method: 'POST', admin: true, body: { ids: next.map((p) => p.id) } });
      setItems(r);
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const togglePublished = async (p: AdminProject) => {
    const publishing = !p.published;
    if (publishing && p.description.trim().length < 20) {
      toast('Add a description of at least 20 characters before publishing.', true);
      setErrors({ description: 'Add a description (at least 20 characters) before publishing.' });
      setEdit({ ...toForm(p), published: true });
      return;
    }
    setBusyId(p.id);
    try {
      await api(`/admin/projects/${p.id}`, { method: 'PATCH', admin: true, body: { published: publishing } });
      toast(publishing ? 'Project published.' : 'Project hidden from the site.');
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      toast(ce.message, true);
      // e.g. a photo without alt text: open the editor with the problem shown.
      if (Object.keys(ce.errors || {}).length) {
        setErrors(ce.errors);
        setEdit({ ...toForm(p), published: publishing });
      }
    } finally {
      setBusyId(null);
    }
  };

  const open = (f: Form) => {
    setErrors({});
    setEdit(f);
  };

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Projects">
        <button type="button" className="abtn" onClick={() => open({ ...BLANK })}>
          + Add project
        </button>
      </AdminHeader>
      <p className="alert-info">
        Projects fill the public gallery and the project pop-ups. Only <strong>published</strong> projects appear on the site, in the order shown here. Use approved photographs of real work, and add before/after photos only for genuine pairs.
      </p>

      <div className="adm-filters">
        <div className="field wide">
          <label htmlFor="pq">Search</label>
          <input id="pq" type="search" className="control" placeholder="Title or description" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pc">Category</label>
          <select id="pc" className="control" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            <option value="roofing">Roofing</option>
            <option value="remodeling">Remodeling</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ps">Status</label>
          <select id="ps" className="control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Published and hidden</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>
      {filtered && items && items.length > 1 && <p className="help">Clear the filters to change the order — the ↑ ↓ buttons reorder the whole gallery.</p>}

      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>No projects yet. Add one to start the gallery.</EmptyBox>
        ) : shown.length === 0 ? (
          <EmptyBox>No projects match these filters.</EmptyBox>
        ) : (
          shown.map((p) => {
            const i = items.findIndex((x) => x.id === p.id);
            return (
              <div key={p.id} className="flex-wrap" style={{ gap: 12, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--a-row-line)', opacity: p.published ? 1 : 0.7 }}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="thumb" />
                ) : (
                  <span className="thumb" style={{ display: 'inline-block' }} />
                )}
                <div className="col" style={{ flex: '1 1 240px', minWidth: 0, gap: 4 }}>
                  <span style={{ fontWeight: 600 }}>{p.title}</span>
                  <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.categoryLabel} · {p.description || 'No description yet'}
                  </span>
                </div>
                <div className="flex-wrap" style={{ gap: 6 }}>
                  {!p.published && <StatusTag kind="draft">HIDDEN</StatusTag>}
                  {p.featured && <StatusTag kind="new">FEATURED</StatusTag>}
                  {p.sample && <StatusTag kind="sample">SAMPLE</StatusTag>}
                  {p.beforeImage && p.afterImage && <StatusTag kind="ok">BEFORE / AFTER</StatusTag>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button type="button" className="iconbtn" aria-label={`Move ${p.title} up`} disabled={filtered || i <= 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" className="iconbtn" aria-label={`Move ${p.title} down`} disabled={filtered || i >= items.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                  <button type="button" className="iconbtn" disabled={busyId === p.id} onClick={() => togglePublished(p)}>
                    {p.published ? 'Hide' : 'Publish'}
                  </button>
                  <button type="button" className="iconbtn" onClick={() => open(toForm(p))}>
                    Edit
                  </button>
                  <button type="button" className="iconbtn iconbtn--danger" onClick={() => setDel(p)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {edit && (
        <Modal title={edit.id ? `Edit — ${edit.title || 'project'}` : 'Add project'} onClose={() => setEdit(null)} wide>
          <form onSubmit={save} noValidate className="adm-form">
            <div className="grid-fit" style={{ ['--min' as string]: '240px', ['--gap' as string]: '16px' }}>
              <Field id="pj-cat" label="Category *" error={errors.category}>
                <select id="pj-cat" className="control" value={edit.category} onChange={(e) => set('category', e.target.value as Category | '')} aria-invalid={errors.category ? true : undefined}>
                  <option value="">Select…</option>
                  <option value="roofing">Roofing</option>
                  <option value="remodeling">Remodeling</option>
                </select>
              </Field>
              <Field id="pj-title" label="Title *" error={errors.title}>
                <input id="pj-title" className="control" maxLength={120} value={edit.title} onChange={(e) => set('title', e.target.value)} aria-invalid={errors.title ? true : undefined} />
              </Field>
            </div>
            <Field id="pj-desc" label="Description" error={errors.description} help={`${edit.description.length.toLocaleString('en-US')} / 1,500 — at least 20 characters to publish. Blank line = new paragraph.`}>
              <textarea id="pj-desc" className="control" rows={5} maxLength={1500} value={edit.description} onChange={(e) => set('description', e.target.value)} aria-invalid={errors.description ? true : undefined} />
            </Field>

            <ImageField id="pj-image" label="Main photo" value={edit.image} onChange={(v) => set('image', v)} error={errors.image} />
            <Field id="pj-alt" label="Main photo description (alt text)" error={errors.imageAlt} help="Required when a main photo is set.">
              <input id="pj-alt" className="control" maxLength={200} value={edit.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} aria-invalid={errors.imageAlt ? true : undefined} />
            </Field>

            <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <legend style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Before / after pair (optional)</legend>
              <p className="small" style={{ margin: 0 }}>
                Adds the before/after slider to the project pop-up. Use genuine photos of the same job only — add both, or neither.
              </p>
              <ImageField id="pj-before" label="Before photo" value={edit.beforeImage} onChange={(v) => set('beforeImage', v)} error={errors.beforeImage} />
              <ImageField id="pj-after" label="After photo" value={edit.afterImage} onChange={(v) => set('afterImage', v)} error={errors.afterImage} />
            </fieldset>

            <div className="col" style={{ gap: 2 }}>
              <label className="adm-check">
                <input type="checkbox" checked={edit.published} onChange={(e) => set('published', e.target.checked)} />
                Published — show on the public site
              </label>
              <label className="adm-check">
                <input type="checkbox" checked={edit.featured} onChange={(e) => set('featured', e.target.checked)} />
                Featured — larger tile in the gallery
              </label>
              <label className="adm-check">
                <input type="checkbox" checked={edit.sample} onChange={(e) => set('sample', e.target.checked)} />
                Sample — placeholder, not an approved real project (shows a SAMPLE tag while review flags are on)
              </label>
            </div>

            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={saving}>
                {saving ? 'Saving…' : 'Save project'}
              </button>
              <button type="button" className="abtn abtn--line" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Delete this project?"
          message={`“${del.title}” will be removed from the gallery. To keep it for later, hide it instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/projects/${del.id}`, { method: 'DELETE', admin: true });
              toast('Project deleted.');
              setDel(null);
              load();
            } catch (e) {
              toast((e as ClientApiError).message, true);
            }
          }}
        />
      )}
    </>
  );
}
