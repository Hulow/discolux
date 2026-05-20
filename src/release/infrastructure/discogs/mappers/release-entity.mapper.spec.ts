import {
  discogsReleaseToEntity,
  discogsReleaseToEntityProps,
} from './release-entity.mapper';
import type { DiscogsReleaseResponse } from './release-discogs.mapper';

describe('release-entity.mapper', () => {
  const fullDto: DiscogsReleaseResponse = {
    id: 12345,
    status: 'Accepted',
    year: 1984,
    uri: 'https://www.discogs.com/release/12345',
    resource_url: 'https://api.discogs.com/releases/12345',
    community: {
      have: 100,
      want: 50,
      rating: { count: 10, average: 4.5 },
    },
    date_added: '2020-01-01',
    date_changed: '2021-01-01',
    num_for_sale: 3,
    lowest_price: 9.99,
    country: 'US',
    released: '1984',
    notes: 'Test notes',
    released_formatted: 'Jan 1, 1984',
    genres: ['Rock', undefined],
    styles: [undefined, 'Alternative Rock'],
    blocked_from_sale: false,
  };

  it('should_map_discogs_dto_to_entity_props', () => {
    const props = discogsReleaseToEntityProps(fullDto);

    expect(props.releaseId).toBe(12345);
    expect(props.status).toBe('Accepted');
    expect(props.year).toBe(1984);
    expect(props.url).toBe('https://www.discogs.com/release/12345');
    expect(props.communityHave).toBe(100);
    expect(props.communityWant).toBe(50);
    expect(props.ratingCount).toBe(10);
    expect(props.ratingAverage).toBe(4.5);
    expect(props.addedAt).toBe('2020-01-01');
    expect(props.changedAt).toBe('2021-01-01');
    expect(props.numberForSale).toBe(3);
    expect(props.lowestPrice).toBe(9.99);
    expect(props.country).toBe('US');
    expect(props.released).toEqual(new Date('1984-01-01T00:00:00.000Z'));
    expect(props.notes).toBe('Test notes');
    expect(props.releaseFormatted).toBe('Jan 1, 1984');
    expect(props.genres).toEqual(['Rock']);
    expect(props.styles).toEqual(['Alternative Rock']);
    expect(props.blockedFromSale).toBe(false);
    expect(props.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(props.createdAt).toBeInstanceOf(Date);
    expect(props.updatedAt).toBeInstanceOf(Date);
  });

  it('should_prefer_uri_over_resource_url_for_url', () => {
    const props = discogsReleaseToEntityProps({
      id: 1,
      uri: 'https://uri.example',
      resource_url: 'https://resource.example',
    });

    expect(props.url).toBe('https://uri.example');
  });

  it('should_use_resource_url_when_uri_is_absent', () => {
    const props = discogsReleaseToEntityProps({
      id: 1,
      resource_url: 'https://resource.example',
    });

    expect(props.url).toBe('https://resource.example');
  });

  it('should_throw_when_discogs_id_is_missing', () => {
    expect(() => discogsReleaseToEntityProps({})).toThrow(
      'Discogs release id is required',
    );
  });

  it('should_build_release_entity_from_dto', () => {
    const entity = discogsReleaseToEntity({ id: 99, status: 'Accepted' });

    expect(entity.releaseId).toBe(99);
    expect(entity.status).toBe('Accepted');
  });
});
