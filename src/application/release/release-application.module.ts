import { Module } from '@nestjs/common';
import { DiscogsModule } from '../../infrastructure/discogs/discogs.module';
import { GetReleaseCommandHandler } from './get-release.command-handler';
import { GetReleaseCommunityRatingQueryHandler } from './get-release-community-rating.query-handler';
import { GetReleaseListingQueryHandler } from './get-release-listing.query-handler';

@Module({
  imports: [DiscogsModule],
  providers: [
    GetReleaseCommandHandler,
    GetReleaseCommunityRatingQueryHandler,
    GetReleaseListingQueryHandler,
  ],
})
export class ReleaseApplicationModule {}
