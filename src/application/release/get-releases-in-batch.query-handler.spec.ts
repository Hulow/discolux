import { GetReleasesInBatchQuery } from './get-releases-in-batch.query';
import { GetReleasesInBatchQueryHandler } from './get-releases-in-batch.query-handler';
import { DiscogsClient } from './ports/discogs-client.port';

class DiscogsClientStub implements DiscogsClient {
  private releases = new Map<string, unknown>();
  private failures = new Map<string, Error>();

  setRelease(releaseId: string, release: unknown): void {
    this.releases.set(releaseId, release);
  }

  failRelease(releaseId: string, error: Error): void {
    this.failures.set(releaseId, error);
  }

  getRelease(releaseId: string): Promise<unknown> {
    const failure = this.failures.get(releaseId);

    if (failure) {
      return Promise.reject(failure);
    }

    return Promise.resolve(this.releases.get(releaseId) ?? null);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseMarketplaceStats(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }
}

describe('GetReleasesInBatchQueryHandler', () => {
  const discogsClient = new DiscogsClientStub();
  const handler = new GetReleasesInBatchQueryHandler(discogsClient);

  it('should_return_releases_in_ascending_id_order', async () => {
    discogsClient.setRelease('1', { id: 1, title: 'Release 1' });
    discogsClient.setRelease('2', { id: 2, title: 'Release 2' });
    discogsClient.setRelease('3', { id: 3, title: 'Release 3' });

    const result = await handler.execute(
      new GetReleasesInBatchQuery('1', '3'),
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { id: 1, title: 'Release 1' },
      { id: 2, title: 'Release 2' },
      { id: 3, title: 'Release 3' },
    ]);
  });

  it('should_return_error_object_when_discogs_client_rejects', async () => {
    discogsClient.setRelease('1', { id: 1, title: 'Release 1' });
    discogsClient.failRelease(
      '2',
      new Error('Discogs API request failed: 404 Not Found'),
    );
    discogsClient.setRelease('3', { id: 3, title: 'Release 3' });

    const result = await handler.execute(
      new GetReleasesInBatchQuery('1', '3'),
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { id: 1, title: 'Release 1' },
      {
        releaseId: '2',
        errorMessage: 'Discogs API request failed: 404 Not Found',
      },
      { id: 3, title: 'Release 3' },
    ]);
  });
});
