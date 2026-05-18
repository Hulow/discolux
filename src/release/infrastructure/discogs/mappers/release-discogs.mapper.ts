export interface DiscogsReleaseRating {
  count?: number;
  average?: number;
}

export interface DiscogsReleaseCommunityRatingResponse {
  release_id?: number;
  rating?: DiscogsReleaseRating;
}

export interface DiscogsReleaseUser {
  username?: string;
  resource_url?: string;
}

export interface DiscogsReleaseArtist {
  name?: string;
  anv?: string;
  join?: string;
  role?: string;
  tracks?: string;
  id?: number;
  resource_url?: string;
  thumbnail_url?: string;
}

export interface DiscogsReleaseLabel {
  name?: string;
  catno?: string;
  entity_type?: string;
  entity_type_name?: string;
  id?: number;
  resource_url?: string;
  thumbnail_url?: string;
}

export interface DiscogsReleaseCompany {
  name?: string;
  catno?: string;
  entity_type?: string;
  entity_type_name?: string;
  id?: number;
  resource_url?: string;
  thumbnail_url?: string;
}

export interface DiscogsReleaseSeries {
  name?: string;
  catno?: string;
  entity_type?: string;
  entity_type_name?: string;
  id?: number;
  resource_url?: string;
}

export interface DiscogsReleaseFormat {
  name?: string;
  qty?: string;
  descriptions?: (string | undefined)[];
}

export interface DiscogsReleaseCommunity {
  have?: number;
  want?: number;
  rating?: DiscogsReleaseRating;
  submitter?: DiscogsReleaseUser;
  contributors?: (DiscogsReleaseUser | undefined)[];
  data_quality?: string;
  status?: string;
}

export interface DiscogsReleaseIdentifier {
  type?: string;
  value?: string;
  description?: string;
}

export interface DiscogsReleaseVideo {
  uri?: string;
  title?: string;
  description?: string;
  duration?: number;
  embed?: boolean;
}

export interface DiscogsReleaseTrack {
  position?: string;
  type_?: string;
  title?: string;
  duration?: string;
}

export interface DiscogsReleaseImage {
  type?: string;
  uri?: string;
  resource_url?: string;
  uri150?: string;
  width?: number;
  height?: number;
}

export interface DiscogsReleaseResponse {
  id?: number;
  status?: string;
  year?: number;
  resource_url?: string;
  uri?: string;
  artists?: (DiscogsReleaseArtist | undefined)[];
  artists_sort?: string;
  labels?: (DiscogsReleaseLabel | undefined)[];
  series?: (DiscogsReleaseSeries | undefined)[];
  companies?: (DiscogsReleaseCompany | undefined)[];
  formats?: (DiscogsReleaseFormat | undefined)[];
  data_quality?: string;
  community?: DiscogsReleaseCommunity;
  format_quantity?: number;
  date_added?: string;
  date_changed?: string;
  num_for_sale?: number;
  lowest_price?: number;
  master_id?: number;
  master_url?: string;
  title?: string;
  country?: string;
  released?: string;
  notes?: string;
  released_formatted?: string;
  identifiers?: (DiscogsReleaseIdentifier | undefined)[];
  videos?: (DiscogsReleaseVideo | undefined)[];
  genres?: (string | undefined)[];
  styles?: (string | undefined)[];
  tracklist?: (DiscogsReleaseTrack | undefined)[];
  extraartists?: (DiscogsReleaseArtist | undefined)[];
  images?: (DiscogsReleaseImage | undefined)[];
  thumb?: string;
  estimated_weight?: number;
  blocked_from_sale?: boolean;
  is_offensive?: boolean;
}

export class ReleaseDiscogsMapper {
  static fromDiscogsRelease(payload: unknown): DiscogsReleaseResponse {
    const source = asRecord(payload);

    return {
      id: optionalNumber(source?.id),
      status: optionalString(source?.status),
      year: optionalNumber(source?.year),
      resource_url: optionalString(source?.resource_url),
      uri: optionalString(source?.uri),
      artists: optionalArray(source?.artists, mapArtist),
      artists_sort: optionalString(source?.artists_sort),
      labels: optionalArray(source?.labels, mapLabel),
      series: optionalArray(source?.series, mapSeries),
      companies: optionalArray(source?.companies, mapCompany),
      formats: optionalArray(source?.formats, mapFormat),
      data_quality: optionalString(source?.data_quality),
      community: mapCommunity(source?.community),
      format_quantity: optionalNumber(source?.format_quantity),
      date_added: optionalString(source?.date_added),
      date_changed: optionalString(source?.date_changed),
      num_for_sale: optionalNumber(source?.num_for_sale),
      lowest_price: optionalNumber(source?.lowest_price),
      master_id: optionalNumber(source?.master_id),
      master_url: optionalString(source?.master_url),
      title: optionalString(source?.title),
      country: optionalString(source?.country),
      released: optionalString(source?.released),
      notes: optionalString(source?.notes),
      released_formatted: optionalString(source?.released_formatted),
      identifiers: optionalArray(source?.identifiers, mapIdentifier),
      videos: optionalArray(source?.videos, mapVideo),
      genres: optionalArray(source?.genres, optionalString),
      styles: optionalArray(source?.styles, optionalString),
      tracklist: optionalArray(source?.tracklist, mapTrack),
      extraartists: optionalArray(source?.extraartists, mapArtist),
      images: optionalArray(source?.images, mapImage),
      thumb: optionalString(source?.thumb),
      estimated_weight: optionalNumber(source?.estimated_weight),
      blocked_from_sale: optionalBoolean(source?.blocked_from_sale),
      is_offensive: optionalBoolean(source?.is_offensive),
    };
  }

  static fromDiscogsCommunityRating(
    payload: unknown,
  ): DiscogsReleaseCommunityRatingResponse {
    const source = asRecord(payload);

    return {
      release_id: optionalNumber(source?.release_id),
      rating: mapRating(source?.rating),
    };
  }
}

function mapRating(value: unknown): DiscogsReleaseRating | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    count: optionalNumber(source.count),
    average: optionalNumber(source.average),
  };
}

function mapUser(value: unknown): DiscogsReleaseUser | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    username: optionalString(source.username),
    resource_url: optionalString(source.resource_url),
  };
}

function mapArtist(value: unknown): DiscogsReleaseArtist | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    name: optionalString(source.name),
    anv: optionalString(source.anv),
    join: optionalString(source.join),
    role: optionalString(source.role),
    tracks: optionalString(source.tracks),
    id: optionalNumber(source.id),
    resource_url: optionalString(source.resource_url),
    thumbnail_url: optionalString(source.thumbnail_url),
  };
}

function mapLabel(value: unknown): DiscogsReleaseLabel | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    name: optionalString(source.name),
    catno: optionalString(source.catno),
    entity_type: optionalString(source.entity_type),
    entity_type_name: optionalString(source.entity_type_name),
    id: optionalNumber(source.id),
    resource_url: optionalString(source.resource_url),
    thumbnail_url: optionalString(source.thumbnail_url),
  };
}

function mapCompany(value: unknown): DiscogsReleaseCompany | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    name: optionalString(source.name),
    catno: optionalString(source.catno),
    entity_type: optionalString(source.entity_type),
    entity_type_name: optionalString(source.entity_type_name),
    id: optionalNumber(source.id),
    resource_url: optionalString(source.resource_url),
    thumbnail_url: optionalString(source.thumbnail_url),
  };
}

function mapSeries(value: unknown): DiscogsReleaseSeries | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    name: optionalString(source.name),
    catno: optionalString(source.catno),
    entity_type: optionalString(source.entity_type),
    entity_type_name: optionalString(source.entity_type_name),
    id: optionalNumber(source.id),
    resource_url: optionalString(source.resource_url),
  };
}

function mapFormat(value: unknown): DiscogsReleaseFormat | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    name: optionalString(source.name),
    qty: optionalString(source.qty),
    descriptions: optionalArray(source.descriptions, optionalString),
  };
}

function mapCommunity(value: unknown): DiscogsReleaseCommunity | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    have: optionalNumber(source.have),
    want: optionalNumber(source.want),
    rating: mapRating(source.rating),
    submitter: mapUser(source.submitter),
    contributors: optionalArray(source.contributors, mapUser),
    data_quality: optionalString(source.data_quality),
    status: optionalString(source.status),
  };
}

function mapIdentifier(value: unknown): DiscogsReleaseIdentifier | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    type: optionalString(source.type),
    value: optionalString(source.value),
    description: optionalString(source.description),
  };
}

function mapVideo(value: unknown): DiscogsReleaseVideo | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    uri: optionalString(source.uri),
    title: optionalString(source.title),
    description: optionalString(source.description),
    duration: optionalNumber(source.duration),
    embed: optionalBoolean(source.embed),
  };
}

function mapTrack(value: unknown): DiscogsReleaseTrack | undefined {
  const source = asRecord(value);

  if (!source) {
    return undefined;
  }

  return {
    position: optionalString(source.position),
    type_: optionalString(source.type_),
    title: optionalString(source.title),
    duration: optionalString(source.duration),
  };
}

function mapImage(value: unknown): DiscogsReleaseImage | undefined {
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

function optionalArray<T>(
  value: unknown,
  mapItem: (item: unknown) => T | undefined,
): (T | undefined)[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((item) => mapItem(item));
}
