import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetReleaseCommunityRatingQuery } from '../../application/release/get-release-community-rating.query';
import { GetReleaseCommunityRatingResult } from '../../application/release/get-release-community-rating.query-handler';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('community/rating/release')
@UseGuards(ApiKeyGuard)
export class GetReleaseCommunityRatingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':releaseId')
  @ApiOperation({ summary: 'Get Discogs community rating for a release' })
  @ApiParam({
    name: 'releaseId',
    description: 'Discogs release ID',
    example: '12345',
  })
  @ApiOkResponse({
    description: 'Discogs release community rating JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getReleaseCommunityRating(
    @Param('releaseId') releaseId: string,
  ): Promise<GetReleaseCommunityRatingResult> {
    return this.queryBus.execute(
      new GetReleaseCommunityRatingQuery(releaseId),
    );
  }
}
