import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Release (e2e)', () => {
  let app: INestApplication<App>;
  const apiKey = 'test-api-key';

  beforeEach(async () => {
    process.env.API_KEY = apiKey;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.API_KEY;
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

  it('GET /release/:id returns release id with valid api key', () => {
    return request(app.getHttpServer())
      .get('/release/12345')
      .set('x-api-key', apiKey)
      .expect(200)
      .expect({ releaseId: '12345' });
  });
});
