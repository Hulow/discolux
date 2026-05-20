import {
  parseDumpReleasesCliOptions,
  postReleaseDump,
} from './dump-releases';

describe('dump-releases', () => {
  describe('parseDumpReleasesCliOptions', () => {
    it('reads flags from argv', () => {
      expect(
        parseDumpReleasesCliOptions(
          ['--api-url', 'http://localhost:3000/', '--api-key', 'secret'],
          {},
        ),
      ).toEqual({
        apiUrl: 'http://localhost:3000',
        apiKey: 'secret',
      });
    });

    it('falls back to env when flags are omitted', () => {
      expect(
        parseDumpReleasesCliOptions([], {
          API_URL: 'http://api.example',
          API_KEY: 'from-env',
        }),
      ).toEqual({
        apiUrl: 'http://api.example',
        apiKey: 'from-env',
      });
    });

    it('throws when api url is missing', () => {
      expect(() => parseDumpReleasesCliOptions([], {})).toThrow(
        'Missing --api-url or API_URL',
      );
    });

    it('throws when api key is missing', () => {
      expect(() =>
        parseDumpReleasesCliOptions(['--api-url', 'http://localhost:3000'], {}),
      ).toThrow('Missing --api-key or API_KEY');
    });
  });

  describe('postReleaseDump', () => {
    it('POSTs /release/dump with x-api-key and no body', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });

      await postReleaseDump(
        { apiUrl: 'http://localhost:3000', apiKey: 'test-key' },
        fetchFn,
      );

      expect(fetchFn).toHaveBeenCalledWith('http://localhost:3000/release/dump', {
        method: 'POST',
        headers: { 'x-api-key': 'test-key' },
      });
    });

    it('throws when response is not ok', async () => {
      const fetchFn = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        postReleaseDump(
          { apiUrl: 'http://localhost:3000', apiKey: 'bad' },
          fetchFn,
        ),
      ).rejects.toThrow('POST http://localhost:3000/release/dump failed: 401 Unauthorized');
    });
  });
});
