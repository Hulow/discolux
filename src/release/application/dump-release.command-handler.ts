import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReleaseEntity } from '../domain/release.entity';
import { DumpReleaseCommand } from './dump-release.command';
import type { ParsedDumpRelease } from './ports/release-dump-xml-streamer.port';
import {
  RELEASE_DUMP_XML_STREAMER,
  ReleaseDumpXmlStreamer,
} from './ports/release-dump-xml-streamer.port';
import {
  RELEASE_REPOSITORY,
  ReleaseRepository,
} from './ports/release-repository.port';

const DUMP_BATCH_SIZE = 5000;
const DISCOGS_RELEASES_XML_PATH = 'DISCOGS_RELEASES_XML_PATH';

function isElectronicGenreOnly(genres: string[]): boolean {
  return genres.length === 1 && genres[0] === 'Electronic';
}

@CommandHandler(DumpReleaseCommand)
export class DumpReleaseCommandHandler
  implements ICommandHandler<DumpReleaseCommand, void>
{
  constructor(
    @Inject(RELEASE_REPOSITORY)
    private readonly releaseRepository: ReleaseRepository,
    @Inject(RELEASE_DUMP_XML_STREAMER)
    private readonly dumpXmlStreamer: ReleaseDumpXmlStreamer,
    private readonly configService: ConfigService,
  ) {}

  async execute(_command: DumpReleaseCommand): Promise<void> {
    const filePath = this.configService.getOrThrow<string>(
      DISCOGS_RELEASES_XML_PATH,
    );
    let batch: ReleaseEntity[] = [];
    let flushChain: Promise<void> = Promise.resolve();

    const enqueueFlush = (entities: ReleaseEntity[]) => {
      if (entities.length === 0) {
        return;
      }

      flushChain = flushChain.then(() =>
        this.releaseRepository.upsertReleases(entities),
      );
    };

    await this.dumpXmlStreamer.streamFromPath(filePath, (row) => {
      const entity = toReleaseEntity(row);
      if (!entity) {
        return;
      }

      batch.push(entity);

      if (batch.length >= DUMP_BATCH_SIZE) {
        const toFlush = batch;
        batch = [];
        enqueueFlush(toFlush);
      }
    });

    await flushChain;

    if (batch.length > 0) {
      await this.releaseRepository.upsertReleases(batch);
    }
  }
}

function toReleaseEntity(row: ParsedDumpRelease): ReleaseEntity | null {
  if (!isElectronicGenreOnly(row.genres)) {
    return null;
  }

  const now = new Date();

  return ReleaseEntity.from({
    id: randomUUID(),
    releaseId: row.releaseId,
    country: row.country ?? undefined,
    released: row.released ?? undefined,
    genres: row.genres,
    styles: row.styles.length > 0 ? row.styles : undefined,
    notes: row.notes ?? undefined,
    createdAt: now,
    updatedAt: now,
  });
}
