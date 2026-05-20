import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { ReleaseApplicationModule } from '../application/release-application.module';
import { GetCommunityRatingController } from './get-community-rating.controller';
import { GetReleasesInBatchController } from './get-releases-in-batch.controller';
import { GetReleaseController } from './get-release.controller';
import { ProcessReleasesInBatchController } from './process-releases-in-batch.controller';
import { DumpReleaseController } from './dump-release.controller';

@Module({
  imports: [ReleaseApplicationModule],
  controllers: [
    GetCommunityRatingController,
    GetReleasesInBatchController,
    GetReleaseController,
    ProcessReleasesInBatchController,
    DumpReleaseController,
  ],
  providers: [ApiKeyGuard],
})
export class ReleaseWebModule {}
