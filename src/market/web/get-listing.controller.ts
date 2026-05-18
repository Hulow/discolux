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
import { GetListingQuery } from '../application/get-listing.query';
import { GetListingResult } from '../application/get-listing.query-handler';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

@ApiTags('market')
@ApiSecurity('x-api-key')
@Controller('release/listing')
@UseGuards(ApiKeyGuard)
export class GetListingController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOperation({ summary: 'Get a Discogs marketplace listing by ID' })
  @ApiQuery({
    name: 'listingId',
    description: 'Discogs marketplace listing ID',
    example: '98765',
    required: true,
  })
  @ApiOkResponse({
    description: 'Discogs marketplace listing JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getReleaseListing(
    @Query('listingId') listingId: string,
  ): Promise<GetListingResult> {
    return this.queryBus.execute(new GetListingQuery(listingId));
  }
}
