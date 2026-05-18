import { GetReleaseQuery } from './get-release.query';
import { GetReleaseQueryHandler } from './get-release.query-handler';
import { ReleaseDiscogsClient } from './ports/release-discogs-client.port';

class ReleaseDiscogsClientStub implements ReleaseDiscogsClient {
  private release: unknown = null;

  setRelease(release: unknown): void {
    this.release = release;
  }

  getRelease(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.release);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }
}

describe('GetReleaseQueryHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
  const handler = new GetReleaseQueryHandler(discogsClient);

  it('should_return_discogs_release_when_query_executed', async () => {
    const release = { id: 12345, title: 'Test Release' };
    discogsClient.setRelease(release);

    const result = await handler.execute(new GetReleaseQuery('12345'));

    expect(result).toEqual(release);
  });
});
