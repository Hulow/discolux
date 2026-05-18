import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model } from 'mongoose';
import { SharedMongoModule } from '../../../shared/infrastructure/mongo/shared-mongo.module';
import {
  RELEASE_REPOSITORY,
  type ReleaseRepository,
} from '../../application/ports/release-repository.port';
import { ReleaseEntity } from '../../domain/release.entity';
import {
  releaseDocumentToEntity,
  releaseEntityToDocument,
  type ReleaseDocumentData,
} from './mappers/release.mapper';
import { ReleaseMongoModule } from './release-mongo.module';
import { Release } from './release.schema';

describe('ReleaseRepository (integration)', () => {
  let mongoServer: MongoMemoryServer;
  let module: TestingModule;
  let repository: ReleaseRepository;
  let releaseModel: Model<Release>;

  const fullEntity = () =>
    ReleaseEntity.from({
      id: '550e8400-e29b-41d4-a716-446655440000',
      releaseId: 12345,
      status: 'Accepted',
      year: 1984,
      url: 'https://www.discogs.com/release/12345',
      communityHave: 100,
      communityWant: 50,
      ratingCount: 10,
      ratingAverage: 4.5,
      addedAt: '2020-01-01',
      changedAt: '2021-01-01',
      numberForSale: 3,
      lowestPrice: 9.99,
      country: 'US',
      released: '1984',
      notes: 'Test notes',
      releaseFormatted: 'Jan 1, 1984',
      genres: ['Rock'],
      styles: ['Alternative Rock'],
      blockedFromSale: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    });

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        SharedMongoModule,
        ReleaseMongoModule,
      ],
    }).compile();

    repository = module.get(RELEASE_REPOSITORY);
    releaseModel = module.get(getModelToken(Release.name));
  });

  afterAll(async () => {
    await module.close();
    await mongoServer.stop();
    delete process.env.MONGO_URI;
  });

  beforeEach(async () => {
    await releaseModel.deleteMany({});
  });

  it('should_persist_mapped_document_when_addReleases_called', async () => {
    const entity = fullEntity();

    await repository.addReleases([entity]);

    const stored = await releaseModel.findById(entity.id).lean();
    expect(stored).toEqual(releaseEntityToDocument(entity));
    expect(releaseDocumentToEntity(stored as ReleaseDocumentData)).toEqual(
      entity,
    );
  });

  it('should_persist_multiple_releases_when_addReleases_called', async () => {
    const first = fullEntity();
    const second = ReleaseEntity.from({
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      releaseId: 99,
      createdAt: new Date('2025-03-15T12:00:00.000Z'),
      updatedAt: new Date('2025-03-16T12:00:00.000Z'),
    });

    await repository.addReleases([first, second]);

    const count = await releaseModel.countDocuments();
    expect(count).toBe(2);
  });
});
