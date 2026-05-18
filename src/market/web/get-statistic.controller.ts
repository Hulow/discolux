import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetStatisticQuery } from '../application/get-statistic.query';
import { GetStatisticResult } from '../application/get-statistic.query-handler';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

@ApiTags('market')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class GetStatisticController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('statistic')
  @ApiOperation({
    summary: 'Get Discogs marketplace statistics for a release',
  })
  @ApiQuery({
    name: 'releaseId',
    description: 'Discogs release ID',
    example: '12345',
    required: true,
  })
  @ApiOkResponse({
    description: 'Discogs marketplace statistics JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getReleaseStatistic(
    @Query('releaseId') releaseId: string,
  ): Promise<GetStatisticResult> {
    return this.queryBus.execute(new GetStatisticQuery(releaseId));
  }
}
