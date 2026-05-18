import { MarketDiscogsClientStub } from '../infrastructure/discogs/market-discogs-client.stub';
import { GetStatisticQuery } from './get-statistic.query';
import { GetStatisticQueryHandler } from './get-statistic.query-handler';

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
