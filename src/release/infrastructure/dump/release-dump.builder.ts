export type ReleaseDumpWorkRow = {
  releaseId: string;
  labelName: string | null;
  labelCatNo: string | null;
  genres: string[];
  styles: string[];
  country: string | null;
  released: string | null;
  /** First text under a `name` tag while inside a release (often title; not persisted). */
  name: string | null;
  notes: string | null;
};

export class ReleaseDumpBuilder {
  release: ReleaseDumpWorkRow | null = null;
  private currentText = '';

  start(id: string) {
    this.release = {
      releaseId: id,
      labelName: null,
      labelCatNo: null,
      genres: [],
      styles: [],
      country: null,
      released: null,
      name: null,
      notes: null,
    };
  }

  resetText() {
    this.currentText = '';
  }

  addText(text: string) {
    this.currentText += text;
  }

  getText() {
    return this.currentText.trim();
  }

  isActive() {
    return this.release !== null;
  }

  finish(): ReleaseDumpWorkRow {
    const row = this.release!;
    this.release = null;
    return row;
  }
}
