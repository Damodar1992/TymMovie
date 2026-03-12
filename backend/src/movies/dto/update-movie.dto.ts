import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MovieStatus } from '../movie.entity';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;

  @IsOptional()
  @IsDateString()
  watchDate?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  innaRating?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bogdanRating?: number | null;

  @IsOptional()
  @IsString()
  originalTitle?: string | null;

  @IsOptional()
  @IsString()
  imdbId?: string | null;

  @IsOptional()
  @IsString()
  posterUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[] | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  imdbRating?: number | null;

  @IsOptional()
  @IsString()
  sourceProvider?: string | null;

  @IsOptional()
  sourcePayload?: unknown | null;
}

