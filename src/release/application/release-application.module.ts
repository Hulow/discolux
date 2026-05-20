import { Module } from '@nestjs/common';
import { ReleaseDiscogsModule } from '../infrastructure/discogs/release-discogs.module';
import { ReleaseDumpModule } from '../infrastructure/dump/release-dump.module';
import { ReleaseMongoModule } from '../infrastructure/mongo/release-mongo.module';
import { GetReleaseQueryHandler } from './get-release.query-handler';
import { GetCommunityRatingQueryHandler } from './get-community-rating.query-handler';
import { GetReleasesInBatchQueryHandler } from './get-releases-in-batch.query-handler';
import { ProcessReleasesInBatchCommandHandler } from './process-releases-in-batch.command-handler';
import { ProcessReleasesCommandHandler } from './process-releases.command-handler';
import { DumpReleaseCommandHandler } from './dump-release.command-handler';

@Module({
  imports: [ReleaseDiscogsModule, ReleaseMongoModule, ReleaseDumpModule],
  providers: [
    GetReleaseQueryHandler,
    GetCommunityRatingQueryHandler,
    GetReleasesInBatchQueryHandler,
    ProcessReleasesInBatchCommandHandler,
    ProcessReleasesCommandHandler,
    DumpReleaseCommandHandler,
  ],
})
export class ReleaseApplicationModule {}
