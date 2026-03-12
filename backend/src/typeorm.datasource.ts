import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { Movie } from './movies/movie.entity';

loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Movie],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: false,
});

