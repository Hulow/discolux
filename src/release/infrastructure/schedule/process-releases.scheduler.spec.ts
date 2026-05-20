import { CommandBus } from '@nestjs/cqrs';
import { ProcessReleasesCommand } from '../../application/process-releases.command';
import { ProcessReleasesScheduler } from './process-releases.scheduler';

describe('ProcessReleasesScheduler', () => {
  let execute: jest.Mock;
  let commandBus: CommandBus;
  let scheduler: ProcessReleasesScheduler;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue(undefined);
    commandBus = { execute } as unknown as CommandBus;
    scheduler = new ProcessReleasesScheduler(commandBus);
  });

  it('should_not_execute_command_when_not_started', async () => {
    await scheduler.tick();

    expect(execute).not.toHaveBeenCalled();
  });

  it('should_execute_command_once_when_started', async () => {
    scheduler.start();

    await scheduler.tick();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(expect.any(ProcessReleasesCommand));
  });
});
