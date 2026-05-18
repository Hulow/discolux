import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { MarketApplicationModule } from '../application/market-application.module';
import { GetReleaseListingController } from './get-release-listing.controller';
import { GetReleaseStatisticController } from './get-release-statistic.controller';

@Module({
  imports: [MarketApplicationModule],
  controllers: [GetReleaseStatisticController, GetReleaseListingController],
  providers: [ApiKeyGuard],
})
export class MarketWebModule {}
