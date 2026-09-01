#!/usr/bin/env node
// Applies any not-yet-applied SQL files from /migrations, in filename order,
// tracked in a `_migrations` table. Run with:
//   node --env-file=.env scripts/migrate.mjs
// (or set DATABASE_URL in the environment however you prefer).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Pass --env-file=.env or export it first.');
  process.exit(1);
}

const sql = neon(databaseUrl);

function splitStatements(fileContents) {
  return fileContents
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const applied = new Set(
    (await sql`SELECT id FROM _migrations`).map((r) => r.id),
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) continue;
    ranAny = true;
    console.log(`Applying ${file}...`);
    const contents = readFileSync(path.join(migrationsDir, file), 'utf8');
    for (const statement of splitStatements(contents)) {
      await sql(statement);
    }
    await sql`INSERT INTO _migrations (id) VALUES (${file})`;
    console.log(`  done.`);
  }

  if (!ranAny) {
    console.log('Nothing to do — schema is already up to date.');
  } else {
    console.log('Migrations complete.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
