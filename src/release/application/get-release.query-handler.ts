import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReleaseQuery } from './get-release.query';
import {
  RELEASE_DISCOGS_CLIENT,
  ReleaseDiscogsClient,
} from './ports/release-discogs-client.port';

export type GetReleaseResult = unknown;

@QueryHandler(GetReleaseQuery)
export class GetReleaseQueryHandler
  implements IQueryHandler<GetReleaseQuery, GetReleaseResult>
{
  constructor(
    @Inject(RELEASE_DISCOGS_CLIENT)
    private readonly discogsClient: ReleaseDiscogsClient,
  ) {}

  execute(query: GetReleaseQuery): Promise<GetReleaseResult> {
    return this.discogsClient.getRelease(query.releaseId);
  }
}
