export const DISCOGS_CLIENT = Symbol('DISCOGS_CLIENT');

export interface DiscogsClient {
  getRelease(releaseId: string): Promise<unknown>;
  getReleaseCommunityRating(releaseId: string): Promise<unknown>;
  getMarketplaceListing(listingId: string): Promise<unknown>;
}
