import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Project } from './project.entity';
import { CATEGORY_LABELS, ProjectInput, validateProject } from './project-validation';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private readonly repo: Repository<Project>) {}

  private fail(errors: Record<string, string>) {
    const n = Object.keys(errors).length;
    throw new BadRequestException({ message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`, errors });
  }

  private shapePublic(p: Project) {
    return {
      id: p.id,
      category: p.category,
      categoryLabel: CATEGORY_LABELS[p.category] || p.category,
      title: p.title,
      description: p.description,
      image: p.image,
      imageAlt: p.imageAlt || `Photo: ${p.title}`,
      beforeImage: p.beforeImage,
      afterImage: p.afterImage,
      featured: p.featured,
      sample: p.sample,
    };
  }

  /** Public: published projects in admin order, optionally one category. */
  async listPublished(category?: string) {
    const where: Record<string, unknown> = { published: true };
    if (category && CATEGORY_LABELS[category]) where.category = category;
    const rows = await this.repo.find({ where, order: { sortOrder: 'ASC', id: 'ASC' } });
    return rows.map((p) => this.shapePublic(p));
  }

  // ---------- admin ----------

  async adminList(p: { q?: string; category?: string; status?: string }) {
    const qb = this.repo.createQueryBuilder('x');
    if (p.category && CATEGORY_LABELS[p.category]) qb.andWhere('x.category = :c', { c: p.category });
    if (p.status === 'published') qb.andWhere('x.published = 1');
    if (p.status === 'hidden') qb.andWhere('x.published = 0');
    const q = (p.q || '').trim().toLowerCase().slice(0, 100);
    if (q) qb.andWhere("(LOWER(x.title) LIKE :q ESCAPE '\\' OR LOWER(x.description) LIKE :q ESCAPE '\\')", { q: `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` });
    const items = await qb.orderBy('x.sortOrder', 'ASC').addOrderBy('x.id', 'ASC').getMany();
    const total = await this.repo.count();
    return { items: items.map((x) => ({ ...x, categoryLabel: CATEGORY_LABELS[x.category] || x.category })), total };
  }

  async create(body: ProjectInput) {
    const { value, errors } = validateProject(body);
    if (Object.keys(errors).length) this.fail(errors);
    const max = await this.repo.createQueryBuilder('x').select('MAX(x.sortOrder)', 'max').getRawOne<{ max: number | null }>();
    return this.repo.save(this.repo.create({ ...value, sortOrder: (max?.max ?? 0) + 1 }));
  }

  async update(id: number, body: ProjectInput) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found.');
    const { value, errors } = validateProject({ ...row, ...body });
    if (Object.keys(errors).length) this.fail(errors);
    Object.assign(row, value);
    return this.repo.save(row);
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Project not found.');
    await this.repo.remove(row);
    return { ok: true };
  }

  async reorder(ids: number[]) {
    const rows = await this.repo.find({ where: { id: In(ids) } });
    if (rows.length !== ids.length || rows.length !== (await this.repo.count())) throw new BadRequestException('Reorder list must contain every project once.');
    await Promise.all(ids.map((id, i) => this.repo.update({ id }, { sortOrder: i + 1 })));
    return (await this.adminList({})).items;
  }

  /** Seeder: idempotent. */
  async seed(items: ProjectInput[]) {
    if ((await this.repo.count()) > 0) return 0;
    await this.repo.save(items.map((it, i) => this.repo.create({ ...validateProject(it).value, sortOrder: i + 1 })));
    return items.length;
  }
}
