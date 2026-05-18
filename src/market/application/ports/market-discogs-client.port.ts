import type {
  DiscogsMarketplaceListingResponse,
  DiscogsReleaseMarketplaceStatsResponse,
} from '../../infrastructure/discogs/mappers/market-discogs.mapper';

export const MARKET_DISCOGS_CLIENT = Symbol('MARKET_DISCOGS_CLIENT');

export interface MarketDiscogsClient {
  getMarketplaceListing(
    listingId: string,
  ): Promise<DiscogsMarketplaceListingResponse>;
  getReleaseMarketplaceStats(
    releaseId: string,
  ): Promise<DiscogsReleaseMarketplaceStatsResponse>;
}
