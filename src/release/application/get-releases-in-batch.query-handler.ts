import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReleaseEntity } from '../domain/release.entity';
import { GetReleasesInBatchQuery } from './get-releases-in-batch.query';
import {
  RELEASE_DISCOGS_CLIENT,
  ReleaseDiscogsClient,
} from './ports/release-discogs-client.port';

export type BatchReleaseError = {
  releaseId: string;
  errorMessage: string;
};

export type GetReleasesInBatchResult = (
  | ReleaseEntity
  | BatchReleaseError
)[];

@QueryHandler(GetReleasesInBatchQuery)
export class GetReleasesInBatchQueryHandler
  implements IQueryHandler<GetReleasesInBatchQuery, GetReleasesInBatchResult>
{
  constructor(
    @Inject(RELEASE_DISCOGS_CLIENT)
    private readonly discogsClient: ReleaseDiscogsClient,
  ) {}

  execute(query: GetReleasesInBatchQuery): Promise<GetReleasesInBatchResult> {
    const from = Number(query.from);
    const till = Number(query.till);
    const ids: string[] = [];

    for (let id = from; id <= till; id++) {
      ids.push(String(id));
    }

    return Promise.all(ids.map((id) => this.fetchRelease(id)));
  }

  private fetchRelease(
    releaseId: string,
  ): Promise<ReleaseEntity | BatchReleaseError> {
    return this.discogsClient.getRelease(releaseId).catch((error: unknown) => ({
      releaseId,
      errorMessage: error instanceof Error ? error.message : String(error),
    }));
  }
}
