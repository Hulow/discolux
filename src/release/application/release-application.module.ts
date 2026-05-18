import { Module } from '@nestjs/common';
import { ReleaseDiscogsModule } from '../infrastructure/discogs/release-discogs.module';
import { GetReleaseCommandHandler } from './get-release.command-handler';
import { GetReleaseCommunityRatingQueryHandler } from './get-release-community-rating.query-handler';
import { GetReleasesInBatchQueryHandler } from './get-releases-in-batch.query-handler';

@Module({
  imports: [ReleaseDiscogsModule],
  providers: [
    GetReleaseCommandHandler,
    GetReleaseCommunityRatingQueryHandler,
    GetReleasesInBatchQueryHandler,
  ],
})
export class ReleaseApplicationModule {}
