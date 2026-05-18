import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetReleaseCommand } from './get-release.command';
import {
  RELEASE_DISCOGS_CLIENT,
  ReleaseDiscogsClient,
} from './ports/release-discogs-client.port';

export type GetReleaseResult = unknown;

@CommandHandler(GetReleaseCommand)
export class GetReleaseCommandHandler
  implements ICommandHandler<GetReleaseCommand, GetReleaseResult>
{
  constructor(
    @Inject(RELEASE_DISCOGS_CLIENT)
    private readonly discogsClient: ReleaseDiscogsClient,
  ) {}

  execute(command: GetReleaseCommand): Promise<GetReleaseResult> {
    return this.discogsClient.getRelease(command.releaseId);
  }
}
