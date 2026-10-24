import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estimate } from './estimate.entity';
import { EstimatePhoto } from './estimate-photo.entity';
import { InquiriesService } from './inquiries.service';
import { AdminEstimatesController, EstimatesController } from './inquiries.controller';
import { SettingsModule } from '../settings/settings.module';
import { ContentModule } from '../content/content.module';

/** Estimate requests (leads) + their photos. Module keeps the canonical "inquiries" name. */
@Module({
  imports: [TypeOrmModule.forFeature([Estimate, EstimatePhoto]), SettingsModule, ContentModule],
  providers: [InquiriesService],
  controllers: [EstimatesController, AdminEstimatesController],
})
export class InquiriesModule {}
