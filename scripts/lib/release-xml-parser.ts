import type { QualifiedTag, Tag } from 'sax';
import type { ParsedRelease } from './parsed-release';

const RELEASE_LEVEL_FIELDS = new Set(['title', 'country', 'released']);

function normalizeStringArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const items = Array.isArray(value) ? value : [value];
  const normalized = items.map((item) => item.trim()).filter((item) => item.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}

export class ReleaseXmlParser {
  private inRelease = false;
  private path: string[] = [];
  private release: ParsedRelease | null = null;
  private textBuffer = '';
  private genres: string[] = [];
  private styles: string[] = [];

  onOpenTag(node: Tag | QualifiedTag): ParsedRelease | null {
    if (node.name === 'release' && !this.inRelease) {
      const id = Number(String(node.attributes.id));

      if (!Number.isInteger(id)) {
        throw new Error('Release id attribute is required and must be an integer');
      }

      this.inRelease = true;
      this.path = [];
      this.textBuffer = '';
      this.genres = [];
      this.styles = [];
      this.release = { id };

      return null;
    }

    if (!this.inRelease) {
      return null;
    }

    this.flushText();
    this.path.push(node.name);

    return null;
  }

  onText(text: string): void {
    if (!this.inRelease || this.path.length === 0) {
      return;
    }

    this.textBuffer += text;
  }

  onCloseTag(name: string): ParsedRelease | null {
    if (!this.inRelease) {
      return null;
    }

    if (name === 'release' && this.path.length === 0) {
      this.flushText();

      const completed = this.release;

      if (completed === null) {
        throw new Error('Release element closed without an active release');
      }

      const genres = normalizeStringArray(this.genres);
      const styles = normalizeStringArray(this.styles);

      if (genres !== undefined) {
        completed.genres = genres;
      }

      if (styles !== undefined) {
        completed.styles = styles;
      }

      this.reset();

      return completed;
    }

    if (this.path.length === 0 || this.path[this.path.length - 1] !== name) {
      return null;
    }

    this.flushText();
    this.path.pop();

    return null;
  }

  private flushText(): void {
    if (!this.inRelease || this.release === null || this.textBuffer.length === 0) {
      this.textBuffer = '';

      return;
    }

    const value = this.textBuffer.trim();
    this.textBuffer = '';

    if (value.length === 0) {
      return;
    }

    if (this.path.length === 1 && RELEASE_LEVEL_FIELDS.has(this.path[0])) {
      const field = this.path[0] as 'title' | 'country' | 'released';
      this.release[field] = value;

      return;
    }

    if (this.path.length === 2 && this.path[0] === 'genres' && this.path[1] === 'genre') {
      this.genres.push(value);

      return;
    }

    if (this.path.length === 2 && this.path[0] === 'styles' && this.path[1] === 'style') {
      this.styles.push(value);
    }
  }

  private reset(): void {
    this.inRelease = false;
    this.path = [];
    this.release = null;
    this.textBuffer = '';
    this.genres = [];
    this.styles = [];
  }
}
