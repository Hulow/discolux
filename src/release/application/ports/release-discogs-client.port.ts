import type {
  DiscogsReleaseCommunityRatingResponse,
  DiscogsReleaseResponse,
} from '../../infrastructure/discogs/mappers/release-discogs.mapper';

export const RELEASE_DISCOGS_CLIENT = Symbol('RELEASE_DISCOGS_CLIENT');

export interface ReleaseDiscogsClient {
  getRelease(releaseId: string): Promise<DiscogsReleaseResponse>;
  getReleaseCommunityRating(
    releaseId: string,
  ): Promise<DiscogsReleaseCommunityRatingResponse>;
}
