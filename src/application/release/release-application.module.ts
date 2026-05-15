import { Module } from '@nestjs/common';
import { DiscogsModule } from '../../infrastructure/discogs/discogs.module';
import { GetReleaseCommandHandler } from './get-release.command-handler';

@Module({
  imports: [DiscogsModule],
  providers: [GetReleaseCommandHandler],
})
export class ReleaseApplicationModule {}
