export const MARKET_DISCOGS_CLIENT = Symbol('MARKET_DISCOGS_CLIENT');

export interface MarketDiscogsClient {
  getMarketplaceListing(listingId: string): Promise<unknown>;
  getReleaseMarketplaceStats(releaseId: string): Promise<unknown>;
}
