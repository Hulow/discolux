/**
 * Triggers server-side Discogs XML dump ingest via POST /release/dump.
 * The API reads DISCOGS_RELEASES_XML_PATH on the server; this script does not stream XML locally.
 *
 * Usage:
 *   npm run dump-releases -- --api-url http://localhost:3000 --api-key "$API_KEY"
 * Env fallbacks: API_URL, API_KEY
 */
import { parseArgs } from 'node:util';

export type DumpReleasesCliOptions = {
  apiUrl: string;
  apiKey: string;
};

export function parseDumpReleasesCliOptions(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
): DumpReleasesCliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      'api-url': { type: 'string' },
      'api-key': { type: 'string' },
    },
    allowPositionals: false,
  });

  const apiUrl = values['api-url'] ?? env.API_URL;
  const apiKey = values['api-key'] ?? env.API_KEY;

  if (!apiUrl) {
    throw new Error('Missing --api-url or API_URL');
  }

  if (!apiKey) {
    throw new Error('Missing --api-key or API_KEY');
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ''),
    apiKey,
  };
}

export async function postReleaseDump(
  options: DumpReleasesCliOptions,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const url = `${options.apiUrl}/release/dump`;
  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      'x-api-key': options.apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`POST ${url} failed: ${response.status} ${body}`);
  }
}

async function main(): Promise<void> {
  const options = parseDumpReleasesCliOptions(process.argv.slice(2));
  await postReleaseDump(options);
}

if (require.main === module) {
  void main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
