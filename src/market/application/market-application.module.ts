import { Module } from '@nestjs/common';
import { MarketDiscogsModule } from '../infrastructure/discogs/market-discogs.module';
import { GetReleaseListingQueryHandler } from './get-release-listing.query-handler';
import { GetReleaseStatisticQueryHandler } from './get-release-statistic.query-handler';

@Module({
  imports: [MarketDiscogsModule],
  providers: [GetReleaseListingQueryHandler, GetReleaseStatisticQueryHandler],
})
export class MarketApplicationModule {}
