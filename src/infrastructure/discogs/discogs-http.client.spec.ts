import { ConfigService } from '@nestjs/config';
import { DiscogsHttpClient } from './discogs-http.client';

describe('DiscogsHttpClient', () => {
  const token = 'test-discogs-token';

  const createClient = () =>
    new DiscogsHttpClient({
      getOrThrow: (key: string) => {
        if (key === 'DISCOGS_TOKEN') {
          return token;
        }
        throw new Error(`Missing config: ${key}`);
      },
    } as ConfigService);

  it('should_append_token_query_param_when_getting_release', async () => {
    const client = createClient();
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: 12345 }),
      } as Response);

    await client.getRelease('12345');

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.discogs.com/releases/12345?token=${token}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.discogs.v2.discogs+json',
        }),
      }),
    );

    fetchMock.mockRestore();
  });

  it('should_append_token_query_param_when_getting_release_community_rating', async () => {
    const client = createClient();
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: async () => ({ rating: { average: 4.5, count: 10 } }),
      } as Response);

    await client.getReleaseCommunityRating('12345');

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.discogs.com/releases/12345/rating?token=${token}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.discogs.v2.discogs+json',
        }),
      }),
    );

    fetchMock.mockRestore();
  });
});
