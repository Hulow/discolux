import { GetStatisticQuery } from './get-statistic.query';
import { GetStatisticQueryHandler } from './get-statistic.query-handler';
import { MarketDiscogsClient } from './ports/market-discogs-client.port';

class MarketDiscogsClientStub implements MarketDiscogsClient {
  private stats: unknown = null;

  setStats(stats: unknown): void {
    this.stats = stats;
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseMarketplaceStats(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.stats);
  }
}

describe('GetStatisticQueryHandler', () => {
  const discogsClient = new MarketDiscogsClientStub();
  const handler = new GetStatisticQueryHandler(discogsClient);

  it('should_return_discogs_marketplace_stats_when_query_executed', async () => {
    const stats = {
      lowest_price: { value: 10, currency: 'USD' },
      num_for_sale: 3,
      blocked_from_sale: false,
    };
    discogsClient.setStats(stats);

    const result = await handler.execute(new GetStatisticQuery('12345'));

    expect(result).toEqual(stats);
  });
});
