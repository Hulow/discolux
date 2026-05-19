// Usage: npm run read-releases -- [--file path] [--limit n] [--api-url baseUrl] [--api-key key]
import { config as loadEnv } from 'dotenv';
import { access } from 'fs/promises';
import { parseArgs } from 'node:util';
import { resolve } from 'path';
import type { ParsedRelease } from './lib/parsed-release';
import { streamReleases } from './lib/stream-releases';

const DEFAULT_FILE = 'data/discogs_20260501_releases.xml';

export type CliOptions = {
  file: string;
  limit?: number;
  apiUrl?: string;
  apiKey?: string;
};

export type UpsertReleaseBody = {
  id: number;
  country?: string;
  released?: string;
  genres?: string[];
  styles?: string[];
};

export function toUpsertBody(release: ParsedRelease): UpsertReleaseBody {
  const body: UpsertReleaseBody = { id: release.id };

  if (release.country !== undefined) {
    body.country = release.country;
  }

  if (release.released !== undefined) {
    body.released = release.released;
  }

  if (release.genres !== undefined) {
    body.genres = release.genres;
  }

  if (release.styles !== undefined) {
    body.styles = release.styles;
  }

  return body;
}

export async function upsertRelease(
  apiUrl: string,
  apiKey: string,
  release: ParsedRelease,
  fetchFn: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
  const baseUrl = apiUrl.replace(/\/$/, '');
  const response = await fetchFn(`${baseUrl}/release/upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(toUpsertBody(release)),
  });

  return { ok: response.ok, status: response.status };
}

export function parseCliOptions(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      file: { type: 'string', default: DEFAULT_FILE },
      limit: { type: 'string' },
      'api-url': { type: 'string' },
      'api-key': { type: 'string' },
    },
    allowPositionals: false,
  });

  const file = values.file ?? DEFAULT_FILE;
  let limit: number | undefined;

  if (values.limit !== undefined) {
    limit = Number(values.limit);

    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Option "--limit" must be a positive integer');
    }
  }

  if (values['api-url'] === undefined) {
    return limit === undefined ? { file } : { file, limit };
  }

  const apiUrl = values['api-url'];

  if (apiUrl === '') {
    throw new Error('Option "--api-url" must be a non-empty base URL');
  }

  const apiKey = values['api-key'] ?? process.env.API_KEY;

  if (apiKey === undefined || apiKey === '') {
    throw new Error(
      'Option "--api-key", env API_KEY, or API_KEY in .env is required when --api-url is set',
    );
  }

  return limit === undefined
    ? { file, apiUrl, apiKey }
    : { file, limit, apiUrl, apiKey };
}

async function main(): Promise<void> {
  loadEnv();

  let options: CliOptions;

  try {
    options = parseCliOptions(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), options.file);

  if (options.apiUrl !== undefined) {
    console.error(
      `Persisting releases to ${options.apiUrl.replace(/\/$/, '')}/release/upsert`,
    );
  } else {
    console.error(
      'Writing NDJSON to stdout. Use --api-url <baseUrl> to POST each release to the API.',
    );
  }

  try {
    await access(filePath);
  } catch {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  let count = 0;
  let failed = false;

  try {
    for await (const release of streamReleases(filePath)) {
      if (options.apiUrl !== undefined) {
        const { ok, status } = await upsertRelease(
          options.apiUrl,
          options.apiKey!,
          release,
        );

        if (!ok) {
          console.error(
            `Failed to upsert release ${release.id}: HTTP ${status}`,
          );
          failed = true;
        }
      } else {
        console.log(JSON.stringify(release));
      }

      count++;

      if (options.limit !== undefined && count >= options.limit) {
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }

  if (failed) {
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
