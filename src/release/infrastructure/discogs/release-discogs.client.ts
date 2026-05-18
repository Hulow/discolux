import { Injectable } from '@nestjs/common';
import { ReleaseEntity } from '../../domain/release.entity';
import { DiscogsHttpClient } from '../../../shared/infrastructure/discogs/discogs-http.client';
import type { ReleaseDiscogsClient as ReleaseDiscogsClientPort } from '../../application/ports/release-discogs-client.port';
import {
  ReleaseDiscogsMapper,
  type DiscogsReleaseCommunityRatingResponse,
} from './mappers/release-discogs.mapper';
import { discogsReleaseToEntity } from './mappers/release-entity.mapper';

@Injectable()
export class ReleaseDiscogsClient implements ReleaseDiscogsClientPort {
  constructor(private readonly discogsHttpClient: DiscogsHttpClient) {}

  async getRelease(releaseId: string): Promise<ReleaseEntity> {
    const payload = await this.discogsHttpClient.getRelease(releaseId);
    const dto = ReleaseDiscogsMapper.fromDiscogsRelease(payload);

    return discogsReleaseToEntity(dto);
  }

  async getReleaseCommunityRating(
    releaseId: string,
  ): Promise<DiscogsReleaseCommunityRatingResponse> {
    const payload =
      await this.discogsHttpClient.getReleaseCommunityRating(releaseId);

    return ReleaseDiscogsMapper.fromDiscogsCommunityRating(payload);
  }
}
