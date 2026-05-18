import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { MARKET_DISCOGS_CLIENT } from '../src/market/application/ports/market-discogs-client.port';
import { AppModule } from '../src/app.module';

describe('Market (e2e)', () => {
  let app: INestApplication<App>;
  const apiKey = 'test-api-key';
  const discogsListing = { id: 98765, price: { value: 12.5, currency: 'USD' } };
  const discogsStats = {
    lowest_price: { value: 10, currency: 'USD' },
    num_for_sale: 3,
    blocked_from_sale: false,
  };

  beforeEach(async () => {
    process.env.API_KEY = apiKey;
    process.env.DISCOGS_TOKEN = 'test-discogs-token';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MARKET_DISCOGS_CLIENT)
      .useValue({
        getMarketplaceListing: () => Promise.resolve(discogsListing),
        getReleaseMarketplaceStats: () => Promise.resolve(discogsStats),
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

  it('GET /release/listing?listingId= returns 401 without api key', () => {
    return request(app.getHttpServer())
      .get('/release/listing')
      .query({ listingId: '98765' })
      .expect(401);
  });

  it('GET /release/listing?listingId= returns 401 with invalid api key', () => {
    return request(app.getHttpServer())
      .get('/release/listing')
      .query({ listingId: '98765' })
      .set('x-api-key', 'wrong-key')
      .expect(401);
  });

  it('GET /release/listing?listingId= returns discogs listing with valid api key', () => {
    return request(app.getHttpServer())
      .get('/release/listing')
      .query({ listingId: '98765' })
      .set('x-api-key', apiKey)
      .expect(200)
      .expect(discogsListing);
  });

  it('GET /release/statistic returns 401 without api key', () => {
    return request(app.getHttpServer())
      .get('/release/statistic')
      .query({ releaseId: '12345' })
      .expect(401);
  });

  it('GET /release/statistic returns 401 with invalid api key', () => {
    return request(app.getHttpServer())
      .get('/release/statistic')
      .query({ releaseId: '12345' })
      .set('x-api-key', 'wrong-key')
      .expect(401);
  });

  it('GET /release/statistic returns discogs marketplace stats with valid api key', () => {
    return request(app.getHttpServer())
      .get('/release/statistic')
      .query({ releaseId: '12345' })
      .set('x-api-key', apiKey)
      .expect(200)
      .expect(discogsStats);
  });
});
