import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseStatisticQuery } from './get-release-statistic.query';
import { DISCOGS_CLIENT, DiscogsClient } from './ports/discogs-client.port';

export type GetReleaseStatisticResult = unknown;

@QueryHandler(GetReleaseStatisticQuery)
export class GetReleaseStatisticQueryHandler
  implements IQueryHandler<GetReleaseStatisticQuery, GetReleaseStatisticResult>
{
  constructor(
    @Inject(DISCOGS_CLIENT) private readonly discogsClient: DiscogsClient,
  ) {}

  execute(
    query: GetReleaseStatisticQuery,
  ): Promise<GetReleaseStatisticResult> {
    return this.discogsClient.getReleaseMarketplaceStats(query.releaseId);
  }
}
