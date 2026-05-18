import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetListingQuery } from './get-listing.query';
import {
  MARKET_DISCOGS_CLIENT,
  MarketDiscogsClient,
} from './ports/market-discogs-client.port';

export type GetListingResult = unknown;

@QueryHandler(GetListingQuery)
export class GetListingQueryHandler
  implements IQueryHandler<GetListingQuery, GetListingResult>
{
  constructor(
    @Inject(MARKET_DISCOGS_CLIENT)
    private readonly discogsClient: MarketDiscogsClient,
  ) {}

  execute(query: GetListingQuery): Promise<GetListingResult> {
    return this.discogsClient.getMarketplaceListing(query.listingId);
  }
}
