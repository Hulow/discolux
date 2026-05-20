import * as sax from 'sax';
import type { ReadStream } from 'fs';
import type { Tag } from 'sax';
import { ReleaseDumpExtractor } from './release-dump.extractor';

/**
 * SAX stream wrapper for Discogs `releases` dump XML.
 */
export class SaxReleaseParser {
  readonly saxStream = sax.createStream(true);

  constructor(private readonly handler: ReleaseDumpExtractor) {
    this.wire();
  }

  private wire() {
    this.saxStream.on('opentag', (node) => {
      this.handler.onOpenTag(node as Tag);
    });

    this.saxStream.on('text', (text) => {
      this.handler.onText(text);
    });

    this.saxStream.on('closetag', (tagName) => {
      this.handler.onCloseTag(tagName);
    });
  }

  pipe(stream: ReadStream) {
    stream.pipe(this.saxStream);
  }
}
