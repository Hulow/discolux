import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseCommunityRatingQuery } from './get-release-community-rating.query';
import {
  RELEASE_DISCOGS_CLIENT,
  ReleaseDiscogsClient,
} from './ports/release-discogs-client.port';

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
    @Inject(RELEASE_DISCOGS_CLIENT)
    private readonly discogsClient: ReleaseDiscogsClient,
  ) {}

  execute(
    query: GetReleaseCommunityRatingQuery,
  ): Promise<GetReleaseCommunityRatingResult> {
    return this.discogsClient.getReleaseCommunityRating(query.releaseId);
  }
}
