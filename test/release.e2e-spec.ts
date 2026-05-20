import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { join } from 'path';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { RELEASE_DISCOGS_CLIENT } from '../src/release/application/ports/release-discogs-client.port';
import { ReleaseEntity } from '../src/release/domain/release.entity';
import { Release } from '../src/release/infrastructure/mongo/release.schema';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

describe('Release (e2e)', () => {
  let app: INestApplication<App>;
  let releaseModel: Model<Release>;
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
    configureApp(app);
    await app.init();
    releaseModel = moduleFixture.get(getModelToken(Release.name));
    await releaseModel.deleteMany({});
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

  it('POST /release/batch returns 401 without api key', () => {
    return request(app.getHttpServer())
      .post('/release/batch')
      .query({ from: '1', till: '3' })
      .expect(401);
  });

  it('POST /release/schedule-releases returns 401 without api key', () => {
    return request(app.getHttpServer())
      .post('/release/schedule-releases')
      .expect(401);
  });

  it('POST /release/schedule-releases returns 204 with valid api key', () => {
    return request(app.getHttpServer())
      .post('/release/schedule-releases')
      .set('x-api-key', apiKey)
      .expect(204);
  });

  it('POST /release/batch returns 400 when from is greater than till', () => {
    return request(app.getHttpServer())
      .post('/release/batch')
      .query({ from: '61', till: '1' })
      .set('x-api-key', apiKey)
      .expect(400);
  });

  it('POST /release/batch returns 400 when range size exceeds 60', () => {
    return request(app.getHttpServer())
      .post('/release/batch')
      .query({ from: '1', till: '61' })
      .set('x-api-key', apiKey)
      .expect(400);
  });

  describe('POST /release/dump', () => {
    const releasesFixturePath = join(
      __dirname,
      'fixtures/releases-sample.xml',
    );

    beforeEach(() => {
      process.env.DISCOGS_RELEASES_XML_PATH = releasesFixturePath;
    });

    afterEach(() => {
      delete process.env.DISCOGS_RELEASES_XML_PATH;
    });

    it('returns 401 without api key', () => {
      return request(app.getHttpServer())
        .post('/release/dump')
        .expect(401);
    });

    it('upserts electronic-only rows from fixture and returns 204', async () => {
      await request(app.getHttpServer())
        .post('/release/dump')
        .set('x-api-key', apiKey)
        .expect(204);

      const doc = await releaseModel.findOne({ releaseId: 1 }).lean();

      expect(doc).toMatchObject({
        releaseId: 1,
        country: 'Sweden',
        released: '1999-03-00',
        genres: ['Electronic'],
        styles: ['Deep House'],
      });
      expect(doc?._id).toEqual(expect.any(String));
      expect(doc?.createdAt).toEqual(expect.any(Date));
      expect(doc?.updatedAt).toEqual(expect.any(Date));
    });

    it('does not write skipped fixture releases', async () => {
      await request(app.getHttpServer())
        .post('/release/dump')
        .set('x-api-key', apiKey)
        .expect(204);

      const skipped = await releaseModel
        .find({ releaseId: { $in: [2, 3] } })
        .lean();

      expect(skipped).toHaveLength(0);
    });
  });

  it('POST /release/batch upserts releases into mongo and returns 204', async () => {
    await request(app.getHttpServer())
      .post('/release/batch')
      .query({ from: '1', till: '3' })
      .set('x-api-key', apiKey)
      .expect(204);

    const docs = await releaseModel
      .find({ releaseId: { $in: [1, 2, 3] } })
      .sort({ releaseId: 1 })
      .lean();

    expect(docs).toHaveLength(3);
    expect(docs.map((doc) => doc.releaseId)).toEqual([1, 2, 3]);
    expect(docs[0]).toMatchObject({
      _id: 'e2e-release-1',
      releaseId: 1,
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    expect(docs[1]).toMatchObject({
      _id: 'e2e-release-2',
      releaseId: 2,
    });
    expect(docs[2]).toMatchObject({
      _id: 'e2e-release-3',
      releaseId: 3,
    });
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
      configureApp(app);
      await app.init();
      releaseModel = moduleFixture.get(getModelToken(Release.name));
      await releaseModel.deleteMany({});
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

    it('POST /release/batch upserts stub for failed id and returns 204', async () => {
      await request(app.getHttpServer())
        .post('/release/batch')
        .query({ from: '1', till: '3' })
        .set('x-api-key', apiKey)
        .expect(204);

      const docs = await releaseModel
        .find({ releaseId: { $in: [1, 2, 3] } })
        .sort({ releaseId: 1 })
        .lean();

      expect(docs).toHaveLength(3);
      expect(docs[0]).toMatchObject({
        _id: 'e2e-release-1',
        releaseId: 1,
      });
      expect(docs[0].status).toBeUndefined();
      expect(docs[1].releaseId).toBe(2);
      expect(docs[1].status).toBeUndefined();
      expect(docs[1].year).toBeUndefined();
      expect(docs[2]).toMatchObject({
        _id: 'e2e-release-3',
        releaseId: 3,
      });
      expect(docs[2].status).toBeUndefined();
    });
  });
});
