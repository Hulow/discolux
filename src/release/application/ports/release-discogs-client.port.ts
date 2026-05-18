import type { ReleaseEntity } from '../../domain/release.entity';
import type { DiscogsReleaseCommunityRatingResponse } from '../../infrastructure/discogs/mappers/release-discogs.mapper';

export const RELEASE_DISCOGS_CLIENT = Symbol('RELEASE_DISCOGS_CLIENT');

export interface ReleaseDiscogsClient {
  getRelease(releaseId: string): Promise<ReleaseEntity>;
  getReleaseCommunityRating(
    releaseId: string,
  ): Promise<DiscogsReleaseCommunityRatingResponse>;
}
