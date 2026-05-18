import { Injectable } from '@nestjs/common';
import { DiscogsHttpClient } from '../../../shared/infrastructure/discogs/discogs-http.client';
import type { ReleaseDiscogsClient as ReleaseDiscogsClientPort } from '../../application/ports/release-discogs-client.port';
import {
  ReleaseDiscogsMapper,
  type DiscogsReleaseCommunityRatingResponse,
  type DiscogsReleaseResponse,
} from './mappers/release-discogs.mapper';

@Injectable()
export class ReleaseDiscogsClient implements ReleaseDiscogsClientPort {
  constructor(private readonly discogsHttpClient: DiscogsHttpClient) {}

  async getRelease(releaseId: string): Promise<DiscogsReleaseResponse> {
    const payload = await this.discogsHttpClient.getRelease(releaseId);

    return ReleaseDiscogsMapper.fromDiscogsRelease(payload);
  }

  async getReleaseCommunityRating(
    releaseId: string,
  ): Promise<DiscogsReleaseCommunityRatingResponse> {
    const payload =
      await this.discogsHttpClient.getReleaseCommunityRating(releaseId);

    return ReleaseDiscogsMapper.fromDiscogsCommunityRating(payload);
  }
}
