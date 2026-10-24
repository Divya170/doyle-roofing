'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { fmtSize } from '@/lib/format';
import { projectsHref } from '@/lib/links';
import type { Option, SiteData } from '@/lib/types';
import { EMPTY, ORDER, STEP_OF, W_STEPS, MAX_BYTES, MAX_FILES, OK_EXT, OK_TYPES, newIdemKey, validate } from '@/lib/validation';
import type { Errors, EstimateForm } from '@/lib/validation';
import { Icon } from './Bits';

interface FileItem {
  key: string;
  name: string;
  size: number;
  status: 'uploading' | 'ok' | 'bad';
  progress: number;
  id?: string;
  msg?: string;
  file?: File;
  /** Rejected in the browser before any upload (wrong type / too big) — nothing to retry. */
  rejected?: boolean;
}
interface Done {
  ref: string | null;
  first: string;
  rows: [string, string][];
}
interface Alert {
  title: string;
  text: string;
}

const blank = (type = ''): EstimateForm => ({ ...EMPTY, type, roofIssues: [], areas: [] });
const MAX_MB = 10;
const stepErrors = (s: number, all: Errors): Errors => {
  const e: Errors = {};
  for (const k of [...W_STEPS[s].fields, ...(s === 2 ? ['photos'] : [])]) if (all[k]) e[k] = all[k];
  return e;
};

function photoError(status: number, data: { errors?: { photos?: string } } | null): string {
  if (status === 422) return data?.errors?.photos || 'This file could not be uploaded.';
  if (status === 413) return `This photo is over the ${MAX_MB} MB limit.`;
  if (status === 429) return 'Too many uploads — wait a few minutes and retry.';
  if (status === 503) return 'Photo uploads are currently closed.';
  return 'Upload failed — try again.';
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p className="ferr" id={id}>
      <Icon n="warning-circle" />
      <span>{msg}</span>
    </p>
  );
}

function Pills({ legend, name, prefix, list, value, onChange, error, errId }: { legend: React.ReactNode; name: string; prefix: string; list: Option[]; value: string; onChange: (v: string) => void; error?: string; errId: string }) {
  return (
    <fieldset className="fs" aria-describedby={error ? errId : undefined}>
      <legend>{legend}</legend>
      <div className="chips">
        {list.map((o, i) => (
          <label key={o.label} className={`chipc${value === o.label ? ' is-on' : ''}${error ? ' is-bad' : ''}`}>
            <input type="radio" name={name} id={`${prefix}-${i}`} checked={value === o.label} onChange={() => onChange(o.label)} aria-invalid={!!error} />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError id={errId} msg={error} />
    </fieldset>
  );
}

export function EstimateWizard({ site, initialType }: { site: SiteData; initialType: string }) {
  const s = site.settings;
  const opts = site.options;
  const photosOpen = s.estimatesOpen && s.photoUploadsOpen;

  const initial = useRef(blank(initialType));
  const [form, setForm] = useState<EstimateForm>(() => blank(initialType));
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [dir, setDir] = useState<'f' | 'b'>('f');
  const [errs, setErrs] = useState<Errors>({});
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fileNote, setFileNote] = useState('');
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [closed, setClosed] = useState(!s.estimatesOpen);

  const idemKey = useRef(newIdemKey());
  const xhrs = useRef(new Map<string, XMLHttpRequest>());
  const counter = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  const uploading = files.some((f) => f.status === 'uploading');

  // ---------- focus / scroll ----------
  useEffect(() => {
    if (!moved.current) return;
    cardRef.current?.scrollIntoView({ block: 'start' });
    headRef.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => {
    if (done) {
      cardRef.current?.scrollIntoView({ block: 'start' });
      doneRef.current?.focus({ preventScroll: true });
    }
  }, [done]);
  useEffect(() => {
    if (alert) alertRef.current?.focus();
  }, [alert]);

  // Warn before leaving with unsent answers or running uploads.
  useEffect(() => {
    if (done) return;
    const dirty = JSON.stringify(form) !== JSON.stringify(initial.current) || files.length > 0;
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [form, files, done]);

  // Cancel running uploads on unmount.
  useEffect(() => {
    const map = xhrs.current;
    return () => map.forEach((x) => x.abort());
  }, []);

  // ---------- form helpers ----------
  const set = <K extends keyof EstimateForm>(k: K, v: EstimateForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k in errs) setErrs((e) => {
      const { [k as string]: _gone, ...rest } = e;
      return rest;
    });
  };
  const toggle = (k: 'roofIssues' | 'areas', label: string) => set(k, form[k].includes(label) ? form[k].filter((x) => x !== label) : [...form[k], label]);

  const goto = (n: number) => {
    moved.current = true;
    setDir(n > step ? 'f' : 'b');
    setStep(n);
    setReached((r) => Math.max(r, n));
    setErrs({});
    setAlert(null);
  };
  const showErrors = (n: number, all: Errors) => {
    moved.current = true;
    setDir(n > step ? 'f' : 'b');
    setStep(n);
    setReached((r) => Math.max(r, n));
    setAlert(null);
    setErrs(stepErrors(n, all));
    requestAnimationFrame(() => summaryRef.current?.focus());
  };
  const focusField = (key: string) => document.getElementById(FOCUS_ID[key] || key)?.focus();

  const next = () => {
    const e = stepErrors(step, validate(form));
    if (Object.keys(e).length) {
      setErrs(e);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    goto(step + 1);
  };

  // ---------- photos ----------
  const upload = useCallback((key: string, file: File) => {
    const patch = (p: Partial<FileItem>) => setFiles((fs) => fs.map((f) => (f.key === key ? { ...f, ...p } : f)));
    const xhr = new XMLHttpRequest();
    xhrs.current.set(key, xhr);
    xhr.open('POST', '/api/estimates/photos');
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) patch({ progress: Math.min(99, Math.round((e.loaded / e.total) * 100)) });
    };
    xhr.onload = () => {
      xhrs.current.delete(key);
      let data: { id?: string; errors?: { photos?: string } } | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.id) patch({ status: 'ok', progress: 100, id: data.id, msg: '' });
      else patch({ status: 'bad', msg: photoError(xhr.status, data) });
    };
    xhr.onerror = () => {
      xhrs.current.delete(key);
      patch({ status: 'bad', msg: 'Network error — check your connection and retry.' });
    };
    xhr.ontimeout = () => {
      xhrs.current.delete(key);
      patch({ status: 'bad', msg: 'The upload timed out — retry.' });
    };
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  }, []);

  const addFiles = (list: FileList | File[]) => {
    setFileNote('');
    let accepted = files.filter((f) => f.status !== 'bad').length;
    const added: FileItem[] = [];
    let skipped = false;
    for (const file of Array.from(list)) {
      const key = `f${++counter.current}`;
      const typeOk = OK_EXT.test(file.name) || OK_TYPES.includes(file.type);
      if (!typeOk) added.push({ key, name: file.name, size: file.size, status: 'bad', progress: 0, rejected: true, msg: 'Not a supported file type. Use JPG, PNG, WEBP or HEIC.' });
      else if (file.size > MAX_BYTES) added.push({ key, name: file.name, size: file.size, status: 'bad', progress: 0, rejected: true, msg: `Over the ${MAX_MB} MB limit.` });
      else if (accepted >= MAX_FILES) skipped = true;
      else {
        accepted++;
        added.push({ key, name: file.name, size: file.size, status: 'uploading', progress: 0, file });
      }
    }
    if (skipped) setFileNote(`Only ${MAX_FILES} photos can be attached — the extra files were skipped.`);
    if (!added.length) return;
    setFiles((fs) => [...fs, ...added]);
    setErrs((e) => {
      const { photos: _p, ...rest } = e;
      return rest;
    });
    for (const it of added) if (it.status === 'uploading' && it.file) upload(it.key, it.file);
  };
  const removeFile = (key: string) => {
    xhrs.current.get(key)?.abort();
    xhrs.current.delete(key);
    setFiles((fs) => fs.filter((f) => f.key !== key));
    setFileNote('');
  };
  const retryFile = (f: FileItem) => {
    if (!f.file) return;
    setFiles((fs) => fs.map((x) => (x.key === f.key ? { ...x, status: 'uploading', progress: 0, msg: '' } : x)));
    upload(f.key, f.file);
  };

  // ---------- send ----------
  const send = async () => {
    const all = validate(form);
    const first = ORDER.find((k) => all[k]);
    if (first) return showErrors(STEP_OF[first], all);
    if (uploading) return;
    setSending(true);
    setAlert(null);
    try {
      const body = { ...form, photos: files.filter((f) => f.status === 'ok' && f.id).map((f) => f.id) };
      const r = await api<{ ok: boolean; id: string | null }>('/estimates', { method: 'POST', body, headers: { 'Idempotency-Key': idemKey.current }, timeoutMs: 30_000 });
      setDone({ ref: r.id, first: form.name.trim().split(/\s+/)[0] || 'there', rows: summaryRows(form, files.filter((f) => f.status === 'ok').length, photosOpen) });
      setSending(false);
    } catch (e) {
      setSending(false);
      const ce = e as ClientApiError;
      if (ce.status === 422) {
        const key = [...ORDER, 'photos'].find((k) => ce.errors[k]);
        if (key) return showErrors(STEP_OF[key], ce.errors);
      }
      if (ce.code === 'closed') return setClosed(true);
      if (ce.status === 429) return setAlert({ title: 'Too many attempts', text: 'Please wait a few minutes, then use “Retry sending”. Your answers are still here.' });
      if (ce.status === 0) return setAlert({ title: 'We couldn’t reach the server', text: 'Check your connection, then use “Retry sending”. Your answers are still here.' });
      setAlert({ title: 'Your request wasn’t sent', text: 'Something went wrong on our side. Your answers are still here — please try again.' });
    }
  };

  const restart = () => {
    files.forEach((f) => xhrs.current.get(f.key)?.abort());
    initial.current = blank();
    setForm(blank());
    setFiles([]);
    setFileNote('');
    setErrs({});
    setAlert(null);
    setDone(null);
    setStep(0);
    setReached(0);
    moved.current = false;
    idemKey.current = newIdemKey();
    requestAnimationFrame(() => cardRef.current?.scrollIntoView({ block: 'start' }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < 4) next();
    else send();
  };

  // ---------- render ----------
  const errKeys = Object.keys(errs);
  const cur = W_STEPS[step];
  const rooftypes = [
    { v: 'roofing', title: 'Roofing', icon: 'house-line', list: site.services.roofing },
    { v: 'remodeling', title: 'Remodeling', icon: 'hammer', list: site.services.remodeling },
  ];

  return (
    <div className="wrap est">
      <aside className="est__aside">
        <div>
          <h1>Request an estimate.</h1>
          <p>A few short steps. Add photos if you have them — they help us understand the job.</p>
        </div>
        <nav aria-label="Estimate steps">
          <ol className="stepper">
            {W_STEPS.map((w, i) => (
              <li key={w.label}>
                <button
                  type="button"
                  className={`${i <= reached ? 'is-reached' : ''}${i < step ? ' is-done' : ''}`}
                  aria-current={i === step && !done ? 'step' : undefined}
                  disabled={i > reached || !!done || closed}
                  onClick={() => i !== step && goto(i)}
                >
                  <span className="dot">{i < step ? <Icon n="check" /> : i + 1}</span>
                  <span>
                    <span className="sr-only">Step {i + 1}: </span>
                    {w.label}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {(s.phone || s.email) && (
          <div className="est__talk">
            <span>Prefer to talk?</span>
            {s.phone && s.telHref && <a href={s.telHref}>{s.phone}</a>}
            {s.email && s.mailHref && <a href={s.mailHref}>{s.email}</a>}
          </div>
        )}
      </aside>

      <div className="est__card" ref={cardRef}>
        <div className="est__progress" aria-hidden="true">
          <div style={{ width: `${done ? 100 : ((step + 1) / W_STEPS.length) * 100}%` }} />
        </div>

        {closed ? (
          <div className="closed" role="status">
            <h2>Online estimate requests are paused.</h2>
            <p>We’re not taking requests through the website right now. Please get in touch directly instead.</p>
            <div className="btns">
              {s.phone && s.telHref && (
                <a href={s.telHref} className="btn btn--primary btn--md">
                  Call {s.phone}
                </a>
              )}
              {s.email && s.mailHref && (
                <a href={s.mailHref} className="btn btn--line btn--md">
                  Email us
                </a>
              )}
            </div>
          </div>
        ) : done ? (
          <div className="done" ref={doneRef} tabIndex={-1} role="status">
            <span className="done__ic">
              <Icon n="check-circle" />
            </span>
            <h2>Thanks, {done.first} — your request is in.</h2>
            <p>We’ll review it and get in touch using the phone number or email you gave us.</p>
            {done.ref && (
              <p className="done__ref">
                Reference: <b>{done.ref}</b>
              </p>
            )}
            <dl className="sumgrid">
              {done.rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="btns">
              <button type="button" className="btn btn--line btn--md" onClick={restart}>
                Start another request
              </button>
              <Link href={projectsHref()} className="btn btn--primary btn--md">
                Browse projects
              </Link>
            </div>
          </div>
        ) : (
          <form className="wform" noValidate onSubmit={onSubmit} aria-label="Estimate request">
            <div className={`wstep ${dir === 'f' ? 'anim-f' : 'anim-b'}`} key={step}>
              <div className="whead">
                <span>
                  Step {step + 1} of {W_STEPS.length}
                </span>
                <h2 ref={headRef} tabIndex={-1}>
                  {cur.title}
                </h2>
                <p>{cur.intro}</p>
              </div>

              {errKeys.length > 0 && (
                <div className="esum" ref={summaryRef} tabIndex={-1} role="alert">
                  <strong>
                    <Icon n="warning-circle" /> Please fix {errKeys.length === 1 ? '1 thing' : `${errKeys.length} things`} to continue
                  </strong>
                  <ul>
                    {errKeys.map((k) => (
                      <li key={k}>
                        <button type="button" onClick={() => focusField(k)}>
                          {errs[k]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 0 && (
                <>
                  <fieldset className="fs" aria-describedby={errs.type ? 'e-type' : undefined}>
                    <legend className="sr-only">Project type</legend>
                    <div className="types">
                      {rooftypes.map((t) => (
                        <label key={t.v} className={`type${form.type === t.v ? ' is-on' : ''}${errs.type ? ' is-bad' : ''}`}>
                          <span>
                            <Icon n={t.icon} />
                            <input type="radio" name="type" id={`f-type-${t.v}`} checked={form.type === t.v} onChange={() => set('type', t.v)} aria-invalid={!!errs.type} />
                          </span>
                          <span>
                            <b>{t.title}</b>
                            {t.list.length > 0 && <small>{t.list.slice(0, 3).map((x) => x.name).join(', ')}</small>}
                          </span>
                        </label>
                      ))}
                    </div>
                    <FieldError id="e-type" msg={errs.type} />
                  </fieldset>

                  {form.type === 'roofing' && (
                    <div className="cond">
                      <fieldset className="fs">
                        <legend>
                          What’s going on with the roof? <span className="opt">(optional)</span>
                        </legend>
                        <div className="chips">
                          {opts.roofIssue.map((o, i) => (
                            <label key={o.label} className={`chipc${form.roofIssues.includes(o.label) ? ' is-on' : ''}`}>
                              <input type="checkbox" id={`f-issue-${i}`} checked={form.roofIssues.includes(o.label)} onChange={() => toggle('roofIssues', o.label)} />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="fld">
                        <label htmlFor="f-roofage">
                          Roof age <span className="opt">(optional)</span>
                        </label>
                        <select id="f-roofage" className="inp" value={form.roofAge} onChange={(e) => set('roofAge', e.target.value)}>
                          <option value="">Select…</option>
                          {opts.roofAge.map((o) => (
                            <option key={o.label} value={o.label}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {form.type === 'remodeling' && (
                    <div className="cond cond--sand">
                      <fieldset className="fs">
                        <legend>
                          Which areas are involved? <span className="opt">(optional)</span>
                        </legend>
                        <div className="chips">
                          {opts.remodelArea.map((o, i) => (
                            <label key={o.label} className={`chipc${form.areas.includes(o.label) ? ' is-on' : ''}`}>
                              <input type="checkbox" id={`f-area-${i}`} checked={form.areas.includes(o.label)} onChange={() => toggle('areas', o.label)} />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <fieldset className="fs" aria-describedby={errs.property ? 'e-property' : undefined}>
                    <legend>Property type</legend>
                    <div className="props">
                      {opts.property.map((o, i) => (
                        <label key={o.label} className={`prop${form.property === o.label ? ' is-on' : ''}${errs.property ? ' is-bad' : ''}`}>
                          <span>
                            <Icon n={o.icon} />
                            <input type="radio" name="property" id={`f-prop-${i}`} checked={form.property === o.label} onChange={() => set('property', o.label)} aria-invalid={!!errs.property} />
                          </span>
                          <span>{o.label}</span>
                        </label>
                      ))}
                    </div>
                    <FieldError id="e-property" msg={errs.property} />
                  </fieldset>

                  <div className="fld">
                    <label htmlFor="f-location">Property address, or city and ZIP code</label>
                    <input id="f-location" className="inp" maxLength={200} autoComplete="street-address" value={form.location} onChange={(e) => set('location', e.target.value)} aria-invalid={!!errs.location} aria-describedby={errs.location ? 'e-location' : undefined} />
                    <FieldError id="e-location" msg={errs.location} />
                  </div>

                  <Pills legend="Preferred timeline" name="timeline" prefix="f-time" list={opts.timeline} value={form.timeline} onChange={(v) => set('timeline', v)} error={errs.timeline} errId="e-timeline" />
                  <Pills legend="Budget range" name="budget" prefix="f-budget" list={opts.budget} value={form.budget} onChange={(v) => set('budget', v)} error={errs.budget} errId="e-budget" />
                </>
              )}

              {step === 2 && (
                <>
                  <div className="fld">
                    <label htmlFor="f-desc">Describe the work</label>
                    <textarea id="f-desc" className="inp" maxLength={2000} value={form.desc} onChange={(e) => set('desc', e.target.value)} aria-invalid={!!errs.desc} aria-describedby={errs.desc ? 'e-desc' : 'h-desc'} />
                    <span className="count" id="h-desc">
                      {form.desc.length}/2000
                    </span>
                    <FieldError id="e-desc" msg={errs.desc} />
                  </div>

                  {photosOpen && (
                    <div className="fld">
                      <span className="flabel">
                        Photos <span className="opt">(optional — up to {MAX_FILES}, {MAX_MB} MB each)</span>
                      </span>
                      <div
                        id="f-files"
                        className={`drop${dragging ? ' is-drag' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label="Add photos. Choose files or drag them here."
                        onClick={() => fileInput.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInput.current?.click();
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragging(false);
                          if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
                        }}
                      >
                        <span>
                          <Icon n="upload-simple" />
                        </span>
                        <b>
                          Drop photos here or <u>browse</u>
                        </b>
                        <small>JPG, PNG, WEBP or HEIC</small>
                      </div>
                      <input
                        ref={fileInput}
                        type="file"
                        className="sr-only"
                        tabIndex={-1}
                        multiple
                        accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
                        aria-hidden="true"
                        onChange={(e) => {
                          if (e.target.files?.length) addFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <div aria-live="polite">
                        {fileNote && <p className="help">{fileNote}</p>}
                        <FieldError id="e-photos" msg={errs.photos} />
                      </div>
                      {files.length > 0 && (
                        <ul className="files">
                          {files.map((f) => (
                            <li key={f.key} className={f.status === 'ok' ? 'is-ok' : f.status === 'bad' ? 'is-bad' : ''}>
                              <span className="files__ic">
                                <Icon n={f.status === 'ok' ? 'check-circle' : f.status === 'bad' ? 'warning-circle' : 'image'} />
                              </span>
                              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span className="files__name">
                                  {f.name} <span>· {fmtSize(f.size)}</span>
                                </span>
                                {f.status === 'uploading' && (
                                  <div className="files__bar" role="progressbar" aria-label={`Uploading ${f.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={f.progress}>
                                    <div style={{ width: `${f.progress}%` }} />
                                  </div>
                                )}
                                <span className="files__st">{f.status === 'uploading' ? `Uploading… ${f.progress}%` : f.status === 'ok' ? 'Attached' : f.msg}</span>
                              </div>
                              <span className="files__act">
                                {f.status === 'bad' && f.file && !f.rejected && (
                                  <button type="button" className="files__retry" onClick={() => retryFile(f)}>
                                    Retry
                                  </button>
                                )}
                                <button type="button" className="files__rm" aria-label={`Remove ${f.name}`} onClick={() => removeFile(f.key)}>
                                  <Icon n="x" />
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <div className="fld">
                    <label htmlFor="f-name">Full name</label>
                    <input id="f-name" className="inp" maxLength={120} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errs.name} aria-describedby={errs.name ? 'e-name' : undefined} />
                    <FieldError id="e-name" msg={errs.name} />
                  </div>
                  <div className="fld">
                    <label htmlFor="f-phone">Phone</label>
                    <input id="f-phone" className="inp" type="tel" inputMode="tel" maxLength={30} autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errs.phone} aria-describedby={errs.phone ? 'e-phone' : undefined} />
                    <FieldError id="e-phone" msg={errs.phone} />
                  </div>
                  <div className="fld">
                    <label htmlFor="f-email">Email</label>
                    <input id="f-email" className="inp" type="email" inputMode="email" maxLength={160} autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errs.email} aria-describedby={errs.email ? 'e-email' : undefined} />
                    <FieldError id="e-email" msg={errs.email} />
                  </div>
                  {/* Honeypot: real visitors never see or fill this. */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label>
                      Website
                      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                    </label>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="review">
                  {reviewSections(form, files, photosOpen).map((sec) => (
                    <div key={sec.title}>
                      <div className="review__h">
                        <h3>{sec.title}</h3>
                        <button type="button" onClick={() => goto(sec.step)}>
                          Edit<span className="sr-only"> {sec.title.toLowerCase()}</span>
                        </button>
                      </div>
                      <dl>
                        {sec.rows.map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                  {files.some((f) => f.status === 'bad') && <p className="help">Photos that failed to upload won’t be sent. Go back to step 3 to retry or remove them.</p>}
                  {alert && (
                    <div className="walert" ref={alertRef} tabIndex={-1} role="alert">
                      <Icon n="warning-circle" />
                      <div>
                        <strong>{alert.title}</strong>
                        <span>{alert.text}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="wfoot">
              {step > 0 ? (
                <button type="button" className="btn btn--line btn--md" onClick={() => goto(step - 1)} disabled={sending}>
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < 4 ? (
                <button type="submit" className="btn btn--primary btn--arrow btn--md">
                  Continue
                  <span className="dot">
                    <Icon n="arrow-right" />
                  </span>
                </button>
              ) : (
                <button type="submit" className="btn btn--primary btn--md" disabled={sending || uploading} aria-busy={sending}>
                  {sending ? (
                    <>
                      <Icon n="spinner-gap" className="spin-ic" /> Sending…
                    </>
                  ) : uploading ? (
                    'Waiting for photos…'
                  ) : alert ? (
                    'Retry sending'
                  ) : (
                    'Send request'
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const FOCUS_ID: Record<string, string> = {
  type: 'f-type-roofing',
  property: 'f-prop-0',
  location: 'f-location',
  timeline: 'f-time-0',
  budget: 'f-budget-0',
  desc: 'f-desc',
  photos: 'f-files',
  name: 'f-name',
  phone: 'f-phone',
  email: 'f-email',
};

const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');

function summaryRows(f: EstimateForm, photos: number, photosOpen: boolean): [string, string][] {
  const rows: [string, string][] = [
    ['Project', cap(f.type)],
    ['Property', f.property],
    ['Location', f.location.trim()],
    ['Timeline', f.timeline],
    ['Budget', f.budget],
  ];
  if (photosOpen) rows.push(['Photos', photos ? `${photos} attached` : 'None']);
  rows.push(['Contact', `${f.phone.trim()} · ${f.email.trim()}`]);
  return rows;
}

function reviewSections(f: EstimateForm, files: FileItem[], photosOpen: boolean) {
  const project: [string, string][] = [['Type', cap(f.type)]];
  if (f.type === 'roofing') {
    if (f.roofIssues.length) project.push(['Roof issues', f.roofIssues.join(', ')]);
    if (f.roofAge) project.push(['Roof age', f.roofAge]);
  }
  if (f.type === 'remodeling' && f.areas.length) project.push(['Areas', f.areas.join(', ')]);
  const ok = files.filter((x) => x.status === 'ok');
  const details: [string, string][] = [['Description', f.desc.trim()]];
  if (photosOpen) details.push(['Photos', ok.length ? ok.map((x) => x.name).join(', ') : 'None']);
  return [
    { title: 'Project', step: 0, rows: project },
    { title: 'Property & timing', step: 1, rows: [['Property', f.property], ['Location', f.location.trim()], ['Timeline', f.timeline], ['Budget', f.budget]] as [string, string][] },
    { title: 'Details & photos', step: 2, rows: details },
    { title: 'Your details', step: 3, rows: [['Name', f.name.trim()], ['Phone', f.phone.trim()], ['Email', f.email.trim()]] as [string, string][] },
  ];
}

