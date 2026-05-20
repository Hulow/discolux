import { Module } from '@nestjs/common';
import { RELEASE_DUMP_XML_STREAMER } from '../../application/ports/release-dump-xml-streamer.port';
import { FsReleaseDumpXmlStreamer } from './fs-release-dump-xml.streamer';

@Module({
  providers: [
    {
      provide: RELEASE_DUMP_XML_STREAMER,
      useClass: FsReleaseDumpXmlStreamer,
    },
  ],
  exports: [RELEASE_DUMP_XML_STREAMER],
})
export class ReleaseDumpModule {}
