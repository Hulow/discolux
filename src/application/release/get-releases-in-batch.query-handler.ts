import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleasesInBatchQuery } from './get-releases-in-batch.query';
import { DISCOGS_CLIENT, DiscogsClient } from './ports/discogs-client.port';

export type GetReleasesInBatchResult = unknown[];

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

    return Promise.all(ids.map((id) => this.discogsClient.getRelease(id)));
  }
}
