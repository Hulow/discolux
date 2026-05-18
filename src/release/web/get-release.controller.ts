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
import { GetReleaseQuery } from '../application/get-release.query';
import { GetReleaseResult } from '../application/get-release.query-handler';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class GetReleaseController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get a Discogs release by ID' })
  @ApiQuery({
    name: 'id',
    description: 'Discogs release ID',
    example: '12345',
    required: true,
  })
  @ApiOkResponse({
    description: 'Discogs release JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getRelease(@Query('id') id: string): Promise<GetReleaseResult> {
    return this.queryBus.execute(new GetReleaseQuery(id));
  }
}
