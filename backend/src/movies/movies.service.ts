import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { Movie, MovieStatus } from './movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMoviesDto, MoviesSortBy } from './dto/query-movies.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly repo: Repository<Movie>,
  ) {}

  normalizeTitle(title: string): string {
    return title.trim().toLowerCase();
  }

  computeUserAvgRating(
    innaRating: number | null,
    bogdanRating: number | null,
  ): number | null {
    const ratings = [innaRating, bogdanRating].filter(
      (r): r is number => r !== null && r !== undefined,
    );
    if (!ratings.length) return null;
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    return Math.round(avg * 10) / 10;
  }

  enforceBusinessRules(status: MovieStatus, watchDate: string | null): void {
    if (status === MovieStatus.WATCHED && !watchDate) {
      throw new BadRequestException('Watch date is required for watched movies.');
    }
    if (status === MovieStatus.WANT_TO_WATCH && watchDate) {
      throw new BadRequestException(
        'Watch date must be empty for movies you want to watch.',
      );
    }
  }

  private mapSort(sortBy?: MoviesSortBy): keyof Movie {
    switch (sortBy) {
      case 'watch_date':
        return 'watchDate';
      case 'status':
        return 'status';
      case 'user_avg_rating':
      default:
        return 'userAvgRating';
    }
  }

  async list(query: QueryMoviesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.repo.createQueryBuilder('movie');

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(movie.title) LIKE :term OR LOWER(movie.originalTitle) LIKE :term)',
        { term },
      );
    }

    if (query.status) {
      qb.andWhere('movie.status = :status', { status: query.status });
    }

    if (query.genres && query.genres.length > 0) {
      qb.andWhere('movie.genres @> :genres', { genres: query.genres });
    }

    const sortField = this.mapSort(query.sortBy);
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(`movie.${sortField}`, sortOrder as 'ASC' | 'DESC', 'NULLS LAST');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getById(id: string): Promise<Movie | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: CreateMovieDto) {
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
        hypothesisId: 'H2',
        location: 'movies.service.ts:create:before-business-rules',
        message: 'Before enforcing business rules',
        data: {
          status: dto.status,
          watchDate: dto.watchDate ?? null,
          innaRating: dto.innaRating ?? null,
          bogdanRating: dto.bogdanRating ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    const watchDate =
      dto.status === MovieStatus.WANT_TO_WATCH ? null : dto.watchDate ?? null;
    this.enforceBusinessRules(dto.status, watchDate);

    const innaRating = dto.innaRating ?? null;
    const bogdanRating = dto.bogdanRating ?? null;
    const userAvgRating = this.computeUserAvgRating(innaRating, bogdanRating);

    const movie = this.repo.create({
      title: dto.title,
      titleNormalized: this.normalizeTitle(dto.title),
      status: dto.status,
      watchDate,
      innaRating,
      bogdanRating,
      userAvgRating,
      originalTitle: dto.originalTitle ?? null,
      imdbId: dto.imdbId ?? null,
      posterUrl: dto.posterUrl ?? null,
      genres: dto.genres ?? null,
      imdbRating: dto.imdbRating ?? null,
      sourceProvider: dto.sourceProvider ?? null,
      sourcePayload: dto.sourcePayload ?? null,
    });

    const existingWithSameTitle = await this.repo.findOne({
      where: { titleNormalized: movie.titleNormalized },
    });

    try {
      const saved = await this.repo.save(movie);

      // #region agent log
      fetch(
        'http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'fdb080',
          },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'movies.service.ts:create:after-save',
            message: 'Movie saved successfully',
            data: { id: saved.id },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion agent log

      return {
        movie: saved,
        duplicateTitle: Boolean(existingWithSameTitle),
      };
    } catch (error) {
      // #region agent log
      fetch(
        'http://127.0.0.1:7776/ingest/68334f32-6090-42f2-83a6-f33868bdea81',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'fdb080',
          },
          body: JSON.stringify({
            sessionId: 'fdb080',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'movies.service.ts:create:error',
            message: 'Error while saving movie',
            data: {
              name: (error as Error).name,
              message: (error as Error).message,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion agent log

      throw error;
    }
  }

  async update(id: string, dto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.getById(id);
    if (!movie) {
      throw new BadRequestException('Movie not found.');
    }

    if (dto.title) {
      movie.title = dto.title;
      movie.titleNormalized = this.normalizeTitle(dto.title);
    }

    if (dto.status) {
      movie.status = dto.status;
    }

    if (dto.watchDate !== undefined) {
      movie.watchDate = dto.watchDate;
    }

    if (dto.innaRating !== undefined) {
      movie.innaRating = dto.innaRating;
    }

    if (dto.bogdanRating !== undefined) {
      movie.bogdanRating = dto.bogdanRating;
    }

    if (dto.originalTitle !== undefined) {
      movie.originalTitle = dto.originalTitle;
    }

    if (dto.imdbId !== undefined) {
      movie.imdbId = dto.imdbId;
    }

    if (dto.posterUrl !== undefined) {
      movie.posterUrl = dto.posterUrl;
    }

    if (dto.genres !== undefined) {
      movie.genres = dto.genres;
    }

    if (dto.imdbRating !== undefined) {
      movie.imdbRating = dto.imdbRating;
    }

    if (dto.sourceProvider !== undefined) {
      movie.sourceProvider = dto.sourceProvider;
    }

    if (dto.sourcePayload !== undefined) {
      movie.sourcePayload = dto.sourcePayload;
    }

    this.enforceBusinessRules(movie.status, movie.watchDate);

    movie.userAvgRating = this.computeUserAvgRating(
      movie.innaRating,
      movie.bogdanRating,
    );

    return this.repo.save(movie);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

