import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReleaseEntity } from '../domain/release.entity';
import { ProcessReleasesInBatchCommand } from './process-releases-in-batch.command';
import {
  RELEASE_DISCOGS_CLIENT,
  ReleaseDiscogsClient,
} from './ports/release-discogs-client.port';
import {
  RELEASE_REPOSITORY,
  ReleaseRepository,
} from './ports/release-repository.port';

function stubReleaseEntity(releaseId: number): ReleaseEntity {
  const now = new Date();

  return ReleaseEntity.from({
    id: randomUUID(),
    releaseId,
    createdAt: now,
    updatedAt: now,
  });
}

@CommandHandler(ProcessReleasesInBatchCommand)
export class ProcessReleasesInBatchCommandHandler
  implements ICommandHandler<ProcessReleasesInBatchCommand, void>
{
  constructor(
    @Inject(RELEASE_DISCOGS_CLIENT)
    private readonly discogsClient: ReleaseDiscogsClient,
    @Inject(RELEASE_REPOSITORY)
    private readonly releaseRepository: ReleaseRepository,
  ) {}

  async execute(command: ProcessReleasesInBatchCommand): Promise<void> {
    const from = Number(command.from);
    const till = Number(command.till);
    const ids: string[] = [];

    for (let id = from; id <= till; id++) {
      ids.push(String(id));
    }

    const entities = await Promise.all(
      ids.map((id) => this.fetchRelease(id)),
    );

    await this.releaseRepository.upsertReleases(entities);
  }

  private fetchRelease(releaseId: string): Promise<ReleaseEntity> {
    return this.discogsClient
      .getRelease(releaseId)
      .catch(() => stubReleaseEntity(Number(releaseId)));
  }
}
