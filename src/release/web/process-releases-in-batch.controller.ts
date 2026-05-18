import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProcessReleasesInBatchCommand } from '../application/process-releases-in-batch.command';
import { ApiKeyGuard } from '../../shared/web/guards/api-key.guard';

const MAX_BATCH_SIZE = 60;

function parseReleaseId(value: string | undefined, param: string): number {
  if (value === undefined || value === '') {
    throw new BadRequestException(`Query parameter "${param}" is required`);
  }

  const id = Number(value);

  if (!Number.isInteger(id)) {
    throw new BadRequestException(
      `Query parameter "${param}" must be an integer release ID`,
    );
  }

  return id;
}

function validateBatchRange(from: string | undefined, till: string | undefined): void {
  const fromId = parseReleaseId(from, 'from');
  const tillId = parseReleaseId(till, 'till');

  if (fromId > tillId) {
    throw new BadRequestException(
      'Query parameter "from" must be less than or equal to "till"',
    );
  }

  const count = tillId - fromId + 1;

  if (count > MAX_BATCH_SIZE) {
    throw new BadRequestException(
      `Batch range must contain at most ${MAX_BATCH_SIZE} release IDs`,
    );
  }
}

@ApiTags('release')
@ApiSecurity('x-api-key')
@Controller('release')
@UseGuards(ApiKeyGuard)
export class ProcessReleasesInBatchController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('batch')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Fetch Discogs releases for an inclusive ID range and upsert into Mongo',
  })
  @ApiQuery({
    name: 'from',
    description: 'First Discogs release ID (inclusive)',
    example: '1',
    required: true,
  })
  @ApiQuery({
    name: 'till',
    description: 'Last Discogs release ID (inclusive)',
    example: '60',
    required: true,
  })
  @ApiNoContentResponse({
    description: 'Releases processed and upserted successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  async processReleasesInBatch(
    @Query('from') from: string,
    @Query('till') till: string,
  ): Promise<void> {
    validateBatchRange(from, till);

    await this.commandBus.execute(new ProcessReleasesInBatchCommand(from, till));
  }
}
