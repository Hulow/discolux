import { ReleaseDiscogsClientStub } from '../infrastructure/discogs/release-discogs-client.stub';
import { GetReleasesInBatchQuery } from './get-releases-in-batch.query';
import { GetReleasesInBatchQueryHandler } from './get-releases-in-batch.query-handler';

describe('GetReleasesInBatchQueryHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
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
