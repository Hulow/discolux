export interface DiscogsListingPrice {
  value?: number;
  currency?: string;
}

export interface DiscogsListingOriginalPrice {
  curr_abbr?: string;
  curr_id?: number;
  formatted?: string;
  value?: number;
  converted?: DiscogsListingPrice;
}

export interface DiscogsListingSellerStats {
  rating?: string;
  stars?: number;
  total?: number;
}

export interface DiscogsListingSeller {
  id?: number;
  username?: string;
  avatar_url?: string;
  stats?: DiscogsListingSellerStats;
  min_order_total?: number;
  html_url?: string;
  uid?: number;
  url?: string;
  payment?: string;
  shipping?: string;
  resource_url?: string;
}

export interface DiscogsListingImage {
  type?: string;
  uri?: string;
  resource_url?: string;
  uri150?: string;
  width?: number;
  height?: number;
}

export interface DiscogsListingReleaseCommunityStats {
  in_wantlist?: number;
  in_collection?: number;
}

export interface DiscogsListingReleaseStats {
  community?: DiscogsListingReleaseCommunityStats;
}

export interface DiscogsListingRelease {
  thumbnail?: string;
  description?: string;
  images?: (DiscogsListingImage | undefined)[];
  artist?: string;
  format?: string;
  resource_url?: string;
  title?: string;
  year?: number;
  id?: number;
  label?: string;
  catalog_number?: string;
  stats?: DiscogsListingReleaseStats;
}

export interface DiscogsMarketplaceListingResponse {
  id?: number;
  resource_url?: string;
  uri?: string;
  status?: string;
  condition?: string;
  sleeve_condition?: string;
  comments?: string;
  ships_from?: string;
  posted?: string;
  allow_offers?: boolean;
  offer_submitted?: boolean;
  audio?: boolean;
  price?: DiscogsListingPrice;
  original_price?: DiscogsListingOriginalPrice;
  shipping_price?: Record<string, unknown>;
  original_shipping_price?: Record<string, unknown>;
  seller?: DiscogsListingSeller;
  release?: DiscogsListingRelease;
  shipping_is_blocked?: boolean;
}

export interface DiscogsReleaseMarketplaceStatsResponse {
  num_for_sale?: number;
  lowest_price?: DiscogsListingPrice;
  blocked_from_sale?: boolean;
}

export class MarketDiscogsMapper {
  static fromDiscogsMarketplaceListing(
    payload: unknown,
  ): DiscogsMarketplaceListingResponse {
    const source = asRecord(payload);

    return {
      id: optionalNumber(source?.id),
      resource_url: optionalString(source?.resource_url),
      uri: optionalString(source?.uri),
      status: optionalString(source?.status),
      condition: optionalString(source?.condition),
      sleeve_condition: optionalString(source?.sleeve_condition),
      comments: optionalString(source?.comments),
      ships_from: optionalString(source?.ships_from),
      posted: optionalString(source?.posted),
      allow_offers: optionalBoolean(source?.allow_offers),
      offer_submitted: optionalBoolean(source?.offer_submitted),
      audio: optionalBoolean(source?.audio),
      price: mapPrice(source?.price),
      original_price: mapOriginalPrice(source?.original_price),
      shipping_price: optionalRecord(source?.shipping_price),
      original_shipping_price: optionalRecord(source?.original_shipping_price),
      seller: mapSeller(source?.seller),
      release: mapListingRelease(source?.release),
      shipping_is_blocked: optionalBoolean(source?.shipping_is_blocked),
    };
  }

  static fromDiscogsReleaseMarketplaceStats(
    payload: unknown,
  ): DiscogsReleaseMarketplaceStatsResponse {
    const source = asRecord(payload);

    return {
      num_for_sale: optionalNumber(source?.num_for_sale),
      lowest_price: mapPrice(source?.lowest_price),
      blocked_from_sale: optionalBoolean(source?.blocked_from_sale),
    };
  }
}

function mapPrice(value: unknown): DiscogsListingPrice | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    value: optionalNumber(source.value),
    currency: optionalString(source.currency),
  };
}

function mapOriginalPrice(
  value: unknown,
): DiscogsListingOriginalPrice | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    curr_abbr: optionalString(source.curr_abbr),
    curr_id: optionalNumber(source.curr_id),
    formatted: optionalString(source.formatted),
    value: optionalNumber(source.value),
    converted: mapPrice(source.converted),
  };
}

function mapSellerStats(
  value: unknown,
): DiscogsListingSellerStats | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    rating: optionalString(source.rating),
    stars: optionalNumber(source.stars),
    total: optionalNumber(source.total),
  };
}

function mapSeller(value: unknown): DiscogsListingSeller | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    id: optionalNumber(source.id),
    username: optionalString(source.username),
    avatar_url: optionalString(source.avatar_url),
    stats: mapSellerStats(source.stats),
    min_order_total: optionalNumber(source.min_order_total),
    html_url: optionalString(source.html_url),
    uid: optionalNumber(source.uid),
    url: optionalString(source.url),
    payment: optionalString(source.payment),
    shipping: optionalString(source.shipping),
    resource_url: optionalString(source.resource_url),
  };
}

function mapImage(value: unknown): DiscogsListingImage | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    type: optionalString(source.type),
    uri: optionalString(source.uri),
    resource_url: optionalString(source.resource_url),
    uri150: optionalString(source.uri150),
    width: optionalNumber(source.width),
    height: optionalNumber(source.height),
  };
}

function mapReleaseCommunityStats(
  value: unknown,
): DiscogsListingReleaseCommunityStats | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    in_wantlist: optionalNumber(source.in_wantlist),
    in_collection: optionalNumber(source.in_collection),
  };
}

function mapReleaseStats(
  value: unknown,
): DiscogsListingReleaseStats | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    community: mapReleaseCommunityStats(source.community),
  };
}

function mapListingRelease(
  value: unknown,
): DiscogsListingRelease | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    thumbnail: optionalString(source.thumbnail),
    description: optionalString(source.description),
    images: optionalArray(source.images, mapImage),
    artist: optionalString(source.artist),
    format: optionalString(source.format),
    resource_url: optionalString(source.resource_url),
    title: optionalString(source.title),
    year: optionalNumber(source.year),
    id: optionalNumber(source.id),
    label: optionalString(source.label),
    catalog_number: optionalString(source.catalog_number),
    stats: mapReleaseStats(source.stats),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return asRecord(value);
}

function optionalArray<T>(
  value: unknown,
  mapItem: (item: unknown) => T | undefined,
): (T | undefined)[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => mapItem(item));
}
