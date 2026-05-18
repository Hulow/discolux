import { ReleaseDiscogsClientStub } from '../infrastructure/discogs/release-discogs-client.stub';
import { GetCommunityRatingQuery } from './get-community-rating.query';
import { GetCommunityRatingQueryHandler } from './get-community-rating.query-handler';

describe('GetCommunityRatingQueryHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
  const handler = new GetCommunityRatingQueryHandler(discogsClient);

  it('should_return_discogs_rating_when_query_executed', async () => {
    const rating = { rating: { average: 4.5, count: 10 } };
    discogsClient.setRating(rating);

    const result = await handler.execute(
      new GetCommunityRatingQuery('12345'),
    );

    expect(result).toEqual(rating);
  });
});
