import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { MovieStatus } from '../movie.entity';

export class CreateMovieDto {
  @IsString()
  title!: string;

  @IsEnum(MovieStatus)
  status!: MovieStatus;

  @ValidateIf((o) => o.status === MovieStatus.WATCHED)
  @IsDateString()
  @IsOptional()
  watchDate?: string;

  @ValidateIf((o) => o.status === MovieStatus.WANT_TO_WATCH)
  @IsOptional()
  watchDateOptional?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  innaRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bogdanRating?: number;

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

