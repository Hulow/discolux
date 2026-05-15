import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { GetReleaseCommand } from '../../application/release/get-release.command';
import { GetReleaseResult } from '../../application/release/get-release.command-handler';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller('release')
@UseGuards(ApiKeyGuard)
export class GetReleaseController {
  constructor(private readonly commandBus: CommandBus) {}

  @Get(':id')
  getRelease(@Param('id') id: string): Promise<GetReleaseResult> {
    return this.commandBus.execute(new GetReleaseCommand(id));
  }
}
