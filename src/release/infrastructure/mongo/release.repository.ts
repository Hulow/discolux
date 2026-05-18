import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ReleaseRepository as ReleaseRepositoryPort } from '../../application/ports/release-repository.port';
import { ReleaseEntity } from '../../domain/release.entity';
import { releaseEntityToDocument } from './mappers/release.mapper';
import { Release } from './release.schema';

@Injectable()
export class ReleaseRepository implements ReleaseRepositoryPort {
  constructor(
    @InjectModel(Release.name) private readonly releaseModel: Model<Release>,
  ) {}

  async addReleases(releases: ReleaseEntity[]): Promise<void> {
    if (releases.length === 0) {
      return;
    }

    const documents = releases.map(releaseEntityToDocument);
    await this.releaseModel.insertMany(documents);
  }
}
