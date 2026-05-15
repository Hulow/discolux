import { GetReleaseCommand } from './get-release.command';
import { GetReleaseCommandHandler } from './get-release.command-handler';

describe('GetReleaseCommandHandler', () => {
  const handler = new GetReleaseCommandHandler();

  it('should_return_release_id_when_command_executed', async () => {
    const result = await handler.execute(new GetReleaseCommand('12345'));

    expect(result).toEqual({ releaseId: '12345' });
  });
});
