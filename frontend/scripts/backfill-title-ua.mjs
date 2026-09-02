#!/usr/bin/env node
// One-off backfill: fills movies.title_ua for catalog rows cached before
// bilingual title support. Safe to re-run — only touches rows where
// title_ua IS NULL and tmdb_id IS NOT NULL.
//
// Usage:
//   node --use-system-ca --env-file=.env scripts/backfill-title-ua.mjs [--dry-run]
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Pass --env-file=.env or export it first.');
  process.exit(1);
}
const tmdbApiKey = process.env.TMDB_API_KEY;
if (!tmdbApiKey) {
  console.error('TMDB_API_KEY is not set. Pass --env-file=.env or export it first.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const sql = neon(databaseUrl);
const TMDB_BASE = 'https://api.themoviedb.org/3';
const DELAY_MS = 120;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTitleUa(tmdbId, contentType) {
  const kind = contentType === 'TV' ? 'tv' : 'movie';
  const res = await fetch(`${TMDB_BASE}/${kind}/${tmdbId}?language=uk-UA`, {
    headers: { Authorization: `Bearer ${tmdbApiKey}`, accept: 'application/json' },
  });
  if (!res.ok) {
    console.warn(`  TMDb ${res.status} for ${kind}/${tmdbId}`);
    return null;
  }
  const data = await res.json();
  const title = (contentType === 'TV' ? data.name : data.title)?.trim();
  return title || null;
}

async function main() {
  const rows = await sql`
    SELECT id, tmdb_id, content_type, title
    FROM movies
    WHERE tmdb_id IS NOT NULL AND title_ua IS NULL
    ORDER BY title
  `;
  console.log(`Found ${rows.length} catalog rows without title_ua.`);
  if (dryRun) console.log('(dry run — no writes will be made)');

  let updated = 0;
  let missing = 0;
  for (const row of rows) {
    const titleUa = await fetchTitleUa(row.tmdb_id, row.content_type);
    if (titleUa) {
      updated++;
      console.log(`  [ua] ${row.title} -> ${titleUa}`);
      if (!dryRun) {
        await sql`UPDATE movies SET title_ua = ${titleUa}, updated_at = NOW() WHERE id = ${row.id}`;
      }
    } else {
      missing++;
      console.log(`  [skip] ${row.title}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`Done. ${updated} titles updated, ${missing} without a Ukrainian TMDb title.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
