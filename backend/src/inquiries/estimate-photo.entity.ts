import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * A photo attached in step 3. Uploaded before the request is sent (real progress), stored privately
 * (never served publicly) and linked when the estimate is created. Unlinked uploads are deleted after 24 h.
 */
@Entity('estimate_photos')
@Index(['estimateId'])
export class EstimatePhoto {
  /** Random id handed to the browser (not guessable) */
  @PrimaryColumn()
  id: string;

  @Column({ name: 'estimate_id', type: 'integer', nullable: true })
  estimateId: number | null;

  /** Original file name, sanitised, for display only */
  @Column({ name: 'original_name' })
  originalName: string;

  /** Safe generated file name in PRIVATE_UPLOAD_DIR */
  @Column({ name: 'stored_name' })
  storedName: string;

  /** Detected from the file's bytes, not the browser */
  @Column()
  mime: string;

  @Column()
  size: number;

  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
