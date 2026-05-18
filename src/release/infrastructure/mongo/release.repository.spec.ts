import { Model } from 'mongoose';
import { ReleaseEntity } from '../../domain/release.entity';
import { releaseEntityToDocument } from './mappers/release.mapper';
import { ReleaseRepository } from './release.repository';
import { Release } from './release.schema';

describe('ReleaseRepository', () => {
  let insertMany: jest.Mock;
  let repository: ReleaseRepository;

  beforeEach(() => {
    insertMany = jest.fn().mockResolvedValue([]);
    repository = new ReleaseRepository({
      insertMany,
    } as unknown as Model<Release>);
  });

  it('should_not_call_insertMany_when_addReleases_receives_empty_array', async () => {
    await repository.addReleases([]);

    expect(insertMany).not.toHaveBeenCalled();
  });

  it('should_map_entities_and_call_insertMany_when_addReleases_receives_releases', async () => {
    const entity = ReleaseEntity.from({
      id: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: 12345,
      status: 'Accepted',
      year: 1984,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    });

    await repository.addReleases([entity]);

    expect(insertMany).toHaveBeenCalledWith([releaseEntityToDocument(entity)]);
  });
});
