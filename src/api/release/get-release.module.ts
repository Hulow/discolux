import { Module } from '@nestjs/common';
import { ReleaseApplicationModule } from '../../application/release/release-application.module';
import { GetReleaseCommunityRatingController } from './get-release-community-rating.controller';
import { GetReleaseListingController } from './get-release-listing.controller';
import { GetReleaseStatisticController } from './get-release-statistic.controller';
import { GetReleaseController } from './get-release.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [ReleaseApplicationModule],
  controllers: [
    GetReleaseController,
    GetReleaseCommunityRatingController,
    GetReleaseListingController,
    GetReleaseStatisticController,
  ],
  providers: [ApiKeyGuard],
})
export class GetReleaseModule {}
