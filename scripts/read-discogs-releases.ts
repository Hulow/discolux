import { access } from 'fs/promises';
import { parseArgs } from 'node:util';
import { resolve } from 'path';
import { streamReleases } from './lib/stream-releases';

const DEFAULT_FILE = 'data/discogs_20260501_releases.xml';

export type CliOptions = {
  file: string;
  limit?: number;
};

export function parseCliOptions(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      file: { type: 'string', default: DEFAULT_FILE },
      limit: { type: 'string' },
    },
    allowPositionals: false,
  });

  const file = values.file ?? DEFAULT_FILE;

  if (values.limit === undefined) {
    return { file };
  }

  const limit = Number(values.limit);

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('Option "--limit" must be a positive integer');
  }

  return { file, limit };
}

async function main(): Promise<void> {
  let options: CliOptions;

  try {
    options = parseCliOptions(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), options.file);

  try {
    await access(filePath);
  } catch {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  let count = 0;

  try {
    for await (const release of streamReleases(filePath)) {
      console.log(JSON.stringify(release));
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
}

if (require.main === module) {
  void main();
}
