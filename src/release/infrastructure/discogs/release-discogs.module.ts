import { Module } from '@nestjs/common';
import { SharedDiscogsModule } from '../../../shared/infrastructure/discogs/shared-discogs.module';
import { RELEASE_DISCOGS_CLIENT } from '../../application/ports/release-discogs-client.port';
import { ReleaseDiscogsClient } from './release-discogs.client';

@Module({
  imports: [SharedDiscogsModule],
  providers: [
    {
      provide: RELEASE_DISCOGS_CLIENT,
      useClass: ReleaseDiscogsClient,
    },
  ],
  exports: [RELEASE_DISCOGS_CLIENT],
})
export class ReleaseDiscogsModule {}
