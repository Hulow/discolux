import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseListingQuery } from './get-release-listing.query';
import {
  MARKET_DISCOGS_CLIENT,
  MarketDiscogsClient,
} from './ports/market-discogs-client.port';

export type GetReleaseListingResult = unknown;

@QueryHandler(GetReleaseListingQuery)
export class GetReleaseListingQueryHandler
  implements IQueryHandler<GetReleaseListingQuery, GetReleaseListingResult>
{
  constructor(
    @Inject(MARKET_DISCOGS_CLIENT)
    private readonly discogsClient: MarketDiscogsClient,
  ) {}

  execute(query: GetReleaseListingQuery): Promise<GetReleaseListingResult> {
    return this.discogsClient.getMarketplaceListing(query.listingId);
  }
}
