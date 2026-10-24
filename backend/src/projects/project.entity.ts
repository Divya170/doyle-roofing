import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Project gallery entry (Handoff: "Project CMS"). Only published rows are public. */
@Entity('projects')
@Index(['published', 'sortOrder'])
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  /** roofing | remodeling */
  @Column()
  category: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  /** Main photograph (/uploads/… or https://…). Empty = labelled placeholder. */
  @Column({ type: 'varchar', nullable: true })
  image: string | null;

  @Column({ default: '' })
  imageAlt: string;

  /** Optional genuine before/after pair — the comparison slider shows only when both are set. */
  @Column({ type: 'varchar', nullable: true })
  beforeImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  afterImage: string | null;

  /** Shown in the home "Featured projects" rail */
  @Column({ default: false })
  featured: boolean;

  /** Design "Sample entry" badge — placeholder content, not completed work */
  @Column({ default: false })
  sample: boolean;

  @Column({ default: true })
  published: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
