import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { ReleaseApplicationModule } from '../application/release-application.module';
import { ReleaseScheduleModule } from '../infrastructure/schedule/release-schedule.module';
import { GetCommunityRatingController } from './get-community-rating.controller';
import { GetReleasesInBatchController } from './get-releases-in-batch.controller';
import { GetReleaseController } from './get-release.controller';
import { ProcessReleasesInBatchController } from './process-releases-in-batch.controller';
import { DumpReleaseController } from './dump-release.controller';
import { ScheduleReleasesController } from './schedule-releases.controller';

@Module({
  imports: [ReleaseApplicationModule, ReleaseScheduleModule],
  controllers: [
    GetCommunityRatingController,
    GetReleasesInBatchController,
    GetReleaseController,
    ProcessReleasesInBatchController,
    DumpReleaseController,
    ScheduleReleasesController,
  ],
  providers: [ApiKeyGuard],
})
export class ReleaseWebModule {}
