import { createReadStream } from 'fs';
import * as sax from 'sax';
import type { ParsedRelease } from './parsed-release';
import { ReleaseXmlParser } from './release-xml-parser';

export type { ParsedRelease } from './parsed-release';

export async function* streamReleases(
  filePath: string,
): AsyncGenerator<ParsedRelease> {
  const input = createReadStream(filePath, { encoding: 'utf8' });
  const saxStream = sax.createStream(true);
  const handler = new ReleaseXmlParser();
  const queue: ParsedRelease[] = [];
  let pendingResolve: (() => void) | null = null;
  let streamError: Error | undefined;
  let ended = false;

  const notify = (): void => {
    if (pendingResolve) {
      pendingResolve();
      pendingResolve = null;
    }
  };

  const enqueue = (release: ParsedRelease): void => {
    queue.push(release);
    notify();
  };

  const handleParserError = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Skipping release: ${message}`);
  };

  saxStream.on('opentag', (node) => {
    try {
      const parsed = handler.onOpenTag(node);

      if (parsed) {
        enqueue(parsed);
      }
    } catch (error) {
      handleParserError(error);
    }
  });

  saxStream.on('text', (text) => {
    handler.onText(text);
  });

  saxStream.on('cdata', (text) => {
    handler.onText(text);
  });

  saxStream.on('closetag', (name) => {
    try {
      const parsed = handler.onCloseTag(name);

      if (parsed) {
        enqueue(parsed);
      }
    } catch (error) {
      handleParserError(error);
    }
  });

  saxStream.on('error', (error) => {
    streamError = error instanceof Error ? error : new Error(String(error));
    notify();
  });

  saxStream.on('end', () => {
    ended = true;
    notify();
  });

  input.on('error', (error) => {
    streamError = error;
    notify();
  });

  input.pipe(saxStream);

  try {
    while (true) {
      if (streamError) {
        throw streamError;
      }

      while (queue.length > 0) {
        yield queue.shift() as ParsedRelease;
      }

      if (ended) {
        break;
      }

      await new Promise<void>((resolve) => {
        pendingResolve = resolve;
      });
    }
  } finally {
    input.destroy();
    input.unpipe(saxStream);
  }
}
