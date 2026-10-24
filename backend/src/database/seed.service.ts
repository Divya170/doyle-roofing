import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';
import { ProjectsService } from '../projects/projects.service';
import { CONTENT_SEED, PROJECTS_SEED } from './seed-data';

/**
 * Idempotent first-boot seed: each step checks before inserting.
 * Estimate requests are never seeded — the prototype's simulated submissions are not reproduced.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    private readonly admins: AdminAuthService,
    private readonly settings: SettingsService,
    private readonly content: ContentService,
    private readonly projects: ProjectsService,
  ) {}

  async onApplicationBootstrap() {
    await this.admins.ensureDefaultAdmin();
    await this.settings.ensure();
    let created = await this.projects.seed(PROJECTS_SEED);
    for (const [type, items] of Object.entries(CONTENT_SEED)) created += await this.content.seedType(type, items);
    if (created) this.logger.log(`Seeded ${created} rows from the design.`);
  }
}
