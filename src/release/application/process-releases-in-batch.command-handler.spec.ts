import { ReleaseEntity } from '../domain/release.entity';
import { ReleaseDiscogsClientStub } from '../infrastructure/discogs/release-discogs-client.stub';
import type { ReleaseRepository } from './ports/release-repository.port';
import { ProcessReleasesInBatchCommand } from './process-releases-in-batch.command';
import { ProcessReleasesInBatchCommandHandler } from './process-releases-in-batch.command-handler';

describe('ProcessReleasesInBatchCommandHandler', () => {
  const discogsClient = new ReleaseDiscogsClientStub();
  let upsertReleases: jest.Mock;
  let repository: ReleaseRepository;
  let handler: ProcessReleasesInBatchCommandHandler;

  const releaseEntity = (releaseId: number) =>
    ReleaseEntity.from({
      id: `entity-${releaseId}`,
      releaseId,
      status: 'Accepted',
      year: 1984,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    });

  beforeEach(() => {
    upsertReleases = jest.fn().mockResolvedValue(undefined);
    repository = { upsertReleases } as unknown as ReleaseRepository;
    handler = new ProcessReleasesInBatchCommandHandler(
      discogsClient,
      repository,
    );
  });

  it('should_upsert_successful_entities_and_stubs_in_order', async () => {
    const release1 = releaseEntity(1);
    const release3 = releaseEntity(3);
    discogsClient.setReleaseEntity('1', release1);
    discogsClient.failRelease(
      '2',
      new Error('Discogs API request failed: 404 Not Found'),
    );
    discogsClient.setReleaseEntity('3', release3);

    await handler.execute(new ProcessReleasesInBatchCommand('1', '3'));

    expect(upsertReleases).toHaveBeenCalledTimes(1);
    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities).toHaveLength(3);
    expect(entities[0]).toBe(release1);
    expect(entities[2]).toBe(release3);

    const stub = entities[1];
    expect(stub.releaseId).toBe(2);
    expect(stub.id).toEqual(expect.any(String));
    expect(stub.createdAt).toEqual(expect.any(Date));
    expect(stub.updatedAt).toEqual(expect.any(Date));
    expect(stub.status).toBeUndefined();
    expect(stub.year).toBeUndefined();
    expect(stub.url).toBeUndefined();
    expect(stub.communityHave).toBeUndefined();
    expect(stub.communityWant).toBeUndefined();
    expect(stub.ratingCount).toBeUndefined();
    expect(stub.ratingAverage).toBeUndefined();
    expect(stub.addedAt).toBeUndefined();
    expect(stub.changedAt).toBeUndefined();
    expect(stub.numberForSale).toBeUndefined();
    expect(stub.lowestPrice).toBeUndefined();
    expect(stub.country).toBeUndefined();
    expect(stub.released).toBeUndefined();
    expect(stub.notes).toBeUndefined();
    expect(stub.releaseFormatted).toBeUndefined();
    expect(stub.genres).toBeUndefined();
    expect(stub.styles).toBeUndefined();
    expect(stub.blockedFromSale).toBeUndefined();
  });
});
