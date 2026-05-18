import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetReleasesInBatchQuery } from '../application/get-releases-in-batch.query';
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
export class GetReleasesInBatchController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('batch')
  @ApiOperation({ summary: 'Get Discogs releases for an inclusive ID range' })
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
  @ApiOkResponse({
    description:
      'Array in ascending ID order: Discogs release JSON on success, or { releaseId, errorMessage } when upstream fetch failed',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'object', additionalProperties: true },
          {
            type: 'object',
            required: ['releaseId', 'errorMessage'],
            properties: {
              releaseId: { type: 'string', example: '2' },
              errorMessage: {
                type: 'string',
                example: 'Discogs API request failed: 404 Not Found',
              },
            },
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-api-key' })
  getReleasesInBatch(
    @Query('from') from: string,
    @Query('till') till: string,
  ): Promise<unknown[]> {
    validateBatchRange(from, till);

    return this.queryBus.execute(new GetReleasesInBatchQuery(from, till));
  }
}
