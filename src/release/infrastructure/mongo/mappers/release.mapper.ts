import { Types } from 'mongoose';
import {
  ReleaseEntity,
  type ReleaseEntityProps,
} from '../../../domain/release.entity';

export type ReleaseDocumentData = {
  _id: string;
  releaseId: number;
  mongoId?: Types.ObjectId;
  status?: string;
  year?: number;
  url?: string;
  communityHave?: number;
  communityWant?: number;
  ratingCount?: number;
  ratingAverage?: number;
  addedAt?: string;
  changedAt?: string;
  numberForSale?: number;
  lowestPrice?: number;
  country?: string;
  released?: Date;
  notes?: string;
  releaseFormatted?: string;
  genres?: string[];
  styles?: string[];
  blockedFromSale?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function releaseEntityToDocument(
  entity: ReleaseEntity,
): ReleaseDocumentData {
  return {
    _id: entity.id,
    releaseId: entity.releaseId,
    status: entity.status,
    year: entity.year,
    url: entity.url,
    communityHave: entity.communityHave,
    communityWant: entity.communityWant,
    ratingCount: entity.ratingCount,
    ratingAverage: entity.ratingAverage,
    addedAt: entity.addedAt,
    changedAt: entity.changedAt,
    numberForSale: entity.numberForSale,
    lowestPrice: entity.lowestPrice,
    country: entity.country,
    released: entity.released,
    notes: entity.notes,
    releaseFormatted: entity.releaseFormatted,
    genres: entity.genres,
    styles: entity.styles,
    blockedFromSale: entity.blockedFromSale,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function releaseDocumentToEntityProps(
  document: ReleaseDocumentData,
): ReleaseEntityProps {
  return {
    id: document._id,
    releaseId: document.releaseId,
    status: document.status,
    year: document.year,
    url: document.url,
    communityHave: document.communityHave,
    communityWant: document.communityWant,
    ratingCount: document.ratingCount,
    ratingAverage: document.ratingAverage,
    addedAt: document.addedAt,
    changedAt: document.changedAt,
    numberForSale: document.numberForSale,
    lowestPrice: document.lowestPrice,
    country: document.country,
    released: document.released,
    notes: document.notes,
    releaseFormatted: document.releaseFormatted,
    genres: document.genres,
    styles: document.styles,
    blockedFromSale: document.blockedFromSale,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function releaseDocumentToEntity(
  document: ReleaseDocumentData,
): ReleaseEntity {
  return ReleaseEntity.from(releaseDocumentToEntityProps(document));
}
