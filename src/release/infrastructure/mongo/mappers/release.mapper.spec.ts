import { ReleaseEntity } from '../../../domain/release.entity';
import {
  releaseDocumentToEntity,
  releaseEntityToDocument,
} from './release.mapper';

describe('release.mapper', () => {
  const entity = ReleaseEntity.from({
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
    released: new Date('1984-01-01T00:00:00.000Z'),
    notes: 'Test notes',
    releaseFormatted: 'Jan 1, 1984',
    genres: ['Rock'],
    styles: ['Alternative Rock'],
    blockedFromSale: false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
  });

  it('should_round_trip_entity_through_document', () => {
    const document = releaseEntityToDocument(entity);
    const roundTripped = releaseDocumentToEntity(document);

    expect(roundTripped).toEqual(entity);
  });
});
