import { ConfigService } from '@nestjs/config';
import { ReleaseEntity } from '../domain/release.entity';
import type { ParsedDumpRelease } from './ports/release-dump-xml-streamer.port';
import type { ReleaseRepository } from './ports/release-repository.port';
import type { ReleaseDumpXmlStreamer } from './ports/release-dump-xml-streamer.port';
import { DumpReleaseCommand } from './dump-release.command';
import { DumpReleaseCommandHandler } from './dump-release.command-handler';

function electronicRow(
  releaseId: number,
  overrides: Partial<ParsedDumpRelease> = {},
): ParsedDumpRelease {
  return {
    releaseId,
    genres: ['Electronic'],
    styles: [],
    country: null,
    released: null,
    notes: null,
    labelName: null,
    labelCatNo: null,
    ...overrides,
  };
}

describe('DumpReleaseCommandHandler', () => {
  let upsertReleases: jest.Mock;
  let repository: ReleaseRepository;
  let streamedRows: ParsedDumpRelease[];
  let dumpXmlStreamer: ReleaseDumpXmlStreamer;
  let configService: ConfigService;
  let handler: DumpReleaseCommandHandler;

  beforeEach(() => {
    upsertReleases = jest.fn().mockResolvedValue(undefined);
    repository = { upsertReleases } as unknown as ReleaseRepository;
    streamedRows = [];

    dumpXmlStreamer = {
      streamFromPath: async (
        _path: string,
        onRelease: (row: ParsedDumpRelease) => void,
      ) => {
        for (const row of streamedRows) {
          onRelease(row);
        }
      },
    };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'DISCOGS_RELEASES_XML_PATH') {
          return '/tmp/releases.xml';
        }
        throw new Error(`Unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;

    handler = new DumpReleaseCommandHandler(
      repository,
      dumpXmlStreamer,
      configService,
    );
  });

  it('should_upsert_entity_when_streamed_genres_include_electronic', async () => {
    streamedRows = [
      electronicRow(1, {
        country: 'Sweden',
        released: '1990',
        styles: ['Deep House'],
      }),
    ];

    await handler.execute(new DumpReleaseCommand());

    expect(upsertReleases).toHaveBeenCalledTimes(1);
    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities).toHaveLength(1);
    expect(entities[0].releaseId).toBe(1);
    expect(entities[0].country).toBe('Sweden');
    expect(entities[0].released).toEqual(new Date('1990-01-01T00:00:00.000Z'));
    expect(entities[0].genres).toEqual(['Electronic']);
    expect(entities[0].styles).toEqual(['Deep House']);
  });

  it('should_parse_iso_released_date_when_streamed', async () => {
    streamedRows = [electronicRow(1, { released: '1900-03-01' })];

    await handler.execute(new DumpReleaseCommand());

    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities[0].released).toEqual(
      new Date('1900-03-01T00:00:00.000Z'),
    );
  });

  it('should_omit_released_when_streamed_value_is_unparseable', async () => {
    streamedRows = [electronicRow(1, { released: '1999-03-00' })];

    await handler.execute(new DumpReleaseCommand());

    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities[0].released).toBeUndefined();
  });

  it('should_upsert_entity_when_electronic_is_one_of_multiple_genres', async () => {
    streamedRows = [electronicRow(1, { genres: ['Electronic', 'Techno'] })];

    await handler.execute(new DumpReleaseCommand());

    expect(upsertReleases).toHaveBeenCalledTimes(1);
    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities[0].genres).toEqual(['Electronic', 'Techno']);
  });

  it('should_not_upsert_when_streamed_genres_do_not_include_electronic', async () => {
    streamedRows = [
      electronicRow(1, { genres: ['Rock'] }),
      electronicRow(2, { genres: ['Techno'] }),
      electronicRow(3, { genres: [] }),
    ];

    await handler.execute(new DumpReleaseCommand());

    expect(upsertReleases).not.toHaveBeenCalled();
  });

  it('should_flush_in_batches_of_5000', async () => {
    streamedRows = Array.from({ length: 5000 }, (_, i) =>
      electronicRow(i + 1),
    );

    await handler.execute(new DumpReleaseCommand());

    expect(upsertReleases).toHaveBeenCalledTimes(1);
    const [entities] = upsertReleases.mock.calls[0] as [ReleaseEntity[]];
    expect(entities).toHaveLength(5000);
  });

  it('should_flush_remainder_after_final_batch', async () => {
    streamedRows = Array.from({ length: 5001 }, (_, i) =>
      electronicRow(i + 1),
    );

    await handler.execute(new DumpReleaseCommand());

    expect(upsertReleases).toHaveBeenCalledTimes(2);
    expect(upsertReleases.mock.calls[0][0]).toHaveLength(5000);
    expect(upsertReleases.mock.calls[1][0]).toHaveLength(1);
  });
});
