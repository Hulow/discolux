import * as sax from 'sax';
import { ReadStream } from 'fs';
import { ReleaseExtractor } from './release.extractor';
import type { Tag } from 'sax';

export class SaxReleaseParser {
  private parser = sax.createStream(true);

  constructor(private handler: ReleaseExtractor) {
    this.wire();
  }

  private wire() {
    this.parser.on('opentag', (node) => {
      this.handler.onOpenTag(node as Tag);
    });

    this.parser.on('text', (text) => {
      this.handler.onText(text);
    });

    this.parser.on('closetag', (tagName) => {
      this.handler.onCloseTag(tagName);
    });

    this.parser.on('error', (err) => {
      console.error(err);
      process.exit(1);
    });
  }

  pipe(stream: ReadStream) {
    stream.pipe(this.parser);
  }
}