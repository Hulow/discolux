import { Module } from '@nestjs/common';
import { GetReleaseCommandHandler } from './get-release.command-handler';

@Module({
  providers: [GetReleaseCommandHandler],
})
export class ReleaseApplicationModule {}
