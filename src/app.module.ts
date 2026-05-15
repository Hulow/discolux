import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { HealthModule } from './api/health/health.module';
import { GetReleaseModule } from './api/release/get-release.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    HealthModule,
    GetReleaseModule,
  ],
})
export class AppModule {}
