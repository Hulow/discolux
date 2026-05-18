import { Injectable } from '@nestjs/common';
import { DiscogsHttpClient } from '../../../shared/infrastructure/discogs/discogs-http.client';
import type { MarketDiscogsClient as MarketDiscogsClientPort } from '../../application/ports/market-discogs-client.port';

@Injectable()
export class MarketDiscogsClient implements MarketDiscogsClientPort {
  constructor(private readonly discogsHttpClient: DiscogsHttpClient) {}

  getMarketplaceListing(listingId: string): Promise<unknown> {
    return this.discogsHttpClient.getMarketplaceListing(listingId);
  }

  getReleaseMarketplaceStats(releaseId: string): Promise<unknown> {
    return this.discogsHttpClient.getReleaseMarketplaceStats(releaseId);
  }
}
