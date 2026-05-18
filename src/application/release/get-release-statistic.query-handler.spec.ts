import { GetReleaseStatisticQuery } from './get-release-statistic.query';
import { GetReleaseStatisticQueryHandler } from './get-release-statistic.query-handler';
import { DiscogsClient } from './ports/discogs-client.port';

class DiscogsClientStub implements DiscogsClient {
  private stats: unknown = null;

  setStats(stats: unknown): void {
    this.stats = stats;
  }

  getRelease(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseMarketplaceStats(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.stats);
  }
}

describe('GetReleaseStatisticQueryHandler', () => {
  const discogsClient = new DiscogsClientStub();
  const handler = new GetReleaseStatisticQueryHandler(discogsClient);

  it('should_return_discogs_marketplace_stats_when_query_executed', async () => {
    const stats = {
      lowest_price: { value: 10, currency: 'USD' },
      num_for_sale: 3,
      blocked_from_sale: false,
    };
    discogsClient.setStats(stats);

    const result = await handler.execute(
      new GetReleaseStatisticQuery('12345'),
    );

    expect(result).toEqual(stats);
  });
});
