import type { ReleaseDiscogsClient } from '../../application/ports/release-discogs-client.port';
import type {
  DiscogsReleaseCommunityRatingResponse,
  DiscogsReleaseResponse,
} from './mappers/release-discogs.mapper';

export class ReleaseDiscogsClientStub implements ReleaseDiscogsClient {
  private defaultRelease: DiscogsReleaseResponse | null = null;
  private releases = new Map<string, DiscogsReleaseResponse>();
  private failures = new Map<string, Error>();
  private rating: DiscogsReleaseCommunityRatingResponse | null = null;

  setRelease(release: DiscogsReleaseResponse): void;
  setRelease(releaseId: string, release: DiscogsReleaseResponse): void;
  setRelease(
    releaseOrId: DiscogsReleaseResponse | string,
    release?: DiscogsReleaseResponse,
  ): void {
    if (typeof releaseOrId === 'string' && release !== undefined) {
      this.releases.set(releaseOrId, release);
    } else if (release === undefined) {
      this.defaultRelease = releaseOrId as DiscogsReleaseResponse;
    }
  }

  failRelease(releaseId: string, error: Error): void {
    this.failures.set(releaseId, error);
  }

  setRating(rating: DiscogsReleaseCommunityRatingResponse): void {
    this.rating = rating;
  }

  getRelease(releaseId: string): Promise<DiscogsReleaseResponse> {
    const failure = this.failures.get(releaseId);

    if (failure) {
      return Promise.reject(failure);
    }

    const perId = this.releases.get(releaseId);

    if (perId !== undefined) {
      return Promise.resolve(perId);
    }

    return Promise.resolve(this.defaultRelease ?? {});
  }

  getReleaseCommunityRating(
    _releaseId: string,
  ): Promise<DiscogsReleaseCommunityRatingResponse> {
    return Promise.resolve(this.rating ?? {});
  }
}
