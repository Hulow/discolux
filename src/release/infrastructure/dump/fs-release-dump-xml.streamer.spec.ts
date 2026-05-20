import { join } from 'path';
import { FsReleaseDumpXmlStreamer } from './fs-release-dump-xml.streamer';

describe('FsReleaseDumpXmlStreamer', () => {
  it('streams all releases from fixture XML', async () => {
    const xmlPath = join(
      __dirname,
      '../../../../test/fixtures/releases-sample.xml',
    );
    const streamer = new FsReleaseDumpXmlStreamer();
    const ids: number[] = [];
    await streamer.streamFromPath(xmlPath, (row) => ids.push(row.releaseId));

    expect(ids.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });
});
