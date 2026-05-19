import {
  parseCliOptions,
  toUpsertBody,
  upsertRelease,
} from './read-discogs-releases';

describe('parseCliOptions', () => {
  const originalApiKey = process.env.API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalApiKey;
    }
  });

  it('parses api-url and api-key flags', () => {
    expect(
      parseCliOptions([
        '--file',
        'test/fixtures/releases-sample.xml',
        '--api-url',
        'http://localhost:3000',
        '--api-key',
        'secret',
      ]),
    ).toEqual({
      file: 'test/fixtures/releases-sample.xml',
      apiUrl: 'http://localhost:3000',
      apiKey: 'secret',
    });
  });

  it('defaults api-key from env when api-url is set', () => {
    process.env.API_KEY = 'from-env';

    expect(parseCliOptions(['--api-url', 'http://localhost:3000'])).toEqual({
      file: 'data/discogs_20260501_releases.xml',
      apiUrl: 'http://localhost:3000',
      apiKey: 'from-env',
    });
  });

  it('throws when api-url is set without api key', () => {
    delete process.env.API_KEY;

    expect(() => parseCliOptions(['--api-url', 'http://localhost:3000'])).toThrow(
      'Option "--api-key", env API_KEY, or API_KEY in .env is required when --api-url is set',
    );
  });
});

describe('toUpsertBody', () => {
  it('omits title and includes dump fields', () => {
    expect(
      toUpsertBody({
        id: 1,
        title: 'Stockholm',
        country: 'Sweden',
        released: '1999-03-00',
        genres: ['Electronic'],
        styles: ['Deep House'],
      }),
    ).toEqual({
      id: 1,
      country: 'Sweden',
      released: '1999-03-00',
      genres: ['Electronic'],
      styles: ['Deep House'],
    });
  });
});

describe('upsertRelease', () => {
  it('posts to release upsert with api key and body without title', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 204 });

    await upsertRelease(
      'http://localhost:3000/',
      'test-api-key',
      {
        id: 1,
        title: 'Stockholm',
        country: 'Sweden',
        released: '1999-03-00',
        genres: ['Electronic'],
        styles: ['Deep House'],
      },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/release/upsert',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          id: 1,
          country: 'Sweden',
          released: '1999-03-00',
          genres: ['Electronic'],
          styles: ['Deep House'],
        }),
      },
    );
  });
});
