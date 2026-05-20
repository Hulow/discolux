import { ProcessReleasesCommand } from './process-releases.command';
import { ProcessReleasesCommandHandler } from './process-releases.command-handler';

describe('ProcessReleasesCommandHandler', () => {
  const handler = new ProcessReleasesCommandHandler();

  it('should_resolve_without_throwing', async () => {
    await expect(handler.execute(new ProcessReleasesCommand())).resolves.toBeUndefined();
  });
});
