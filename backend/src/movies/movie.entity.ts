import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MovieStatus {
  WATCHED = 'WATCHED',
  WANT_TO_WATCH = 'WANT_TO_WATCH',
}

@Entity({ name: 'movies' })
@Index('idx_movies_status', ['status'])
@Index('idx_movies_watch_date', ['watchDate'])
@Index('idx_movies_user_avg_rating', ['userAvgRating'])
@Index('idx_movies_title_normalized', ['titleNormalized'])
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'title_normalized', type: 'varchar', length: 255 })
  titleNormalized!: string;

  @Column({ name: 'original_title', type: 'varchar', length: 255, nullable: true })
  originalTitle: string | null = null;

  @Column({ name: 'imdb_id', type: 'varchar', length: 32, nullable: true })
  imdbId: string | null = null;

  @Column({ name: 'poster_url', type: 'text', nullable: true })
  posterUrl: string | null = null;

  @Column({ name: 'genres', type: 'jsonb', nullable: true })
  genres: string[] | null = null;

  @Column({
    name: 'imdb_rating',
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  imdbRating: number | null = null;

  @Column({
    name: 'inna_rating',
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  innaRating: number | null = null;

  @Column({
    name: 'bogdan_rating',
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  bogdanRating: number | null = null;

  @Column({
    name: 'user_avg_rating',
    type: 'numeric',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  userAvgRating: number | null = null;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status!: MovieStatus;

  @Column({ name: 'watch_date', type: 'date', nullable: true })
  watchDate: string | null = null;

  @Column({ name: 'source_provider', type: 'varchar', length: 64, nullable: true })
  sourceProvider: string | null = null;

  @Column({ name: 'source_payload', type: 'jsonb', nullable: true })
  sourcePayload: unknown | null = null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}

