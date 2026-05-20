import { randomUUID } from 'crypto';
import { parseReleasedDate } from '../../../domain/parse-released-date';
import {
  ReleaseEntity,
  type ReleaseEntityProps,
} from '../../../domain/release.entity';
import type { DiscogsReleaseResponse } from './release-discogs.mapper';

export function discogsReleaseToEntityProps(
  dto: DiscogsReleaseResponse,
): ReleaseEntityProps {
  if (dto.id === undefined) {
    throw new Error('Discogs release id is required');
  }

  const now = new Date();

  return {
    id: randomUUID(),
    releaseId: dto.id,
    status: dto.status,
    year: dto.year,
    url: dto.uri ?? dto.resource_url,
    communityHave: dto.community?.have,
    communityWant: dto.community?.want,
    ratingCount: dto.community?.rating?.count,
    ratingAverage: dto.community?.rating?.average,
    addedAt: dto.date_added,
    changedAt: dto.date_changed,
    numberForSale: dto.num_for_sale,
    lowestPrice: dto.lowest_price,
    country: dto.country,
    released: parseReleasedDate(dto.released),
    notes: dto.notes,
    releaseFormatted: dto.released_formatted,
    genres: filterStrings(dto.genres),
    styles: filterStrings(dto.styles),
    blockedFromSale: dto.blocked_from_sale,
    createdAt: now,
    updatedAt: now,
  };
}

export function discogsReleaseToEntity(
  dto: DiscogsReleaseResponse,
): ReleaseEntity {
  return ReleaseEntity.from(discogsReleaseToEntityProps(dto));
}

function filterStrings(
  values: (string | undefined)[] | undefined,
): string[] | undefined {
  if (values === undefined) {
    return undefined;
  }

  return values.filter((value): value is string => value !== undefined);
}
