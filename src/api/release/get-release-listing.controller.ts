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
import { GetReleaseListingQuery } from '../../application/release/get-release-listing.query';
import { GetReleaseListingResult } from '../../application/release/get-release-listing.query-handler';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release/listing')
@UseGuards(ApiKeyGuard)
export class GetReleaseListingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':listingId')
  @ApiOperation({ summary: 'Get a Discogs marketplace listing by ID' })
  @ApiParam({
    name: 'listingId',
    description: 'Discogs marketplace listing ID',
    example: '98765',
  })
  @ApiOkResponse({
    description: 'Discogs marketplace listing JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getReleaseListing(
    @Param('listingId') listingId: string,
  ): Promise<GetReleaseListingResult> {
    return this.queryBus.execute(new GetReleaseListingQuery(listingId));
  }
}
