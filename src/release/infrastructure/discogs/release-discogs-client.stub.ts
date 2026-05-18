import type { ReleaseDiscogsClient } from '../../application/ports/release-discogs-client.port';

export class ReleaseDiscogsClientStub implements ReleaseDiscogsClient {
  private defaultRelease: unknown = null;
  private releases = new Map<string, unknown>();
  private failures = new Map<string, Error>();
  private rating: unknown = null;

  setRelease(release: unknown): void;
  setRelease(releaseId: string, release: unknown): void;
  setRelease(releaseOrId: unknown, release?: unknown): void {
    if (release !== undefined) {
      this.releases.set(releaseOrId as string, release);
    } else {
      this.defaultRelease = releaseOrId;
    }
  }

  failRelease(releaseId: string, error: Error): void {
    this.failures.set(releaseId, error);
  }

  setRating(rating: unknown): void {
    this.rating = rating;
  }

  getRelease(releaseId: string): Promise<unknown> {
    const failure = this.failures.get(releaseId);

    if (failure) {
      return Promise.reject(failure);
    }

    const perId = this.releases.get(releaseId);

    if (perId !== undefined) {
      return Promise.resolve(perId);
    }

    return Promise.resolve(this.defaultRelease);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.rating);
  }
}
