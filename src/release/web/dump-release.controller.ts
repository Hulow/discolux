import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DumpReleaseCommand } from '../application/dump-release.command';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class DumpReleaseController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('dump')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Dump releases from Discogs XML file'
  })
  @ApiNoContentResponse({
    description: 'Dump ingest completed successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  async dumpReleases(): Promise<void> {
    await this.commandBus.execute(new DumpReleaseCommand());
  }
}
