import { Injectable } from '@nestjs/common';
import { DiscogsHttpClient } from '../../../shared/infrastructure/discogs/discogs-http.client';
import type { ReleaseDiscogsClient as ReleaseDiscogsClientPort } from '../../application/ports/release-discogs-client.port';

@Injectable()
export class ReleaseDiscogsClient implements ReleaseDiscogsClientPort {
  constructor(private readonly discogsHttpClient: DiscogsHttpClient) {}

  getRelease(releaseId: string): Promise<unknown> {
    return this.discogsHttpClient.getRelease(releaseId);
  }

  getReleaseCommunityRating(releaseId: string): Promise<unknown> {
    return this.discogsHttpClient.getReleaseCommunityRating(releaseId);
  }
}
