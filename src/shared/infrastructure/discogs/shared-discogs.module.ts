import { Module } from '@nestjs/common';
import { DiscogsHttpClient } from './discogs-http.client';

@Module({
  providers: [DiscogsHttpClient],
  exports: [DiscogsHttpClient],
})
export class SharedDiscogsModule {}
