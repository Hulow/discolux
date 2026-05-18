import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { RELEASE_DISCOGS_CLIENT } from '../src/release/application/ports/release-discogs-client.port';
import { AppModule } from '../src/app.module';

describe('Release (e2e)', () => {
  let app: INestApplication<App>;
  const apiKey = 'test-api-key';
  const discogsRelease = { id: 12345, title: 'Test Release' };
  const discogsRating = { rating: { average: 4.5, count: 10 } };

  beforeEach(async () => {
    process.env.API_KEY = apiKey;
    process.env.DISCOGS_TOKEN = 'test-discogs-token';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RELEASE_DISCOGS_CLIENT)
      .useValue({
        getRelease: (releaseId: string) =>
          Promise.resolve({
            id: Number(releaseId),
            title: 'Test Release',
          }),
        getReleaseCommunityRating: () => Promise.resolve(discogsRating),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.API_KEY;
    delete process.env.DISCOGS_TOKEN;
  });

  it('GET /release/:id returns 401 without api key', () => {
    return request(app.getHttpServer()).get('/release/12345').expect(401);
  });

  it('GET /release/:id returns 401 with invalid api key', () => {
    return request(app.getHttpServer())
      .get('/release/12345')
      .set('x-api-key', 'wrong-key')
      .expect(401);
  });

  it('GET /release/:id returns discogs release with valid api key', () => {
    return request(app.getHttpServer())
      .get('/release/12345')
      .set('x-api-key', apiKey)
      .expect(200)
      .expect(discogsRelease);
  });

  it('GET /community/rating/release/:releaseId returns 401 without api key', () => {
    return request(app.getHttpServer())
      .get('/community/rating/release/12345')
      .expect(401);
  });

  it('GET /community/rating/release/:releaseId returns 401 with invalid api key', () => {
    return request(app.getHttpServer())
      .get('/community/rating/release/12345')
      .set('x-api-key', 'wrong-key')
      .expect(401);
  });

  it('GET /community/rating/release/:releaseId returns discogs rating with valid api key', () => {
    return request(app.getHttpServer())
      .get('/community/rating/release/12345')
      .set('x-api-key', apiKey)
      .expect(200)
      .expect(discogsRating);
  });

  it('GET /release/batch returns 401 without api key', () => {
    return request(app.getHttpServer())
      .get('/release/batch')
      .query({ from: '1', till: '3' })
      .expect(401);
  });

  it('GET /release/batch returns releases in ascending id order with valid api key', () => {
    return request(app.getHttpServer())
      .get('/release/batch')
      .query({ from: '1', till: '3' })
      .set('x-api-key', apiKey)
      .expect(200)
      .expect([
        { id: 1, title: 'Test Release' },
        { id: 2, title: 'Test Release' },
        { id: 3, title: 'Test Release' },
      ]);
  });

  it('GET /release/batch returns 400 when from is greater than till', () => {
    return request(app.getHttpServer())
      .get('/release/batch')
      .query({ from: '61', till: '1' })
      .set('x-api-key', apiKey)
      .expect(400);
  });

  it('GET /release/batch returns 400 when range size exceeds 60', () => {
    return request(app.getHttpServer())
      .get('/release/batch')
      .query({ from: '1', till: '61' })
      .set('x-api-key', apiKey)
      .expect(400);
  });

  describe('when a release id fails upstream', () => {
    const discogsNotFoundError = new Error(
      'Discogs API request failed: 404 Not Found',
    );

    beforeEach(async () => {
      await app.close();

      process.env.API_KEY = apiKey;
      process.env.DISCOGS_TOKEN = 'test-discogs-token';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(RELEASE_DISCOGS_CLIENT)
        .useValue({
          getRelease: (releaseId: string) =>
            releaseId === '2'
              ? Promise.reject(discogsNotFoundError)
              : Promise.resolve({
                  id: Number(releaseId),
                  title: 'Test Release',
                }),
          getReleaseCommunityRating: () => Promise.resolve(discogsRating),
        })
        .compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('GET /release/batch returns 200 with error object for failed id', () => {
      return request(app.getHttpServer())
        .get('/release/batch')
        .query({ from: '1', till: '3' })
        .set('x-api-key', apiKey)
        .expect(200)
        .expect([
          { id: 1, title: 'Test Release' },
          {
            releaseId: '2',
            errorMessage: 'Discogs API request failed: 404 Not Found',
          },
          { id: 3, title: 'Test Release' },
        ]);
    });
  });
});
