import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseListingQuery } from './get-release-listing.query';
import { DISCOGS_CLIENT, DiscogsClient } from './ports/discogs-client.port';

export type GetReleaseListingResult = unknown;

@QueryHandler(GetReleaseListingQuery)
export class GetReleaseListingQueryHandler
  implements IQueryHandler<GetReleaseListingQuery, GetReleaseListingResult>
{
  constructor(
    @Inject(DISCOGS_CLIENT) private readonly discogsClient: DiscogsClient,
  ) {}

  execute(query: GetReleaseListingQuery): Promise<GetReleaseListingResult> {
    return this.discogsClient.getMarketplaceListing(query.listingId);
  }
}
