import { Module } from '@nestjs/common';
import { ReleaseDiscogsModule } from '../infrastructure/discogs/release-discogs.module';
import { GetReleaseQueryHandler } from './get-release.query-handler';
import { GetCommunityRatingQueryHandler } from './get-community-rating.query-handler';
import { GetReleasesInBatchQueryHandler } from './get-releases-in-batch.query-handler';

@Module({
  imports: [ReleaseDiscogsModule],
  providers: [
    GetReleaseQueryHandler,
    GetCommunityRatingQueryHandler,
    GetReleasesInBatchQueryHandler,
  ],
})
export class ReleaseApplicationModule {}
