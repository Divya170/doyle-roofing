import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { RequestStatus } from '../common/forms';

/** An estimate request (lead) from the 5-step wizard. Handoff: "Store the lead with status and timestamps." */
@Entity('estimates')
@Index(['status'])
@Index(['createdAt'])
@Index(['email'])
export class Estimate {
  @PrimaryGeneratedColumn()
  id: number;

  /** DRR-1001 */
  @Index({ unique: true })
  @Column({ name: 'public_ref', type: 'varchar', nullable: true })
  publicRef: string | null;

  /** roofing | remodeling */
  @Column({ name: 'project_type' })
  type: string;

  @Column({ name: 'roof_issues', type: 'simple-json' })
  roofIssues: string[];

  @Column({ name: 'roof_age', default: '' })
  roofAge: string;

  @Column({ name: 'remodel_areas', type: 'simple-json' })
  areas: string[];

  @Column({ name: 'property_type' })
  property: string;

  @Column({ type: 'varchar', length: 200 })
  location: string;

  @Column()
  timeline: string;

  @Column()
  budget: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', default: 'new' })
  status: RequestStatus;

  @Column({ type: 'text', default: '' })
  notes: string;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', nullable: true })
  idempotencyKey: string | null;

  /** disabled | pending | sent | failed — workshop email */
  @Column({ name: 'notification_state', default: 'disabled' })
  notificationState: string;

  /** disabled | pending | sent | failed — customer acknowledgement */
  @Column({ name: 'acknowledgement_state', default: 'disabled' })
  acknowledgementState: string;

  @Column({ name: 'ip_hash', default: '' })
  ipHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
