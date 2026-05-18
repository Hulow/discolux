import { ReleaseEntity } from '../domain/release.entity';
import { ReleaseDiscogsClientStub } from '../infrastructure/discogs/release-discogs-client.stub';
import { GetReleaseQuery } from './get-release.query';
import { GetReleaseQueryHandler } from './get-release.query-handler';

describe('GetReleaseQueryHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
  const handler = new GetReleaseQueryHandler(discogsClient);

  it('should_return_release_entity_when_query_executed', async () => {
    const release = ReleaseEntity.from({
      id: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: 12345,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    discogsClient.setReleaseEntity(release);

    const result = await handler.execute(new GetReleaseQuery('12345'));

    expect(result).toBe(release);
  });
});
