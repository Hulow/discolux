import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseStatisticQuery } from './get-release-statistic.query';
import {
  MARKET_DISCOGS_CLIENT,
  MarketDiscogsClient,
} from './ports/market-discogs-client.port';

export type GetReleaseStatisticResult = unknown;

@QueryHandler(GetReleaseStatisticQuery)
export class GetReleaseStatisticQueryHandler
  implements IQueryHandler<GetReleaseStatisticQuery, GetReleaseStatisticResult>
{
  constructor(
    @Inject(MARKET_DISCOGS_CLIENT)
    private readonly discogsClient: MarketDiscogsClient,
  ) {}

  execute(
    query: GetReleaseStatisticQuery,
  ): Promise<GetReleaseStatisticResult> {
    return this.discogsClient.getReleaseMarketplaceStats(query.releaseId);
  }
}
