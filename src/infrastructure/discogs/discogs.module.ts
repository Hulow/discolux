import { Module } from '@nestjs/common';
import { DISCOGS_CLIENT } from '../../application/release/ports/discogs-client.port';
import { DiscogsHttpClient } from './discogs-http.client';

@Module({
  providers: [
    {
      provide: DISCOGS_CLIENT,
      useClass: DiscogsHttpClient,
    },
  ],
  exports: [DISCOGS_CLIENT],
})
export class DiscogsModule {}
