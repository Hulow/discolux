import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseCommunityRatingQuery } from './get-release-community-rating.query';
import {
  DISCOGS_CLIENT,
  DiscogsClient,
} from './ports/discogs-client.port';

export type GetReleaseCommunityRatingResult = unknown;

@QueryHandler(GetReleaseCommunityRatingQuery)
export class GetReleaseCommunityRatingQueryHandler
  implements
    IQueryHandler<
      GetReleaseCommunityRatingQuery,
      GetReleaseCommunityRatingResult
    >
{
  constructor(
    @Inject(DISCOGS_CLIENT) private readonly discogsClient: DiscogsClient,
  ) {}

  execute(
    query: GetReleaseCommunityRatingQuery,
  ): Promise<GetReleaseCommunityRatingResult> {
    return this.discogsClient.getReleaseCommunityRating(query.releaseId);
  }
}
