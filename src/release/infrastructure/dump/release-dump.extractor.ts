import type { ParsedDumpRelease } from '../../application/ports/release-dump-xml-streamer.port';
import type { ReleaseDumpWorkRow } from './release-dump.builder';
import { ReleaseDumpBuilder } from './release-dump.builder';

interface SaxNode {
  name: string;
  attributes: Record<string, string>;
}

function toParsedRelease(row: ReleaseDumpWorkRow): ParsedDumpRelease | null {
  const releaseId = Number.parseInt(row.releaseId, 10);
  if (!Number.isFinite(releaseId) || releaseId < 1) {
    return null;
  }

  return {
    releaseId,
    genres: row.genres,
    styles: row.styles,
    country: row.country,
    released: row.released,
    notes: row.notes,
    labelName: row.labelName,
    labelCatNo: row.labelCatNo,
  };
}

export class ReleaseDumpExtractor {
  constructor(
    private readonly builder: ReleaseDumpBuilder,
    private readonly onRelease: (row: ParsedDumpRelease) => void,
  ) {}

  onOpenTag(node: SaxNode) {
    this.builder.resetText();

    if (node.name === 'release') {
      const id = node.attributes.id ?? '';
      this.builder.start(id);
    }

    if (node.name === 'label' && this.builder.isActive()) {
      const r = this.builder.release!;

      if (!r.labelName) {
        r.labelName = node.attributes.name ?? null;
        r.labelCatNo = node.attributes.catno ?? null;
      }
    }
  }

  onText(text: string) {
    if (!this.builder.isActive()) return;
    this.builder.addText(text);
  }

  onCloseTag(tagName: string) {
    if (!this.builder.isActive()) return;

    const r = this.builder.release!;
    const text = this.builder.getText();

    switch (tagName) {
      case 'genre':
        if (text) r.genres.push(text);
        break;

      case 'style':
        if (text) r.styles.push(text);
        break;

      case 'country':
        r.country = text || null;
        break;

      case 'released':
        r.released = text || null;
        break;

      case 'name':
        if (!r.name) r.name = text;
        break;

      case 'notes':
        r.notes = text || null;
        break;

      case 'release': {
        const done = this.builder.finish();
        const parsed = toParsedRelease(done);
        if (parsed) {
          this.onRelease(parsed);
        }
        break;
      }
    }
  }
}
