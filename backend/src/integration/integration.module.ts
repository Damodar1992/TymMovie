import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MoviePosterDbProvider } from './movie-poster-db.provider';

@Module({
  imports: [ConfigModule],
  providers: [MoviePosterDbProvider],
  exports: [MoviePosterDbProvider],
})
export class IntegrationModule {}

