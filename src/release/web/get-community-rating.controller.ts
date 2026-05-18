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
import { GetCommunityRatingQuery } from '../application/get-community-rating.query';
import { GetCommunityRatingResult } from '../application/get-community-rating.query-handler';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('community/rating/release')
@UseGuards(ApiKeyGuard)
export class GetCommunityRatingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get Discogs community rating for a release' })
  @ApiQuery({
    name: 'releaseId',
    description: 'Discogs release ID',
    example: '12345',
    required: true,
  })
  @ApiOkResponse({
    description: 'Discogs release community rating JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getReleaseCommunityRating(
    @Query('releaseId') releaseId: string,
  ): Promise<GetCommunityRatingResult> {
    return this.queryBus.execute(new GetCommunityRatingQuery(releaseId));
  }
}
