import { GetReleaseCommunityRatingQuery } from './get-release-community-rating.query';
import { GetReleaseCommunityRatingQueryHandler } from './get-release-community-rating.query-handler';
import { ReleaseDiscogsClient } from './ports/release-discogs-client.port';

class ReleaseDiscogsClientStub implements ReleaseDiscogsClient {
  private rating: unknown = null;

  setRating(rating: unknown): void {
    this.rating = rating;
  }

  getRelease(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.rating);
  }
}

describe('GetReleaseCommunityRatingQueryHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
  const handler = new GetReleaseCommunityRatingQueryHandler(discogsClient);

  it('should_return_discogs_rating_when_query_executed', async () => {
    const rating = { rating: { average: 4.5, count: 10 } };
    discogsClient.setRating(rating);

    const result = await handler.execute(
      new GetReleaseCommunityRatingQuery('12345'),
    );

    expect(result).toEqual(rating);
  });
});
