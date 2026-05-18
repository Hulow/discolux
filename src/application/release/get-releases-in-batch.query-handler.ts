import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleasesInBatchQuery } from './get-releases-in-batch.query';
import { DISCOGS_CLIENT, DiscogsClient } from './ports/discogs-client.port';

export type BatchReleaseError = {
  releaseId: string;
  errorMessage: string;
};

export type GetReleasesInBatchResult = (unknown | BatchReleaseError)[];

@QueryHandler(GetReleasesInBatchQuery)
export class GetReleasesInBatchQueryHandler
  implements IQueryHandler<GetReleasesInBatchQuery, GetReleasesInBatchResult>
{
  constructor(
    @Inject(DISCOGS_CLIENT) private readonly discogsClient: DiscogsClient,
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

  private fetchRelease(releaseId: string): Promise<unknown | BatchReleaseError> {
    return this.discogsClient.getRelease(releaseId).catch((error: unknown) => ({
      releaseId,
      errorMessage: error instanceof Error ? error.message : String(error),
    }));
  }
}
