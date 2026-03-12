import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMoviesDto } from './dto/query-movies.dto';
import { MoviePosterDbProvider } from '../integration/movie-poster-db.provider';

@Controller('api/movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly moviePosterDb: MoviePosterDbProvider,
  ) {}

  @Get()
  list(@Query() query: QueryMoviesDto) {
    return this.moviesService.list(query);
  }

  @Get('enrich')
  async enrich(@Query('title') title: string) {
    const metadata = await this.moviePosterDb.enrichByTitle(title);
    return metadata;
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const movie = await this.moviesService.getById(id);
    if (!movie) {
      throw new NotFoundException('Movie not found.');
    }
    return movie;
  }

  @Post()
  create(@Body() dto: CreateMovieDto) {
    // #region agent log
    fetch('http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'fdb080',
      },
      body: JSON.stringify({
        sessionId: 'fdb080',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'movies.controller.ts:create',
        message: 'CreateMovieDto received',
        data: { dto },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    return this.moviesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moviesService.delete(id);
  }
}

