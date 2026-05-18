import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RELEASE_REPOSITORY } from '../../application/ports/release-repository.port';
import { ReleaseRepository } from './release.repository';
import { Release, ReleaseSchema } from './release.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Release.name, schema: ReleaseSchema }]),
  ],
  providers: [
    {
      provide: RELEASE_REPOSITORY,
      useClass: ReleaseRepository,
    },
  ],
  exports: [RELEASE_REPOSITORY],
})
export class ReleaseMongoModule {}
