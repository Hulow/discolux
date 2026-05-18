import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { MarketWebModule } from './market/web/market-web.module';
import { ReleaseWebModule } from './release/web/release-web.module';
import { SharedMongoModule } from './shared/infrastructure/mongo/shared-mongo.module';
import { HealthModule } from './shared/web/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    SharedMongoModule,
    HealthModule,
    MarketWebModule,
    ReleaseWebModule,
  ],
})
export class AppModule {}
