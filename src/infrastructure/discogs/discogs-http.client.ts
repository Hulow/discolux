import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscogsClient } from '../../application/release/ports/discogs-client.port';

const DISCOGS_API_BASE_URL = 'https://api.discogs.com';

@Injectable()
export class DiscogsHttpClient implements DiscogsClient {
  constructor(private readonly configService: ConfigService) {}

  getRelease(releaseId: string): Promise<unknown> {
    return this.request(`/releases/${releaseId}`);
  }

  private async request(path: string): Promise<unknown> {
    const response = await fetch(this.buildUrl(path), {
      headers: {
        Accept: 'application/vnd.discogs.v2.discogs+json',
        'User-Agent': 'Discolux/0.0.1',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Discogs API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  private buildUrl(path: string): string {
    const token = this.configService.getOrThrow<string>('DISCOGS_TOKEN');
    const base = `${DISCOGS_API_BASE_URL}${path}`;
    const separator = base.includes('?') ? '&' : '?';

    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
}
