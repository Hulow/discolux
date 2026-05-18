import { ReleaseEntity } from '../domain/release.entity';
import { ReleaseDiscogsClientStub } from '../infrastructure/discogs/release-discogs-client.stub';
import { GetReleasesInBatchQuery } from './get-releases-in-batch.query';
import { GetReleasesInBatchQueryHandler } from './get-releases-in-batch.query-handler';

describe('GetReleasesInBatchQueryHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
  const handler = new GetReleasesInBatchQueryHandler(discogsClient);

  const releaseEntity = (releaseId: number) =>
    ReleaseEntity.from({
      id: `entity-${releaseId}`,
      releaseId,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    });

  it('should_return_releases_in_ascending_id_order', async () => {
    const release1 = releaseEntity(1);
    const release2 = releaseEntity(2);
    const release3 = releaseEntity(3);
    discogsClient.setReleaseEntity('1', release1);
    discogsClient.setReleaseEntity('2', release2);
    discogsClient.setReleaseEntity('3', release3);

    const result = await handler.execute(
      new GetReleasesInBatchQuery('1', '3'),
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([release1, release2, release3]);
  });

  it('should_return_error_object_when_discogs_client_rejects', async () => {
    const release1 = releaseEntity(1);
    const release3 = releaseEntity(3);
    discogsClient.setReleaseEntity('1', release1);
    discogsClient.failRelease(
      '2',
      new Error('Discogs API request failed: 404 Not Found'),
    );
    discogsClient.setReleaseEntity('3', release3);

    const result = await handler.execute(
      new GetReleasesInBatchQuery('1', '3'),
    );

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      release1,
      {
        releaseId: '2',
        errorMessage: 'Discogs API request failed: 404 Not Found',
      },
      release3,
    ]);
  });
});
