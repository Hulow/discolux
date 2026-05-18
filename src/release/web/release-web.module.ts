import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { ReleaseApplicationModule } from '../application/release-application.module';
import { GetReleaseCommunityRatingController } from './get-release-community-rating.controller';
import { GetReleasesInBatchController } from './get-releases-in-batch.controller';
import { GetReleaseController } from './get-release.controller';

@Module({
  imports: [ReleaseApplicationModule],
  controllers: [
    GetReleaseCommunityRatingController,
    GetReleasesInBatchController,
    GetReleaseController,
  ],
  providers: [ApiKeyGuard],
})
export class ReleaseWebModule {}
