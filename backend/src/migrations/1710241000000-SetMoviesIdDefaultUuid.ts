import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetMoviesIdDefaultUuid1710241000000 implements MigrationInterface {
  name = 'SetMoviesIdDefaultUuid1710241000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    );
    await queryRunner.query(
      `ALTER TABLE movies ALTER COLUMN id SET DEFAULT uuid_generate_v4();`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE movies ALTER COLUMN id DROP DEFAULT;`,
    );
  }
}

