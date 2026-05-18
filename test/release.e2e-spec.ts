import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { RELEASE_DISCOGS_CLIENT } from '../src/release/application/ports/release-discogs-client.port';
import { ReleaseEntity } from '../src/release/domain/release.entity';
import { AppModule } from '../src/app.module';

describe('Release (e2e)', () => {
  let app: INestApplication<App>;
  const apiKey = 'test-api-key';
  const discogsRating = { rating: { average: 4.5, count: 10 } };

  const releaseEntity = (releaseId: number) =>
    ReleaseEntity.from({
      id: `e2e-release-${releaseId}`,
      releaseId,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    });

  const releaseJson = (releaseId: number) => ({
    id: `e2e-release-${releaseId}`,
    releaseId,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  });

  beforeEach(async () => {
    process.env.API_KEY = apiKey;
    process.env.DISCOGS_TOKEN = 'test-discogs-token';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RELEASE_DISCOGS_CLIENT)
      .useValue({
        getRelease: (releaseId: string) =>
          Promise.resolve(releaseEntity(Number(releaseId))),
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

  it('GET /release?id= returns 401 without api key', () => {
    return request(app.getHttpServer())
      .get('/release')
      .query({ id: '12345' })
      .expect(401);
  });

  it('GET /release?id= returns 401 with invalid api key', () => {
    return request(app.getHttpServer())
      .get('/release')
      .query({ id: '12345' })
      .set('x-api-key', 'wrong-key')
      .expect(401);
  });

  it('GET /release?id= returns release entity with valid api key', () => {
    return request(app.getHttpServer())
      .get('/release')
      .query({ id: '12345' })
      .set('x-api-key', apiKey)
      .expect(200)
      .expect(releaseJson(12345));
  });

  it('GET /community/rating/release?releaseId= returns 401 without api key', () => {
    return request(app.getHttpServer())
      .get('/community/rating/release')
      .query({ releaseId: '12345' })
      .expect(401);
  });

  it('GET /community/rating/release?releaseId= returns 401 with invalid api key', () => {
    return request(app.getHttpServer())
      .get('/community/rating/release')
      .query({ releaseId: '12345' })
      .set('x-api-key', 'wrong-key')
      .expect(401);
  });

  it('GET /community/rating/release?releaseId= returns discogs rating with valid api key', () => {
    return request(app.getHttpServer())
      .get('/community/rating/release')
      .query({ releaseId: '12345' })
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
      .expect([releaseJson(1), releaseJson(2), releaseJson(3)]);
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
              : Promise.resolve(releaseEntity(Number(releaseId))),
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
          releaseJson(1),
          {
            releaseId: '2',
            errorMessage: 'Discogs API request failed: 404 Not Found',
          },
          releaseJson(3),
        ]);
    });
  });
});
