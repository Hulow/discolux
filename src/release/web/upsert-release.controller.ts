import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpsertReleaseCommand } from '../application/upsert-release.command';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';
import { UpsertReleaseDto } from './upsert-release.dto';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class UpsertReleaseController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('upsert')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Upsert a release from XML dump fields into Mongo',
  })
  @ApiBody({ type: UpsertReleaseDto })
  @ApiNoContentResponse({
    description: 'Release upserted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async upsertRelease(@Body() dto: UpsertReleaseDto): Promise<void> {
    await this.commandBus.execute(
      new UpsertReleaseCommand(
        dto.id,
        dto.country,
        dto.released,
        dto.genres,
        dto.styles,
      ),
    );
  }
}
