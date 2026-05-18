import type { MarketDiscogsClient } from '../../application/ports/market-discogs-client.port';
import type {
  DiscogsMarketplaceListingResponse,
  DiscogsReleaseMarketplaceStatsResponse,
} from './mappers/market-discogs.mapper';

export class MarketDiscogsClientStub implements MarketDiscogsClient {
  private listing: DiscogsMarketplaceListingResponse | null = null;
  private stats: DiscogsReleaseMarketplaceStatsResponse | null = null;

  setListing(listing: DiscogsMarketplaceListingResponse): void {
    this.listing = listing;
  }

  setStats(stats: DiscogsReleaseMarketplaceStatsResponse): void {
    this.stats = stats;
  }

  getMarketplaceListing(
    _listingId: string,
  ): Promise<DiscogsMarketplaceListingResponse> {
    return Promise.resolve(this.listing ?? {});
  }

  getReleaseMarketplaceStats(
    _releaseId: string,
  ): Promise<DiscogsReleaseMarketplaceStatsResponse> {
    return Promise.resolve(this.stats ?? {});
  }
}
