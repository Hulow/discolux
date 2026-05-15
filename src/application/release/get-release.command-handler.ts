import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetReleaseCommand } from './get-release.command';
import {
  DISCOGS_CLIENT,
  DiscogsClient,
} from './ports/discogs-client.port';

export type GetReleaseResult = unknown;

@CommandHandler(GetReleaseCommand)
export class GetReleaseCommandHandler
  implements ICommandHandler<GetReleaseCommand, GetReleaseResult>
{
  constructor(
    @Inject(DISCOGS_CLIENT) private readonly discogsClient: DiscogsClient,
  ) {}

  execute(command: GetReleaseCommand): Promise<GetReleaseResult> {
    return this.discogsClient.getRelease(command.releaseId);
  }
}
