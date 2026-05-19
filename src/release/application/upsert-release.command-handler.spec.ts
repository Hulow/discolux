import { ReleaseEntity } from '../domain/release.entity';
import type { ReleaseRepository } from './ports/release-repository.port';
import { UpsertReleaseCommand } from './upsert-release.command';
import { UpsertReleaseCommandHandler } from './upsert-release.command-handler';

describe('UpsertReleaseCommandHandler', () => {
  let upsertReleases: jest.Mock;
  let repository: ReleaseRepository;
  let handler: UpsertReleaseCommandHandler;

  beforeEach(() => {
    upsertReleases = jest.fn().mockResolvedValue(undefined);
    repository = { upsertReleases } as unknown as ReleaseRepository;
    handler = new UpsertReleaseCommandHandler(repository);
  });

  it('should_upsert_entity_when_genres_are_electronic_only', async () => {
    await handler.execute(
      new UpsertReleaseCommand(
        1,
        'Sweden',
        '1999-03-00',
        ['Electronic'],
        ['Deep House'],
      ),
    );

    expect(upsertReleases).toHaveBeenCalledTimes(1);
    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities).toHaveLength(1);

    const entity = entities[0];
    expect(entity.releaseId).toBe(1);
    expect(entity.country).toBe('Sweden');
    expect(entity.released).toBe('1999-03-00');
    expect(entity.genres).toEqual(['Electronic']);
    expect(entity.styles).toEqual(['Deep House']);
    expect(entity.id).toEqual(expect.any(String));
    expect(entity.createdAt).toEqual(expect.any(Date));
    expect(entity.updatedAt).toEqual(expect.any(Date));
  });

  it('should_not_upsert_when_genres_are_not_electronic', async () => {
    await handler.execute(
      new UpsertReleaseCommand(1, 'Sweden', '1999-03-00', ['Rock'], [
        'Deep House',
      ]),
    );

    expect(upsertReleases).not.toHaveBeenCalled();
  });

  it('should_not_upsert_when_genres_are_omitted', async () => {
    await handler.execute(
      new UpsertReleaseCommand(1, 'Sweden', '1999-03-00', undefined, [
        'Deep House',
      ]),
    );

    expect(upsertReleases).not.toHaveBeenCalled();
  });

  it('should_not_upsert_when_genres_include_electronic_and_another_genre', async () => {
    await handler.execute(
      new UpsertReleaseCommand(1, 'Sweden', '1999-03-00', [
        'Electronic',
        'Techno',
      ]),
    );

    expect(upsertReleases).not.toHaveBeenCalled();
  });
});
