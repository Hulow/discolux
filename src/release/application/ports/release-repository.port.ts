import type { ReleaseEntity } from '../../domain/release.entity';

export const RELEASE_REPOSITORY = Symbol('RELEASE_REPOSITORY');

export interface ReleaseRepository {
  addReleases(releases: ReleaseEntity[]): Promise<void>;
}
