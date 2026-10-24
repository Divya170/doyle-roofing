import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, LessThan, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { Estimate } from './estimate.entity';
import { EstimatePhoto } from './estimate-photo.entity';
import { EstimateInput, MAX_PHOTOS, OptionLists, safeName, sniffPhoto, validateEstimate } from './estimate-validation';
import { csvSafe, isHoneypot, publicRef, RequestStatus, STATUS_LABELS } from '../common/forms';
import { FieldErrors } from '../common/submission-error';
import { NotifierService } from '../common/notifier.service';
import { HistoryService } from '../common/history.service';
import { applyFilters, paginate, RequestQuery, statusCounts } from '../common/request-query';
import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';

/** Private storage for lead photos — never served statically (Handoff: "private storage"). */
export const PRIVATE_UPLOAD_DIR = resolve(process.cwd(), process.env.PRIVATE_UPLOAD_DIR || 'private-uploads');
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
/** Photos uploaded but never attached to a sent request are deleted after this long. */
const ORPHAN_MS = 24 * 60 * 60 * 1000;

export const hashIp = (ip: string) => (ip ? createHash('sha256').update(`${process.env.SESSION_SECRET || 'dev'}:${ip}`).digest('hex').slice(0, 32) : '');
const TYPE_LABEL: Record<string, string> = { roofing: 'Roofing', remodeling: 'Remodeling' };

@Injectable()
export class InquiriesService implements OnModuleInit {
  private readonly logger = new Logger('Estimates');

  constructor(
    @InjectRepository(Estimate) private readonly repo: Repository<Estimate>,
    @InjectRepository(EstimatePhoto) private readonly photos: Repository<EstimatePhoto>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
    private readonly content: ContentService,
    private readonly notifier: NotifierService,
    private readonly history: HistoryService,
  ) {}

  onModuleInit() {
    mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
    void this.cleanupOrphans();
  }

  /** Published wizard options, as plain label lists (used for validation). */
  async optionLists(): Promise<OptionLists> {
    const rows = (await this.content.publicBundle(['form-option']))['form-option'];
    const pick = (list: string) => rows.filter((r) => r.list === list).map((r) => String(r.label || ''));
    return { property: pick('property'), timeline: pick('timeline'), budget: pick('budget'), roofIssue: pick('roof-issue'), roofAge: pick('roof-age'), remodelArea: pick('remodel-area') };
  }

  // ---------- public: photos ----------

  async uploadPhoto(file: { buffer: Buffer; originalname: string; size: number } | undefined, ip: string) {
    const s = await this.settings.get();
    if (!s.estimatesOpen || !s.photoUploadsOpen) throw new ServiceUnavailableException({ error: 'closed' });
    if (!file) throw new FieldErrors({ photos: 'Choose a photo to attach.' });
    if (file.size > MAX_PHOTO_BYTES) throw new FieldErrors({ photos: 'This photo is over the 10 MB limit.' });
    const kind = sniffPhoto(file.buffer);
    if (!kind) throw new FieldErrors({ photos: 'Not a supported file type. Use JPG, PNG, WEBP or HEIC.' });
    const id = randomBytes(16).toString('hex');
    const storedName = `${id}${kind.ext}`;
    writeFileSync(join(PRIVATE_UPLOAD_DIR, storedName), file.buffer, { mode: 0o600 });
    await this.photos.save(this.photos.create({ id, estimateId: null, originalName: safeName(file.originalname), storedName, mime: kind.mime, size: file.size, ipHash: hashIp(ip) }));
    void this.cleanupOrphans();
    return { id, name: safeName(file.originalname), size: file.size, type: kind.mime };
  }

  /** Delete photos never attached to a request (abandoned forms). */
  async cleanupOrphans() {
    try {
      const old = await this.photos.find({ where: { estimateId: IsNull(), createdAt: LessThan(new Date(Date.now() - ORPHAN_MS)) } });
      for (const p of old) this.unlink(p.storedName);
      if (old.length) await this.photos.remove(old);
    } catch (err) {
      this.logger.warn(JSON.stringify({ event: 'photos.cleanup_failed', message: (err as Error).message }));
    }
  }

  private unlink(name: string) {
    const f = join(PRIVATE_UPLOAD_DIR, name);
    try {
      if (existsSync(f)) unlinkSync(f);
    } catch {
      /* already gone */
    }
  }

  // ---------- public: submit ----------

  async formOptions() {
    const s = await this.settings.get();
    return { open: s.estimatesOpen, photosOpen: s.estimatesOpen && s.photoUploadsOpen, maxPhotos: MAX_PHOTOS, maxPhotoMb: MAX_PHOTO_BYTES / 1024 / 1024 };
  }

  async submit(input: EstimateInput, meta: { ip: string; idemKey: string | null }) {
    // A filled honeypot gets a normal-looking success and nothing is stored.
    if (isHoneypot(input.website)) {
      this.logger.warn(JSON.stringify({ event: 'estimate.discarded', reason: 'honeypot' }));
      return { id: null as string | null, duplicate: false };
    }
    if (meta.idemKey) {
      const dup = await this.repo.findOne({ where: { idempotencyKey: meta.idemKey } });
      if (dup) return { id: dup.publicRef, duplicate: true };
    }
    const s = await this.settings.get();
    if (!s.estimatesOpen) throw new ServiceUnavailableException({ error: 'closed' });

    const { value, errors } = validateEstimate(input, await this.optionLists());
    let photoIds = s.photoUploadsOpen ? value.photos : [];
    if (photoIds.length) {
      const found = await this.photos.find({ where: { id: In(photoIds), estimateId: IsNull() } });
      if (found.length !== photoIds.length) errors.photos = 'One or more photos could not be found. Remove them and attach them again.';
      photoIds = found.map((p) => p.id);
    }
    if (Object.keys(errors).length) throw new FieldErrors(errors);

    const { photos: _p, ...fields } = value;
    let row: Estimate;
    try {
      row = await this.dataSource.transaction(async (m) => {
        const repo = m.getRepository(Estimate);
        const saved = await repo.save(
          repo.create({
            ...fields,
            status: 'new',
            notes: '',
            idempotencyKey: meta.idemKey,
            notificationState: this.notifier.configured ? 'pending' : 'disabled',
            acknowledgementState: this.notifier.configured ? 'pending' : 'disabled',
            ipHash: hashIp(meta.ip),
          }),
        );
        saved.publicRef = publicRef(saved.id);
        if (photoIds.length) await m.getRepository(EstimatePhoto).update({ id: In(photoIds) }, { estimateId: saved.id });
        await this.history.record('estimate', saved.id, 'new', 'website', m);
        return repo.save(saved);
      });
    } catch (err) {
      if (meta.idemKey) {
        const dup = await this.repo.findOne({ where: { idempotencyKey: meta.idemKey } });
        if (dup) return { id: dup.publicRef, duplicate: true };
      }
      throw err;
    }
    this.logger.log(JSON.stringify({ event: 'estimate.created', ref: row.publicRef, type: row.type, photos: photoIds.length }));
    if (this.notifier.configured) void this.notify(row, photoIds.length);
    return { id: row.publicRef, duplicate: false };
  }

  /** Emails after commit — failures are recorded and never drop the request. */
  async notify(x: Estimate, photoCount?: number, only?: 'workshop' | 'customer') {
    const s = await this.settings.get();
    const n = photoCount ?? (await this.photos.count({ where: { estimateId: x.id } }));
    const rows: [string, string][] = [
      ['Reference', x.publicRef || String(x.id)],
      ['Project', TYPE_LABEL[x.type] || x.type],
      ['Property', x.property],
      ['Location', x.location],
      ['Timeline', x.timeline],
      ['Budget', x.budget],
    ];
    if (only !== 'customer') {
      try {
        await this.notifier.send({
          to: process.env.NOTIFY_TO || s.email,
          replyTo: x.email,
          subject: `New estimate request ${x.publicRef} — ${TYPE_LABEL[x.type] || x.type}`,
          rows: [...rows, ['Name', x.name], ['Phone', x.phone], ['Email', x.email], ['Photos', n ? `${n} attached (view in admin)` : 'None']],
          body: x.description,
          link: this.notifier.adminUrl(`/estimates/${x.id}`),
        });
        await this.repo.update({ id: x.id }, { notificationState: 'sent' });
      } catch {
        this.logger.error(JSON.stringify({ event: 'estimate.notify_failed', ref: x.publicRef }));
        await this.repo.update({ id: x.id }, { notificationState: 'failed' });
      }
    }
    if (only !== 'workshop') {
      try {
        await this.notifier.send({
          to: x.email,
          replyTo: s.email || x.email,
          subject: `We received your estimate request (${x.publicRef})`,
          rows,
          body: `Thanks, ${x.name.split(' ')[0]}. The details you shared will be reviewed and ${s.businessName} will contact you to discuss next steps.${s.phone ? `\n\nQuestions? Call ${s.phone}.` : ''}`,
          link: '',
        });
        await this.repo.update({ id: x.id }, { acknowledgementState: 'sent' });
      } catch {
        await this.repo.update({ id: x.id }, { acknowledgementState: 'failed' });
      }
    }
  }

  async resend(id: number) {
    if (!this.notifier.configured) throw new BadRequestException('Email is not configured (set SMTP_HOST in backend/.env).');
    const x = await this.get(id);
    await this.notify(x, undefined, x.notificationState === 'sent' ? 'customer' : x.acknowledgementState === 'sent' ? 'workshop' : undefined);
    return this.detail(id);
  }

  // ---------- admin ----------

  private filtered(p: RequestQuery) {
    const qb = this.repo.createQueryBuilder('x');
    if (p.type && TYPE_LABEL[p.type]) qb.andWhere('x.type = :type', { type: p.type });
    return applyFilters(qb, p, ['publicRef', 'name', 'email', 'location', 'description', 'notes']);
  }

  private shape(r: Estimate) {
    return { ...r, ipHash: undefined, idempotencyKey: undefined, typeLabel: TYPE_LABEL[r.type] || r.type, statusLabel: STATUS_LABELS[r.status] || r.status };
  }

  counts() {
    return statusCounts(this.repo.createQueryBuilder('x'));
  }

  async list(p: RequestQuery) {
    const r = await paginate(this.filtered(p), p);
    const ids = r.items.map((x) => x.id);
    const photoCounts = ids.length
      ? await this.photos
          .createQueryBuilder('p')
          .select('p.estimateId', 'id')
          .addSelect('COUNT(*)', 'n')
          .where('p.estimateId IN (:...ids)', { ids })
          .groupBy('p.estimateId')
          .getRawMany<{ id: number; n: string }>()
      : [];
    const pc = new Map(photoCounts.map((x) => [Number(x.id), Number(x.n)]));
    return {
      ...r,
      items: r.items.map((x) => ({ ...this.shape(x), photoCount: pc.get(x.id) || 0 })),
      counts: await this.counts(),
      notificationsConfigured: this.notifier.configured,
    };
  }

  async get(id: number) {
    const x = await this.repo.findOne({ where: { id } });
    if (!x) throw new NotFoundException('Estimate request not found.');
    return x;
  }

  async detail(id: number) {
    const x = await this.get(id);
    const photos = await this.photos.find({ where: { estimateId: id }, order: { createdAt: 'ASC' } });
    return {
      ...this.shape(x),
      photos: photos.map((p) => ({ id: p.id, name: p.originalName, mime: p.mime, size: p.size, url: `/api/admin/estimates/${id}/photos/${p.id}` })),
      history: await this.history.list('estimate', id),
    };
  }

  /** Path of one attached photo, for the authenticated admin viewer. */
  async photoFile(id: number, photoId: string) {
    const p = await this.photos.findOne({ where: { id: photoId, estimateId: id } });
    if (!p) throw new NotFoundException('Photo not found.');
    const path = join(PRIVATE_UPLOAD_DIR, p.storedName);
    if (!existsSync(path)) throw new NotFoundException('Photo file is missing.');
    return { path, mime: p.mime, name: p.originalName };
  }

  async update(id: number, patch: { status?: string; notes?: string }, by: string) {
    const x = await this.get(id);
    if (patch.status !== undefined && patch.status !== x.status) {
      x.status = patch.status as RequestStatus;
      await this.history.record('estimate', id, x.status, by);
    }
    if (patch.notes !== undefined) x.notes = patch.notes.replace(/\r\n/g, '\n').trim();
    await this.repo.save(x);
    return this.detail(id);
  }

  /** Deleting a lead also deletes its photo files and history (retention). */
  async remove(id: number) {
    const x = await this.get(id);
    const photos = await this.photos.find({ where: { estimateId: id } });
    for (const p of photos) this.unlink(p.storedName);
    if (photos.length) await this.photos.remove(photos);
    await this.repo.remove(x);
    await this.history.remove('estimate', id);
    return { ok: true };
  }

  async exportCsv(p: RequestQuery) {
    const rows = (await this.filtered(p).getMany()).map((x) => this.shape(x));
    const cols: [string, (r: (typeof rows)[number]) => unknown][] = [
      ['Reference', (r) => r.publicRef],
      ['Received (UTC)', (r) => new Date(r.createdAt).toISOString()],
      ['Status', (r) => r.statusLabel],
      ['Project', (r) => r.typeLabel],
      ['Prompted by / areas', (r) => (r.type === 'roofing' ? [...r.roofIssues, r.roofAge ? `Roof age: ${r.roofAge}` : ''].filter(Boolean) : r.areas).join('; ')],
      ['Property', (r) => r.property],
      ['Location', (r) => r.location],
      ['Timeline', (r) => r.timeline],
      ['Budget', (r) => r.budget],
      ['Description', (r) => r.description],
      ['Name', (r) => r.name],
      ['Phone', (r) => r.phone],
      ['Email', (r) => r.email],
      ['Notes', (r) => r.notes],
    ];
    return [cols.map(([c]) => csvSafe(c)).join(','), ...rows.map((r) => cols.map(([, f]) => csvSafe(f(r))).join(','))].join('\r\n');
  }
}
