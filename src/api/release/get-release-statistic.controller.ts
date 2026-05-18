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
import { GetReleaseStatisticQuery } from '../../application/release/get-release-statistic.query';
import { GetReleaseStatisticResult } from '../../application/release/get-release-statistic.query-handler';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class GetReleaseStatisticController {
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
  ): Promise<GetReleaseStatisticResult> {
    return this.queryBus.execute(new GetReleaseStatisticQuery(releaseId));
  }
}
