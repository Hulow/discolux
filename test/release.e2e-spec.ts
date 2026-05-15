import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DISCOGS_CLIENT } from '../src/application/release/ports/discogs-client.port';
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
      .overrideProvider(DISCOGS_CLIENT)
      .useValue({
        getRelease: () => Promise.resolve(discogsRelease),
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
});
