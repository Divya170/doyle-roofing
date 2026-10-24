import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Singleton (id = 1): business details, page copy, design flags and form switches. */
@Entity('settings')
export class Settings {
  @PrimaryColumn()
  id: number;

  @Column({ default: 'Doyle Roofing & Remodeling' })
  businessName: string;

  /** "Principal" on the About page */
  @Column({ default: '' })
  contactName: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressLine1: string | null;

  /** City, state, ZIP */
  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  /** Short location label in the hero chip and marquee, e.g. "Houston, TX" */
  @Column({ default: '' })
  locationLabel: string;

  /** About page statement (the word-by-word headline) */
  @Column({ type: 'text', default: '' })
  statement: string;

  /** Approved privacy policy. Empty = "being finalized" note. */
  @Column({ type: 'text', default: '' })
  privacyPolicy: string;

  /** Design flag showReviewFlags: dashed "Draft / Candidate / Sample entry" notes. Turn off for launch. */
  @Column({ default: true })
  showReviewFlags: boolean;

  /** Accept estimate requests online (off = form replaced by call/email). */
  @Column({ default: true })
  estimatesOpen: boolean;

  /** Allow photo attachments on the estimate form. */
  @Column({ default: true })
  photoUploadsOpen: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
