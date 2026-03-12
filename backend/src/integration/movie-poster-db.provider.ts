import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface EnrichedMovieMetadata {
  title: string | null;
  originalTitle: string | null;
  imdbId: string | null;
  posterUrl: string | null;
  genres: string[] | null;
  imdbRating: number | null;
  year: number | null;
  source: 'tmdb';
  raw: unknown;
}

@Injectable()
export class MoviePosterDbProvider {
  private readonly logger = new Logger(MoviePosterDbProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY') ?? '';
    this.baseUrl =
      this.configService.get<string>('TMDB_BASE_URL') ??
      'https://api.themoviedb.org/3';
  }

  private getTmdbHeaders(): { Authorization: string; accept: string } {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      accept: 'application/json',
    };
  }

  async enrichByTitle(title: string): Promise<EnrichedMovieMetadata | null> {
    if (!this.apiKey) {
      this.logger.warn('TMDB_API_KEY is not configured.');
      return null;
    }

    try {
      const searchResponse = await axios.get(
        `${this.baseUrl}/search/multi`,
        {
          params: {
            query: title,
            include_adult: false,
            language: 'en-US',
            page: 1,
          },
          headers: this.getTmdbHeaders(),
        },
      );

      const searchData = searchResponse.data;
      const results = Array.isArray(searchData?.results) ? searchData.results : [];
      const first = results[0] ?? null;

      if (!first) {
        return null;
      }

      const mediaType = first.media_type ?? 'movie';

      if (mediaType === 'movie') {
        const detailsResponse = await axios.get(
          `${this.baseUrl}/movie/${first.id}`,
          {
            params: { language: 'en-US' },
            headers: this.getTmdbHeaders(),
          },
        );
        const details = detailsResponse.data;
        const posterUrl = first.poster_path
          ? `https://image.tmdb.org/t/p/w500${first.poster_path}`
          : null;
        const year =
          typeof first.release_date === 'string' &&
          first.release_date.trim().length >= 4
            ? Number(first.release_date.slice(0, 4))
            : null;
        const imdbRating =
          typeof first.vote_average === 'number'
            ? Math.round(first.vote_average * 10) / 10
            : null;
        const genres = Array.isArray(details?.genres)
          ? details.genres.map((g: { name: string }) => g.name)
          : null;
        return {
          title: first.title ?? null,
          originalTitle: first.original_title ?? first.title ?? null,
          imdbId: null,
          posterUrl,
          genres,
          imdbRating,
          year,
          source: 'tmdb' as const,
          raw: { search: searchData, details },
        };
      }

      if (mediaType === 'tv') {
        const detailsResponse = await axios.get(
          `${this.baseUrl}/tv/${first.id}`,
          {
            params: { language: 'en-US' },
            headers: this.getTmdbHeaders(),
          },
        );
        const details = detailsResponse.data;
        const posterUrl = first.poster_path
          ? `https://image.tmdb.org/t/p/w500${first.poster_path}`
          : null;
        const year =
          typeof first.first_air_date === 'string' &&
          first.first_air_date.trim().length >= 4
            ? Number(first.first_air_date.slice(0, 4))
            : null;
        const imdbRating =
          typeof first.vote_average === 'number'
            ? Math.round(first.vote_average * 10) / 10
            : null;
        const genres = Array.isArray(details?.genres)
          ? details.genres.map((g: { name: string }) => g.name)
          : null;
        return {
          title: first.name ?? null,
          originalTitle: first.original_name ?? first.name ?? null,
          imdbId: null,
          posterUrl,
          genres,
          imdbRating,
          year,
          source: 'tmdb' as const,
          raw: { search: searchData, details },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to enrich movie by title "${title}" via TMDB`,
        (error as Error).stack,
      );
      return null;
    }
  }
}

