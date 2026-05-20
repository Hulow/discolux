import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProcessReleasesCommand } from './process-releases.command';

@CommandHandler(ProcessReleasesCommand)
export class ProcessReleasesCommandHandler
  implements ICommandHandler<ProcessReleasesCommand, void>
{
  async execute(_command: ProcessReleasesCommand): Promise<void> {
    console.log('now', new Date().toISOString());
  }
}
