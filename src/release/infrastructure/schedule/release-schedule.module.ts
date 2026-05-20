import { Module } from '@nestjs/common';
import { ProcessReleasesScheduler } from './process-releases.scheduler';

@Module({
  providers: [ProcessReleasesScheduler],
  exports: [ProcessReleasesScheduler],
})
export class ReleaseScheduleModule {}
