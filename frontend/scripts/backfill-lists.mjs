#!/usr/bin/env node
// One-off, manual data migration. NOT part of `npm run migrate` on purpose —
// it is tied to two specific real email addresses and is meant to run
// exactly once, by hand, after migrations 0004-0009 are applied and before
// the old personal columns are dropped from `movies` (see
// scripts/post-backfill-slim-movies.sql and README.md).
//
// It reads every existing row of `movies` (which, at this point in the
// rollout, still carries the old inna_rating/bogdan_rating/status/
// watch_date/comment_text columns) and:
//   1. upserts the owner and member as real `users` rows (by email —
//      google_sub stays NULL until they actually log in with Google),
//   2. creates one shared `lists` row + two `list_members` rows,
//   3. for each movie, creates a `list_movies` row (status/watch_date/
//      comment copied from the old row) plus up to two
//      `list_movie_ratings` rows (one per rating column).
//
// Safe to re-run: every insert is an upsert keyed on the same natural key,
// so running it twice does not create duplicates.
//
// Usage:
//   node --env-file=.env scripts/backfill-lists.mjs \
//     --owner-email=bohdan@example.com --owner-name="Bohdan" \
//     --member-email=inna@example.com  --member-name="Inna" \
//     --list-name="Bohdan & Inna"
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    const match = raw.match(/^--([a-z-]+)=(.*)$/);
    if (!match) continue;
    out[match[1]] = match[2];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const ownerEmail = args['owner-email'];
const ownerName = args['owner-name'] ?? null;
const memberEmail = args['member-email'];
const memberName = args['member-name'] ?? null;
const listName = args['list-name'] ?? 'Shared list';

if (!ownerEmail || !memberEmail) {
  console.error(
    'Usage: node --env-file=.env scripts/backfill-lists.mjs ' +
      '--owner-email=you@example.com --owner-name="You" ' +
      '--member-email=them@example.com --member-name="Them" ' +
      '[--list-name="Bohdan & Inna"]',
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Pass --env-file=.env or export it first.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function upsertUser(email, name) {
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    if (name) {
      await sql`UPDATE users SET name = ${name}, updated_at = NOW() WHERE id = ${existing[0].id}`;
    }
    return existing[0].id;
  }
  const id = randomUUID();
  await sql`INSERT INTO users (id, email, name) VALUES (${id}, ${email}, ${name})`;
  return id;
}

async function ensureList(ownerId, name) {
  const existing = await sql`
    SELECT id FROM lists WHERE owner_id = ${ownerId} AND name = ${name} LIMIT 1
  `;
  if (existing.length > 0) return existing[0].id;
  const id = randomUUID();
  await sql`INSERT INTO lists (id, owner_id, name) VALUES (${id}, ${ownerId}, ${name})`;
  return id;
}

async function ensureMember(listId, userId, role) {
  await sql`
    INSERT INTO list_members (id, list_id, user_id, role)
    VALUES (${randomUUID()}, ${listId}, ${userId}, ${role})
    ON CONFLICT (list_id, user_id) DO NOTHING
  `;
}

async function upsertListMovie(listId, movieId, status, watchDate, commentText, addedBy) {
  const rows = await sql`
    INSERT INTO list_movies (id, list_id, movie_id, status, watch_date, comment_text, added_by)
    VALUES (${randomUUID()}, ${listId}, ${movieId}, ${status}, ${watchDate}, ${commentText}, ${addedBy})
    ON CONFLICT (list_id, movie_id) DO UPDATE SET updated_at = NOW()
    RETURNING id
  `;
  return rows[0].id;
}

async function upsertRating(listMovieId, userId, rating, ratedBy) {
  if (rating == null) return;
  await sql`
    INSERT INTO list_movie_ratings (id, list_movie_id, user_id, rating, rated_by)
    VALUES (${randomUUID()}, ${listMovieId}, ${userId}, ${rating}, ${ratedBy})
    ON CONFLICT (list_movie_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
  `;
}

async function main() {
  const ownerId = await upsertUser(ownerEmail, ownerName);
  const memberId = await upsertUser(memberEmail, memberName);
  console.log(`Owner user:  ${ownerEmail} -> ${ownerId}`);
  console.log(`Member user: ${memberEmail} -> ${memberId}`);

  const listId = await ensureList(ownerId, listName);
  console.log(`List: "${listName}" -> ${listId}`);

  await ensureMember(listId, ownerId, 'owner');
  await ensureMember(listId, memberId, 'member');

  const movies = await sql`
    SELECT id, status, watch_date, comment_text, inna_rating, bogdan_rating
    FROM movies
  `;
  console.log(`Found ${movies.length} rows in movies to migrate.`);

  let listMovieCount = 0;
  let ratingCount = 0;
  for (const m of movies) {
    const listMovieId = await upsertListMovie(
      listId,
      m.id,
      m.status,
      m.watch_date,
      m.comment_text,
      ownerId,
    );
    listMovieCount++;
    if (m.bogdan_rating != null) {
      await upsertRating(listMovieId, ownerId, m.bogdan_rating, ownerId);
      ratingCount++;
    }
    if (m.inna_rating != null) {
      await upsertRating(listMovieId, memberId, m.inna_rating, ownerId);
      ratingCount++;
    }
  }

  console.log(`Created/updated ${listMovieCount} list_movies rows and ${ratingCount} list_movie_ratings rows.`);

  const [{ c: totalMovies }] = await sql`SELECT COUNT(*)::int AS c FROM movies`;
  const [{ c: totalListMovies }] = await sql`
    SELECT COUNT(*)::int AS c FROM list_movies WHERE list_id = ${listId}
  `;
  console.log(`Verify: movies=${totalMovies} vs list_movies(for this list)=${totalListMovies}`);
  if (totalMovies !== totalListMovies) {
    console.warn('Counts do not match — investigate before dropping old columns.');
  } else {
    console.log('Counts match. Safe to proceed to scripts/post-backfill-slim-movies.sql once both people have logged in via Google.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
