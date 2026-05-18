import type { ReleaseEntity } from '../../domain/release.entity';
import type { ReleaseDiscogsClient } from '../../application/ports/release-discogs-client.port';
import type {
  DiscogsReleaseCommunityRatingResponse,
  DiscogsReleaseResponse,
} from './mappers/release-discogs.mapper';
import { discogsReleaseToEntity } from './mappers/release-entity.mapper';

export class ReleaseDiscogsClientStub implements ReleaseDiscogsClient {
  private defaultRelease: DiscogsReleaseResponse | null = null;
  private defaultEntity: ReleaseEntity | null = null;
  private releases = new Map<string, DiscogsReleaseResponse>();
  private entities = new Map<string, ReleaseEntity>();
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

  setReleaseEntity(entity: ReleaseEntity): void;
  setReleaseEntity(releaseId: string, entity: ReleaseEntity): void;
  setReleaseEntity(
    entityOrId: ReleaseEntity | string,
    entity?: ReleaseEntity,
  ): void {
    if (typeof entityOrId === 'string' && entity !== undefined) {
      this.entities.set(entityOrId, entity);
    } else if (entity === undefined) {
      this.defaultEntity = entityOrId as ReleaseEntity;
    }
  }

  failRelease(releaseId: string, error: Error): void {
    this.failures.set(releaseId, error);
  }

  setRating(rating: DiscogsReleaseCommunityRatingResponse): void {
    this.rating = rating;
  }

  getRelease(releaseId: string): Promise<ReleaseEntity> {
    const failure = this.failures.get(releaseId);

    if (failure) {
      return Promise.reject(failure);
    }

    const perIdEntity = this.entities.get(releaseId);

    if (perIdEntity !== undefined) {
      return Promise.resolve(perIdEntity);
    }

    const perIdRelease = this.releases.get(releaseId);

    if (perIdRelease !== undefined) {
      return Promise.resolve(discogsReleaseToEntity(perIdRelease));
    }

    if (this.defaultEntity !== null) {
      return Promise.resolve(this.defaultEntity);
    }

    return Promise.resolve(discogsReleaseToEntity(this.defaultRelease ?? {}));
  }

  getReleaseCommunityRating(
    _releaseId: string,
  ): Promise<DiscogsReleaseCommunityRatingResponse> {
    return Promise.resolve(this.rating ?? {});
  }
}
