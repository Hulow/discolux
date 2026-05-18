import { Injectable } from '@nestjs/common';
import { DiscogsHttpClient } from '../../../shared/infrastructure/discogs/discogs-http.client';
import type { MarketDiscogsClient as MarketDiscogsClientPort } from '../../application/ports/market-discogs-client.port';
import {
  MarketDiscogsMapper,
  type DiscogsMarketplaceListingResponse,
  type DiscogsReleaseMarketplaceStatsResponse,
} from './mappers/market-discogs.mapper';

@Injectable()
export class MarketDiscogsClient implements MarketDiscogsClientPort {
  constructor(private readonly discogsHttpClient: DiscogsHttpClient) {}

  async getMarketplaceListing(
    listingId: string,
  ): Promise<DiscogsMarketplaceListingResponse> {
    const payload =
      await this.discogsHttpClient.getMarketplaceListing(listingId);

    return MarketDiscogsMapper.fromDiscogsMarketplaceListing(payload);
  }

  async getReleaseMarketplaceStats(
    releaseId: string,
  ): Promise<DiscogsReleaseMarketplaceStatsResponse> {
    const payload =
      await this.discogsHttpClient.getReleaseMarketplaceStats(releaseId);

    return MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats(payload);
  }
}
