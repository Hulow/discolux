import { Module } from '@nestjs/common';
import { ReleaseApplicationModule } from '../../application/release/release-application.module';
import { GetReleaseController } from './get-release.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [ReleaseApplicationModule],
  controllers: [GetReleaseController],
  providers: [ApiKeyGuard],
})
export class GetReleaseModule {}
