import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { ReleaseApplicationModule } from '../application/release-application.module';
import { GetCommunityRatingController } from './get-community-rating.controller';
import { GetReleasesInBatchController } from './get-releases-in-batch.controller';
import { GetReleaseController } from './get-release.controller';
import { ProcessReleasesInBatchController } from './process-releases-in-batch.controller';
import { UpsertReleaseController } from './upsert-release.controller';

@Module({
  imports: [ReleaseApplicationModule],
  controllers: [
    GetCommunityRatingController,
    GetReleasesInBatchController,
    GetReleaseController,
    ProcessReleasesInBatchController,
    UpsertReleaseController,
  ],
  providers: [ApiKeyGuard],
})
export class ReleaseWebModule {}
