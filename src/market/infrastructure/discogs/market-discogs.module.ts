import { Module } from '@nestjs/common';
import { SharedDiscogsModule } from '../../../shared/infrastructure/discogs/shared-discogs.module';
import { MARKET_DISCOGS_CLIENT } from '../../application/ports/market-discogs-client.port';
import { MarketDiscogsClient } from './market-discogs.client';

@Module({
  imports: [SharedDiscogsModule],
  providers: [
    {
      provide: MARKET_DISCOGS_CLIENT,
      useClass: MarketDiscogsClient,
    },
  ],
  exports: [MARKET_DISCOGS_CLIENT],
})
export class MarketDiscogsModule {}
