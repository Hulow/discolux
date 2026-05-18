import { MarketDiscogsMapper } from './market-discogs.mapper';

describe('MarketDiscogsMapper', () => {
  const fullListingPayload = {
    id: 98765,
    resource_url: 'https://api.discogs.com/marketplace/listings/98765',
    uri: 'https://www.discogs.com/sell/item/98765',
    status: 'For Sale',
    condition: 'Near Mint (NM or M-)',
    sleeve_condition: 'Very Good Plus (VG+)',
    comments: 'Great copy',
    ships_from: 'United States',
    posted: '2024-01-01T00:00:00',
    allow_offers: true,
    offer_submitted: false,
    audio: false,
    price: { value: 12.5, currency: 'USD' },
    original_price: {
      curr_abbr: 'USD',
      curr_id: 1,
      formatted: '$12.50',
      value: 12.5,
      converted: { value: 12.5, currency: 'USD' },
    },
    shipping_price: { USD: 5 },
    original_shipping_price: { USD: 5, EUR: 4.5 },
    seller: {
      id: 100,
      username: 'seller1',
      avatar_url: 'https://example.com/avatar.jpg',
      stats: { rating: '99.5', stars: 5, total: 200 },
      min_order_total: 10,
      html_url: 'https://www.discogs.com/user/seller1',
      uid: 1000,
      url: 'https://api.discogs.com/users/seller1',
      payment: 'PayPal',
      shipping: 'USPS',
      resource_url: 'https://api.discogs.com/users/seller1',
    },
    release: {
      thumbnail: 'https://example.com/thumb.jpg',
      description: 'Album description',
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
      artist: 'Artist',
      format: 'Vinyl, LP',
      resource_url: 'https://api.discogs.com/releases/12345',
      title: 'Test Release',
      year: 1984,
      id: 12345,
      label: 'Label',
      catalog_number: 'CAT-1',
      stats: {
        community: {
          in_wantlist: 50,
          in_collection: 100,
        },
      },
    },
    shipping_is_blocked: false,
  };

  describe('fromDiscogsMarketplaceListing', () => {
    it('should_map_full_payload', () => {
      const result =
        MarketDiscogsMapper.fromDiscogsMarketplaceListing(fullListingPayload);

      expect(result).toEqual(fullListingPayload);
    });

    it('should_return_empty_object_for_empty_payload', () => {
      expect(MarketDiscogsMapper.fromDiscogsMarketplaceListing({})).toEqual({});
    });

    it('should_return_empty_object_for_null_payload', () => {
      expect(MarketDiscogsMapper.fromDiscogsMarketplaceListing(null)).toEqual(
        {},
      );
    });

    it('should_return_empty_object_for_undefined_payload', () => {
      expect(
        MarketDiscogsMapper.fromDiscogsMarketplaceListing(undefined),
      ).toEqual({});
    });

    it('should_map_undefined_for_missing_nested_fields', () => {
      const result = MarketDiscogsMapper.fromDiscogsMarketplaceListing({
        id: 1,
        price: {},
        seller: {},
        release: { stats: { community: {} } },
      });

      expect(result).toEqual({
        id: 1,
        price: {},
        seller: {},
        release: { stats: { community: {} } },
      });
    });

    it('should_map_undefined_for_wrong_type_scalars', () => {
      const result = MarketDiscogsMapper.fromDiscogsMarketplaceListing({
        id: 'not-a-number',
        allow_offers: 'yes',
        price: { value: 'twelve', currency: 1 },
        seller: { id: 'seller', stats: { stars: 'five', total: null } },
        shipping_price: 'flat',
        original_shipping_price: ['USD'],
      });

      expect(result).toEqual({
        price: {},
        seller: { stats: {} },
      });
    });

    it('should_map_undefined_for_non_object_array_items', () => {
      const result = MarketDiscogsMapper.fromDiscogsMarketplaceListing({
        release: {
          images: ['not-an-image', { uri: 'https://example.com/image.jpg' }],
        },
      });

      expect(result).toEqual({
        release: {
          images: [undefined, { uri: 'https://example.com/image.jpg' }],
        },
      });
    });
  });

  describe('fromDiscogsReleaseMarketplaceStats', () => {
    it('should_map_full_payload', () => {
      const result = MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats({
        num_for_sale: 3,
        lowest_price: { value: 10, currency: 'USD' },
        blocked_from_sale: false,
      });

      expect(result).toEqual({
        num_for_sale: 3,
        lowest_price: { value: 10, currency: 'USD' },
        blocked_from_sale: false,
      });
    });

    it('should_return_empty_object_for_empty_payload', () => {
      expect(
        MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats({}),
      ).toEqual({});
    });

    it('should_return_empty_object_for_null_payload', () => {
      expect(
        MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats(null),
      ).toEqual({});
    });

    it('should_return_empty_object_for_undefined_payload', () => {
      expect(
        MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats(undefined),
      ).toEqual({});
    });

    it('should_map_undefined_for_missing_nested_fields', () => {
      expect(
        MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats({
          lowest_price: {},
        }),
      ).toEqual({ lowest_price: {} });
    });

    it('should_map_undefined_for_wrong_type_scalars', () => {
      const result = MarketDiscogsMapper.fromDiscogsReleaseMarketplaceStats({
        num_for_sale: 'three',
        lowest_price: { value: 'ten', currency: 1 },
        blocked_from_sale: 'no',
      });

      expect(result).toEqual({ lowest_price: {} });
    });
  });
});
