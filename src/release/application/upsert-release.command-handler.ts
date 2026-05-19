import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReleaseEntity } from '../domain/release.entity';
import { UpsertReleaseCommand } from './upsert-release.command';
import {
  RELEASE_REPOSITORY,
  ReleaseRepository,
} from './ports/release-repository.port';

@CommandHandler(UpsertReleaseCommand)
export class UpsertReleaseCommandHandler
  implements ICommandHandler<UpsertReleaseCommand, void>
{
  constructor(
    @Inject(RELEASE_REPOSITORY)
    private readonly releaseRepository: ReleaseRepository,
  ) {}

  async execute(command: UpsertReleaseCommand): Promise<void> {
    if (!isElectronicGenreOnly(command.genres)) {
      return;
    }

    const now = new Date();

    const entity = ReleaseEntity.from({
      id: randomUUID(),
      releaseId: command.id,
      country: command.country,
      released: command.released,
      genres: command.genres,
      styles: command.styles,
      createdAt: now,
      updatedAt: now,
    });

    await this.releaseRepository.upsertReleases([entity]);
  }
}

function isElectronicGenreOnly(genres: string[] | undefined): boolean {
  return genres?.length === 1 && genres[0] === 'Electronic';
}
