import type { MarketDiscogsClient } from '../../application/ports/market-discogs-client.port';

export class MarketDiscogsClientStub implements MarketDiscogsClient {
  private listing: unknown = null;
  private stats: unknown = null;

  setListing(listing: unknown): void {
    this.listing = listing;
  }

  setStats(stats: unknown): void {
    this.stats = stats;
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(this.listing);
  }

  getReleaseMarketplaceStats(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.stats);
  }
}
