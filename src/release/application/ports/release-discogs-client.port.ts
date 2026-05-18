export const RELEASE_DISCOGS_CLIENT = Symbol('RELEASE_DISCOGS_CLIENT');

export interface ReleaseDiscogsClient {
  getRelease(releaseId: string): Promise<unknown>;
  getReleaseCommunityRating(releaseId: string): Promise<unknown>;
}
