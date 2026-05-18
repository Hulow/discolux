import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ReleaseRepository as ReleaseRepositoryPort } from '../../application/ports/release-repository.port';
import { ReleaseEntity } from '../../domain/release.entity';
import {
  releaseEntityToDocument,
  type ReleaseDocumentData,
} from './mappers/release.mapper';
import { Release } from './release.schema';

function isStubEntity(entity: ReleaseEntity): boolean {
  return (
    entity.status === undefined &&
    entity.year === undefined &&
    entity.url === undefined &&
    entity.communityHave === undefined &&
    entity.communityWant === undefined &&
    entity.ratingCount === undefined &&
    entity.ratingAverage === undefined &&
    entity.addedAt === undefined &&
    entity.changedAt === undefined &&
    entity.numberForSale === undefined &&
    entity.lowestPrice === undefined &&
    entity.country === undefined &&
    entity.released === undefined &&
    entity.notes === undefined &&
    entity.releaseFormatted === undefined &&
    entity.genres === undefined &&
    entity.styles === undefined &&
    entity.blockedFromSale === undefined
  );
}

function definedFieldsExcept(
  doc: ReleaseDocumentData,
  omitKeys: (keyof ReleaseDocumentData)[],
): Record<string, unknown> {
  const omit = new Set<string>(omitKeys);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(doc)) {
    if (!omit.has(key) && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

function buildUpsertOperation(entity: ReleaseEntity) {
  const doc = releaseEntityToDocument(entity);
  const filter = { releaseId: doc.releaseId };
  const setOnInsert = {
    _id: doc._id,
    releaseId: doc.releaseId,
    createdAt: doc.createdAt,
  };

  if (isStubEntity(entity)) {
    return {
      updateOne: {
        filter,
        update: {
          $set: {
            releaseId: doc.releaseId,
            updatedAt: doc.updatedAt,
          },
          $setOnInsert: {
            _id: doc._id,
            createdAt: doc.createdAt,
          },
        },
        upsert: true,
      },
    };
  }

  return {
    updateOne: {
      filter,
      update: {
        $set: definedFieldsExcept(doc, ['_id', 'createdAt', 'releaseId']),
        $setOnInsert: setOnInsert,
      },
      upsert: true,
    },
  };
}

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

  async upsertReleases(releases: ReleaseEntity[]): Promise<void> {
    if (releases.length === 0) {
      return;
    }

    await this.releaseModel.bulkWrite(
      releases.map((entity) => buildUpsertOperation(entity)),
    );
  }
}
