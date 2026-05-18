import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCommunityRatingQuery } from './get-community-rating.query';
import type { DiscogsReleaseCommunityRatingResponse } from '../infrastructure/discogs/mappers/release-discogs.mapper';
import {
  RELEASE_DISCOGS_CLIENT,
  ReleaseDiscogsClient,
} from './ports/release-discogs-client.port';

export type GetCommunityRatingResult = DiscogsReleaseCommunityRatingResponse;

@QueryHandler(GetCommunityRatingQuery)
export class GetCommunityRatingQueryHandler
  implements IQueryHandler<GetCommunityRatingQuery, GetCommunityRatingResult>
{
  constructor(
    @Inject(RELEASE_DISCOGS_CLIENT)
    private readonly discogsClient: ReleaseDiscogsClient,
  ) {}

  execute(
    query: GetCommunityRatingQuery,
  ): Promise<GetCommunityRatingResult> {
    return this.discogsClient.getReleaseCommunityRating(query.releaseId);
  }
}
