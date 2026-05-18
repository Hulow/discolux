import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { MarketApplicationModule } from '../application/market-application.module';
import { GetListingController } from './get-listing.controller';
import { GetStatisticController } from './get-statistic.controller';

@Module({
  imports: [MarketApplicationModule],
  controllers: [GetStatisticController, GetListingController],
  providers: [ApiKeyGuard],
})
export class MarketWebModule {}
