import { ReleaseEntity } from './release.entity';

describe('ReleaseEntity', () => {
  it('should_build_instance_from_props', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const updatedAt = new Date('2024-06-01T00:00:00.000Z');
    const props = {
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
      createdAt,
      updatedAt,
    };

    const entity = ReleaseEntity.from(props);

    expect(entity).toBeInstanceOf(ReleaseEntity);
    expect(entity.id).toBe(props.id);
    expect(entity.releaseId).toBe(props.releaseId);
    expect(entity.status).toBe(props.status);
    expect(entity.year).toBe(props.year);
    expect(entity.url).toBe(props.url);
    expect(entity.communityHave).toBe(props.communityHave);
    expect(entity.communityWant).toBe(props.communityWant);
    expect(entity.ratingCount).toBe(props.ratingCount);
    expect(entity.ratingAverage).toBe(props.ratingAverage);
    expect(entity.addedAt).toBe(props.addedAt);
    expect(entity.changedAt).toBe(props.changedAt);
    expect(entity.numberForSale).toBe(props.numberForSale);
    expect(entity.lowestPrice).toBe(props.lowestPrice);
    expect(entity.country).toBe(props.country);
    expect(entity.released).toBe(props.released);
    expect(entity.notes).toBe(props.notes);
    expect(entity.releaseFormatted).toBe(props.releaseFormatted);
    expect(entity.genres).toBe(props.genres);
    expect(entity.styles).toBe(props.styles);
    expect(entity.blockedFromSale).toBe(props.blockedFromSale);
    expect(entity.createdAt).toBe(createdAt);
    expect(entity.updatedAt).toBe(updatedAt);
  });

  it('should_round_trip_id_and_timestamps', () => {
    const createdAt = new Date('2025-03-15T12:00:00.000Z');
    const updatedAt = new Date('2025-03-16T12:00:00.000Z');
    const id = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

    const entity = ReleaseEntity.from({
      id,
      releaseId: 99,
      createdAt,
      updatedAt,
    });

    expect(entity.id).toBe(id);
    expect(entity.createdAt).toEqual(createdAt);
    expect(entity.updatedAt).toEqual(updatedAt);
  });

  it('should_store_genres_and_styles_as_provided', () => {
    const genres = ['Jazz', 'Funk'];
    const styles: string[] = [];

    const entity = ReleaseEntity.from({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      releaseId: 1,
      genres,
      styles,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(entity.genres).toBe(genres);
    expect(entity.styles).toBe(styles);
  });
});
