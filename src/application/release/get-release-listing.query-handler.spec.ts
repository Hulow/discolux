import { GetReleaseListingQuery } from './get-release-listing.query';
import { GetReleaseListingQueryHandler } from './get-release-listing.query-handler';
import { DiscogsClient } from './ports/discogs-client.port';

class DiscogsClientStub implements DiscogsClient {
  private listing: unknown = null;

  setListing(listing: unknown): void {
    this.listing = listing;
  }

  getRelease(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(this.listing);
  }
}

describe('GetReleaseListingQueryHandler', () => {
  const discogsClient = new DiscogsClientStub();
  const handler = new GetReleaseListingQueryHandler(discogsClient);

  it('should_return_discogs_listing_when_query_executed', async () => {
    const listing = { id: 98765, price: { value: 12.5, currency: 'USD' } };
    discogsClient.setListing(listing);

    const result = await handler.execute(new GetReleaseListingQuery('98765'));

    expect(result).toEqual(listing);
  });
});
