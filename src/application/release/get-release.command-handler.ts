import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetReleaseCommand } from './get-release.command';

export type GetReleaseResult = {
  releaseId: string;
};

@CommandHandler(GetReleaseCommand)
export class GetReleaseCommandHandler
  implements ICommandHandler<GetReleaseCommand, GetReleaseResult>
{
  execute(command: GetReleaseCommand): Promise<GetReleaseResult> {
    return Promise.resolve({ releaseId: command.releaseId });
  }
}
