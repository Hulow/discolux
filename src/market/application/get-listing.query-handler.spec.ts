import { MarketDiscogsClientStub } from '../infrastructure/discogs/market-discogs-client.stub';
import { GetListingQuery } from './get-listing.query';
import { GetListingQueryHandler } from './get-listing.query-handler';

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
