import { GetListingQuery } from './get-listing.query';
import { GetListingQueryHandler } from './get-listing.query-handler';
import { MarketDiscogsClient } from './ports/market-discogs-client.port';

class MarketDiscogsClientStub implements MarketDiscogsClient {
  private listing: unknown = null;

  setListing(listing: unknown): void {
    this.listing = listing;
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(this.listing);
  }

  getReleaseMarketplaceStats(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }
}

describe('GetListingQueryHandler', () => {
  const discogsClient = new MarketDiscogsClientStub();
  const handler = new GetListingQueryHandler(discogsClient);

  it('should_return_discogs_listing_when_query_executed', async () => {
    const listing = { id: 98765, price: { value: 12.5, currency: 'USD' } };
    discogsClient.setListing(listing);

    const result = await handler.execute(new GetListingQuery('98765'));

    expect(result).toEqual(listing);
  });
});
