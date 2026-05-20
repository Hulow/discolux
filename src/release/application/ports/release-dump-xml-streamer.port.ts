export type ParsedDumpRelease = {
  releaseId: number;
  genres: string[];
  styles: string[];
  country: string | null;
  released: string | null;
  notes: string | null;
  labelName: string | null;
  labelCatNo: string | null;
};

export const RELEASE_DUMP_XML_STREAMER = Symbol('RELEASE_DUMP_XML_STREAMER');

export interface ReleaseDumpXmlStreamer {
  streamFromPath(
    filePath: string,
    onRelease: (row: ParsedDumpRelease) => void,
  ): Promise<void>;
}
