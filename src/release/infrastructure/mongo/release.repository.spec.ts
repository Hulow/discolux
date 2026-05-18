import { Model } from 'mongoose';
import { ReleaseEntity } from '../../domain/release.entity';
import { releaseEntityToDocument } from './mappers/release.mapper';
import { ReleaseRepository } from './release.repository';
import { Release } from './release.schema';

describe('ReleaseRepository', () => {
  let insertMany: jest.Mock;
  let bulkWrite: jest.Mock;
  let repository: ReleaseRepository;

  beforeEach(() => {
    insertMany = jest.fn().mockResolvedValue([]);
    bulkWrite = jest.fn().mockResolvedValue({});
    repository = new ReleaseRepository({
      insertMany,
      bulkWrite,
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

  it('should_not_call_bulkWrite_when_upsertReleases_receives_empty_array', async () => {
    await repository.upsertReleases([]);

    expect(bulkWrite).not.toHaveBeenCalled();
  });

  it('should_call_bulkWrite_with_full_and_stub_upsert_operations', async () => {
    const fullEntity = ReleaseEntity.from({
      id: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: 1,
      status: 'Accepted',
      year: 1984,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    });
    const stubEntity = ReleaseEntity.from({
      id: '660e8400-e29b-41d4-a716-446655440001',
      releaseId: 2,
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
      updatedAt: new Date('2024-07-01T00:00:00.000Z'),
    });
    const fullDoc = releaseEntityToDocument(fullEntity);
    const stubDoc = releaseEntityToDocument(stubEntity);

    await repository.upsertReleases([fullEntity, stubEntity]);

    expect(bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { releaseId: 1 },
          update: {
            $set: {
              status: fullDoc.status,
              year: fullDoc.year,
              updatedAt: fullDoc.updatedAt,
            },
            $setOnInsert: {
              _id: fullDoc._id,
              releaseId: fullDoc.releaseId,
              createdAt: fullDoc.createdAt,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { releaseId: 2 },
          update: {
            $set: {
              releaseId: stubDoc.releaseId,
              updatedAt: stubDoc.updatedAt,
            },
            $setOnInsert: {
              _id: stubDoc._id,
              createdAt: stubDoc.createdAt,
            },
          },
          upsert: true,
        },
      },
    ]);
  });
});
