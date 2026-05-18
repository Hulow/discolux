import { GetReleaseCommand } from './get-release.command';
import { GetReleaseCommandHandler } from './get-release.command-handler';
import { DiscogsClient } from './ports/discogs-client.port';

class DiscogsClientStub implements DiscogsClient {
  private release: unknown = null;

  setRelease(release: unknown): void {
    this.release = release;
  }

  getRelease(_releaseId: string): Promise<unknown> {
    return Promise.resolve(this.release);
  }

  getReleaseCommunityRating(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getMarketplaceListing(_listingId: string): Promise<unknown> {
    return Promise.resolve(null);
  }

  getReleaseMarketplaceStats(_releaseId: string): Promise<unknown> {
    return Promise.resolve(null);
  }
}

describe('GetReleaseCommandHandler', () => {
  const discogsClient = new DiscogsClientStub();
  const handler = new GetReleaseCommandHandler(discogsClient);

  it('should_return_discogs_release_when_command_executed', async () => {
    const release = { id: 12345, title: 'Test Release' };
    discogsClient.setRelease(release);

    const result = await handler.execute(new GetReleaseCommand('12345'));

    expect(result).toEqual(release);
  });
});
