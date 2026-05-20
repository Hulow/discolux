import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProcessReleasesScheduler } from '../infrastructure/schedule/process-releases.scheduler';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class ScheduleReleasesController {
  constructor(private readonly scheduler: ProcessReleasesScheduler) {}

  @Post('schedule-releases')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Start the scheduled release processing workflow',
  })
  @ApiNoContentResponse({
    description: 'Scheduler started successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  scheduleReleases(): void {
    this.scheduler.start();
  }
}
