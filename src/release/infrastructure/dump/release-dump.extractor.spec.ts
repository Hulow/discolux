import { ReleaseDumpBuilder } from './release-dump.builder';
import { ReleaseDumpExtractor } from './release-dump.extractor';

describe('ReleaseDumpExtractor', () => {
  it('captures released and genres from SAX-like events', () => {
    const done: unknown[] = [];
    const builder = new ReleaseDumpBuilder();
    const extractor = new ReleaseDumpExtractor(builder, (d) => done.push(d));

    extractor.onOpenTag({ name: 'release', attributes: { id: '101' } });
    extractor.onOpenTag({ name: 'released', attributes: {} });
    extractor.onText('1999-03');
    extractor.onCloseTag('released');
    extractor.onOpenTag({ name: 'genre', attributes: {} });
    extractor.onText('Electronic');
    extractor.onCloseTag('genre');
    extractor.onCloseTag('release');

    expect(done).toHaveLength(1);
    expect(done[0]).toMatchObject({
      releaseId: 101,
      released: '1999-03',
      genres: ['Electronic'],
    });
  });

  it('skips callback when release id is not a positive integer', () => {
    const done: unknown[] = [];
    const builder = new ReleaseDumpBuilder();
    const extractor = new ReleaseDumpExtractor(builder, (d) => done.push(d));

    extractor.onOpenTag({ name: 'release', attributes: { id: 'x' } });
    extractor.onCloseTag('release');

    expect(done).toHaveLength(0);
  });
});
