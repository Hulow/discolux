import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetStatisticQuery } from './get-statistic.query';
import type { DiscogsReleaseMarketplaceStatsResponse } from '../infrastructure/discogs/mappers/market-discogs.mapper';
import {
  MARKET_DISCOGS_CLIENT,
  MarketDiscogsClient,
} from './ports/market-discogs-client.port';

export type GetStatisticResult = DiscogsReleaseMarketplaceStatsResponse;

@QueryHandler(GetStatisticQuery)
export class GetStatisticQueryHandler
  implements IQueryHandler<GetStatisticQuery, GetStatisticResult>
{
  constructor(
    @Inject(MARKET_DISCOGS_CLIENT)
    private readonly discogsClient: MarketDiscogsClient,
  ) {}

  execute(query: GetStatisticQuery): Promise<GetStatisticResult> {
    return this.discogsClient.getReleaseMarketplaceStats(query.releaseId);
  }
}
