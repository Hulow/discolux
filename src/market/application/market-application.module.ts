import { Module } from '@nestjs/common';
import { MarketDiscogsModule } from '../infrastructure/discogs/market-discogs.module';
import { GetListingQueryHandler } from './get-listing.query-handler';
import { GetStatisticQueryHandler } from './get-statistic.query-handler';

@Module({
  imports: [MarketDiscogsModule],
  providers: [GetListingQueryHandler, GetStatisticQueryHandler],
})
export class MarketApplicationModule {}
