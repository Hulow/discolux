import { createReadStream } from 'fs';
import { ReleaseBuilder } from './lib/release.builder';
import { ReleaseExtractor } from './lib/release.extractor';
import { SaxReleaseParser } from './lib/release.parser';

async function main(): Promise<void> {
  const builder = new ReleaseBuilder();
  const extractor = new ReleaseExtractor(builder);
  const parser = new SaxReleaseParser(extractor);

  const input = createReadStream(
    'data/discogs_20260501_releases.xml',
    { highWaterMark: 4 * 1024 * 1024 }
  );

  input.setEncoding('utf8');

  parser.pipe(input);

  await new Promise<void>((resolve, reject) => {
    input.on('error', reject);
    parser['parser']?.on?.('end', resolve);
  });
}

void main();