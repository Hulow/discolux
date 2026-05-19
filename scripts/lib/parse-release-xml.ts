import * as sax from 'sax';
import type { ParsedRelease } from './parsed-release';
import { ReleaseXmlParser } from './release-xml-parser';

export type { ParsedRelease } from './parsed-release';

export function parseReleaseXml(xml: string): ParsedRelease {
  const handler = new ReleaseXmlParser();
  let result: ParsedRelease | null = null;
  const parser = sax.parser(true);

  parser.onopentag = (node) => {
    handler.onOpenTag(node);
  };

  parser.ontext = (text) => {
    handler.onText(text);
  };

  parser.oncdata = (text) => {
    handler.onText(text);
  };

  parser.onclosetag = (name) => {
    const parsed = handler.onCloseTag(name);

    if (parsed) {
      result = parsed;
    }
  };

  parser.write(xml);
  parser.close();

  if (result === null) {
    throw new Error('Release XML did not contain a complete <release> element');
  }

  return result;
}
