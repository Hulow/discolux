import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetReleaseCommand } from '../../application/release/get-release.command';
import { GetReleaseResult } from '../../application/release/get-release.command-handler';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class GetReleaseController {
  constructor(private readonly commandBus: CommandBus) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a Discogs release by ID' })
  @ApiParam({
    name: 'id',
    description: 'Discogs release ID',
    example: '12345',
  })
  @ApiOkResponse({
    description: 'Discogs release JSON payload',
    schema: { type: 'object', additionalProperties: true },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getRelease(@Param('id') id: string): Promise<GetReleaseResult> {
    return this.commandBus.execute(new GetReleaseCommand(id));
  }
}
