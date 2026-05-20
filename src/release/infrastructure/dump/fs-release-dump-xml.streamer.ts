import { createReadStream } from 'fs';
import { Injectable } from '@nestjs/common';
import type {
  ParsedDumpRelease,
  ReleaseDumpXmlStreamer,
} from '../../application/ports/release-dump-xml-streamer.port';
import { ReleaseDumpBuilder } from './release-dump.builder';
import { ReleaseDumpExtractor } from './release-dump.extractor';
import { SaxReleaseParser } from './sax-release.parser';

@Injectable()
export class FsReleaseDumpXmlStreamer implements ReleaseDumpXmlStreamer {
  async streamFromPath(
    filePath: string,
    onRelease: (row: ParsedDumpRelease) => void,
  ): Promise<void> {
    const builder = new ReleaseDumpBuilder();
    const extractor = new ReleaseDumpExtractor(builder, onRelease);
    const parser = new SaxReleaseParser(extractor);
    const input = createReadStream(filePath, {
      highWaterMark: 4 * 1024 * 1024,
    });
    input.setEncoding('utf8');

    await new Promise<void>((resolve, reject) => {
      const fail = (err: Error) => {
        input.destroy();
        reject(err);
      };

      input.on('error', fail);
      parser.saxStream.on('error', fail);
      parser.saxStream.on('end', () => resolve());
      parser.pipe(input);
    });
  }
}
