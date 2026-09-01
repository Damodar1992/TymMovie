#!/usr/bin/env node
// One-off backfill: fills `movies.trailer_key` for rows that were cached
// before the trailer-link feature shipped (see the project's
// trailer-link-feature doc). Safe to re-run — it only touches rows where
// trailer_key IS NULL, and a title with genuinely no TMDb trailer will
// keep re-checking on every run (there's no "checked, found nothing"
// marker yet — acceptable for a one-off script over a small catalog).
//
// Usage:
//   node --env-file=.env scripts/backfill-trailers.mjs [--dry-run]
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
const DELAY_MS = 120; // stay well under TMDb's rate limit between requests

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mirrors pickBestTrailerKey() in api/_lib/tmdb.ts — kept as plain JS here
// since this script runs standalone via `node`, not through the TS build.
function pickBestTrailerKey(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  const youtube = videos.filter((v) => v.site === 'YouTube' && v.key);
  if (youtube.length === 0) return null;

  const byRecency = (a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? '');

  const pickOfType = (type) => {
    const ofType = youtube.filter((v) => v.type === type);
    if (ofType.length === 0) return null;
    const official = ofType.filter((v) => v.official);
    const pool = official.length > 0 ? official : ofType;
    return [...pool].sort(byRecency)[0] ?? null;
  };

  const best = pickOfType('Trailer') ?? pickOfType('Teaser');
  return best?.key ?? null;
}

async function fetchTrailerKey(tmdbId, contentType) {
  const kind = contentType === 'TV' ? 'tv' : 'movie';
  const url =
    `${TMDB_BASE}/${kind}/${tmdbId}?append_to_response=videos` +
    `&include_video_language=en,uk,null`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tmdbApiKey}`, accept: 'application/json' },
  });
  if (!res.ok) {
    console.warn(`  TMDb ${res.status} for ${kind}/${tmdbId}`);
    return null;
  }
  const data = await res.json();
  return pickBestTrailerKey(data.videos?.results);
}

async function main() {
  const rows = await sql`
    SELECT id, tmdb_id, content_type, title
    FROM movies
    WHERE tmdb_id IS NOT NULL AND trailer_key IS NULL
    ORDER BY title
  `;
  console.log(`Found ${rows.length} catalog rows without a trailer_key.`);
  if (dryRun) console.log('(dry run — no writes will be made)');

  let found = 0;
  let missing = 0;
  for (const row of rows) {
    const key = await fetchTrailerKey(row.tmdb_id, row.content_type);
    if (key) {
      found++;
      console.log(`  [trailer] ${row.title} -> ${key}`);
      if (!dryRun) {
        await sql`UPDATE movies SET trailer_key = ${key}, updated_at = NOW() WHERE id = ${row.id}`;
      }
    } else {
      missing++;
      console.log(`  [none]    ${row.title}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`Done. ${found} trailers found, ${missing} titles with no usable TMDb trailer.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
