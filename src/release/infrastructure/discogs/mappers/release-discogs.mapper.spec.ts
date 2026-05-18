import { ReleaseDiscogsMapper } from './release-discogs.mapper';

describe('ReleaseDiscogsMapper', () => {
  const fullReleasePayload = {
    id: 12345,
    status: 'Accepted',
    year: 1984,
    resource_url: 'https://api.discogs.com/releases/12345',
    uri: 'https://www.discogs.com/release/12345',
    artists: [
      {
        name: 'Artist',
        id: 1,
        resource_url: 'https://api.discogs.com/artists/1',
        thumbnail_url: 'https://example.com/thumb.jpg',
        anv: '',
        join: '',
        role: '',
        tracks: '',
      },
    ],
    artists_sort: 'Artist',
    labels: [
      {
        name: 'Label',
        catno: 'CAT-1',
        entity_type: '1',
        entity_type_name: 'Label',
        id: 2,
        resource_url: 'https://api.discogs.com/labels/2',
        thumbnail_url: 'https://example.com/label.jpg',
      },
    ],
    series: [
      {
        name: 'Series',
        catno: 'S-1',
        entity_type: '2',
        entity_type_name: 'Series',
        id: 3,
        resource_url: 'https://api.discogs.com/labels/3',
      },
    ],
    companies: [
      {
        name: 'Company',
        catno: 'C-1',
        entity_type: '4',
        entity_type_name: 'Manufactured By',
        id: 4,
        resource_url: 'https://api.discogs.com/labels/4',
        thumbnail_url: 'https://example.com/company.jpg',
      },
    ],
    formats: [
      {
        name: 'Vinyl',
        qty: '1',
        descriptions: ['LP', 'Album'],
      },
    ],
    data_quality: 'Needs Vote',
    community: {
      have: 100,
      want: 50,
      rating: { count: 10, average: 4.5 },
      submitter: {
        username: 'user1',
        resource_url: 'https://api.discogs.com/users/user1',
      },
      contributors: [
        {
          username: 'user2',
          resource_url: 'https://api.discogs.com/users/user2',
        },
      ],
      data_quality: 'Correct',
      status: 'Accepted',
    },
    format_quantity: 1,
    date_added: '2020-01-01',
    date_changed: '2021-01-01',
    num_for_sale: 5,
    lowest_price: 9.99,
    master_id: 99,
    master_url: 'https://api.discogs.com/masters/99',
    title: 'Test Release',
    country: 'US',
    released: '1984',
    notes: 'Some notes',
    released_formatted: '1984',
    identifiers: [
      {
        type: 'Barcode',
        value: '123',
        description: 'Scanned',
      },
    ],
    videos: [
      {
        uri: 'https://www.youtube.com/watch?v=abc',
        title: 'Video',
        description: 'Clip',
        duration: 180,
        embed: true,
      },
    ],
    genres: ['Rock'],
    styles: ['Alternative'],
    tracklist: [
      {
        position: 'A1',
        type_: 'track',
        title: 'Song',
        duration: '3:30',
      },
    ],
    extraartists: [
      {
        name: 'Producer',
        id: 5,
        resource_url: 'https://api.discogs.com/artists/5',
        thumbnail_url: 'https://example.com/producer.jpg',
        anv: '',
        join: '',
        role: 'Producer',
        tracks: '',
      },
    ],
    images: [
      {
        type: 'primary',
        uri: 'https://example.com/image.jpg',
        resource_url: 'https://api.discogs.com/images/1',
        uri150: 'https://example.com/image150.jpg',
        width: 600,
        height: 600,
      },
    ],
    thumb: 'https://example.com/thumb.jpg',
    estimated_weight: 230,
    blocked_from_sale: false,
    is_offensive: false,
  };

  describe('fromDiscogsRelease', () => {
    it('should_map_full_payload', () => {
      const result = ReleaseDiscogsMapper.fromDiscogsRelease(fullReleasePayload);

      expect(result).toEqual({
        id: 12345,
        status: 'Accepted',
        year: 1984,
        resource_url: 'https://api.discogs.com/releases/12345',
        uri: 'https://www.discogs.com/release/12345',
        artists: [
          {
            name: 'Artist',
            id: 1,
            resource_url: 'https://api.discogs.com/artists/1',
            thumbnail_url: 'https://example.com/thumb.jpg',
            anv: '',
            join: '',
            role: '',
            tracks: '',
          },
        ],
        artists_sort: 'Artist',
        labels: [
          {
            name: 'Label',
            catno: 'CAT-1',
            entity_type: '1',
            entity_type_name: 'Label',
            id: 2,
            resource_url: 'https://api.discogs.com/labels/2',
            thumbnail_url: 'https://example.com/label.jpg',
          },
        ],
        series: [
          {
            name: 'Series',
            catno: 'S-1',
            entity_type: '2',
            entity_type_name: 'Series',
            id: 3,
            resource_url: 'https://api.discogs.com/labels/3',
          },
        ],
        companies: [
          {
            name: 'Company',
            catno: 'C-1',
            entity_type: '4',
            entity_type_name: 'Manufactured By',
            id: 4,
            resource_url: 'https://api.discogs.com/labels/4',
            thumbnail_url: 'https://example.com/company.jpg',
          },
        ],
        formats: [
          {
            name: 'Vinyl',
            qty: '1',
            descriptions: ['LP', 'Album'],
          },
        ],
        data_quality: 'Needs Vote',
        community: {
          have: 100,
          want: 50,
          rating: { count: 10, average: 4.5 },
          submitter: {
            username: 'user1',
            resource_url: 'https://api.discogs.com/users/user1',
          },
          contributors: [
            {
              username: 'user2',
              resource_url: 'https://api.discogs.com/users/user2',
            },
          ],
          data_quality: 'Correct',
          status: 'Accepted',
        },
        format_quantity: 1,
        date_added: '2020-01-01',
        date_changed: '2021-01-01',
        num_for_sale: 5,
        lowest_price: 9.99,
        master_id: 99,
        master_url: 'https://api.discogs.com/masters/99',
        title: 'Test Release',
        country: 'US',
        released: '1984',
        notes: 'Some notes',
        released_formatted: '1984',
        identifiers: [
          {
            type: 'Barcode',
            value: '123',
            description: 'Scanned',
          },
        ],
        videos: [
          {
            uri: 'https://www.youtube.com/watch?v=abc',
            title: 'Video',
            description: 'Clip',
            duration: 180,
            embed: true,
          },
        ],
        genres: ['Rock'],
        styles: ['Alternative'],
        tracklist: [
          {
            position: 'A1',
            type_: 'track',
            title: 'Song',
            duration: '3:30',
          },
        ],
        extraartists: [
          {
            name: 'Producer',
            id: 5,
            resource_url: 'https://api.discogs.com/artists/5',
            thumbnail_url: 'https://example.com/producer.jpg',
            anv: '',
            join: '',
            role: 'Producer',
            tracks: '',
          },
        ],
        images: [
          {
            type: 'primary',
            uri: 'https://example.com/image.jpg',
            resource_url: 'https://api.discogs.com/images/1',
            uri150: 'https://example.com/image150.jpg',
            width: 600,
            height: 600,
          },
        ],
        thumb: 'https://example.com/thumb.jpg',
        estimated_weight: 230,
        blocked_from_sale: false,
        is_offensive: false,
      });
    });

    it('should_return_empty_object_for_empty_payload', () => {
      expect(ReleaseDiscogsMapper.fromDiscogsRelease({})).toEqual({});
    });

    it('should_return_empty_object_for_null_payload', () => {
      expect(ReleaseDiscogsMapper.fromDiscogsRelease(null)).toEqual({});
    });

    it('should_return_empty_object_for_undefined_payload', () => {
      expect(ReleaseDiscogsMapper.fromDiscogsRelease(undefined)).toEqual({});
    });

    it('should_map_undefined_for_missing_nested_fields', () => {
      const result = ReleaseDiscogsMapper.fromDiscogsRelease({
        id: 1,
        community: {},
        artists: [{}],
        formats: [{}],
      });

      expect(result).toEqual({
        id: 1,
        community: {},
        artists: [{}],
        formats: [{}],
      });
    });

    it('should_map_undefined_for_wrong_type_scalars', () => {
      const result = ReleaseDiscogsMapper.fromDiscogsRelease({
        id: 'not-a-number',
        year: '1984',
        lowest_price: true,
        blocked_from_sale: 'no',
        community: {
          have: 'many',
          rating: { average: 'high', count: null },
        },
      });

      expect(result).toEqual({
        community: {
          rating: {},
        },
      });
    });

    it('should_map_undefined_for_non_object_array_items', () => {
      const result = ReleaseDiscogsMapper.fromDiscogsRelease({
        genres: ['Rock', 42, null],
        artists: ['not-an-artist', { name: 'Valid' }],
      });

      expect(result).toEqual({
        genres: ['Rock', undefined, undefined],
        artists: [undefined, { name: 'Valid' }],
      });
    });
  });

  describe('fromDiscogsCommunityRating', () => {
    it('should_map_full_payload', () => {
      const result = ReleaseDiscogsMapper.fromDiscogsCommunityRating({
        release_id: 12345,
        rating: { average: 4.5, count: 10 },
      });

      expect(result).toEqual({
        release_id: 12345,
        rating: { average: 4.5, count: 10 },
      });
    });

    it('should_return_empty_object_for_empty_payload', () => {
      expect(ReleaseDiscogsMapper.fromDiscogsCommunityRating({})).toEqual({});
    });

    it('should_return_empty_object_for_null_payload', () => {
      expect(ReleaseDiscogsMapper.fromDiscogsCommunityRating(null)).toEqual({});
    });

    it('should_return_empty_object_for_undefined_payload', () => {
      expect(
        ReleaseDiscogsMapper.fromDiscogsCommunityRating(undefined),
      ).toEqual({});
    });

    it('should_map_undefined_for_missing_nested_fields', () => {
      expect(
        ReleaseDiscogsMapper.fromDiscogsCommunityRating({ rating: {} }),
      ).toEqual({ rating: {} });
    });

    it('should_map_undefined_for_wrong_type_scalars', () => {
      const result = ReleaseDiscogsMapper.fromDiscogsCommunityRating({
        release_id: '12345',
        rating: { average: 'high', count: 'ten' },
      });

      expect(result).toEqual({ rating: {} });
    });
  });
});
