import type { ApiRequest, ApiResponse } from '../../_lib/types.js';
import { describeError } from '../../_lib/types.js';
import { requireUser } from '../../_lib/auth.js';
import { catalogDb } from '../../_lib/db.js';
import { searchMulti } from '../../_lib/tmdb.js';
import { buildPosterUrl } from '../../_lib/tmdb.js';

/** Catalog-first search — see db-multi-user-architecture doc §6. We only
 *  ever call TMDb when the local catalog doesn't already have enough to
 *  show, so a title that's been added once by anyone, in any list, is
 *  free for every user after that. */
const MIN_LOCAL_RESULTS = 5;

function firstQueryValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export interface SearchResultDto {
  movieId: string | null;
  inCatalog: boolean;
  tmdbId: number | null;
  contentType: 'MOVIE' | 'TV';
  title: string;
  originalTitle: string | null;
  year: number | null;
  posterUrl: string | null;
  tmdbRating: number | null;
  genres: string[] | null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const user = requireUser(req, res);
  if (!user) return;

  const q = firstQueryValue(req.query.q);
  const contentType = firstQueryValue(req.query.contentType) as 'MOVIE' | 'TV' | undefined;
  const language = firstQueryValue(req.query.language) || 'uk-UA';
  if (!q || !q.trim()) {
    res.status(200).json({ results: [] });
    return;
  }

  try {
    const local = await catalogDb.search(q, contentType, 20);
    const localResults: SearchResultDto[] = local.map((m) => ({
      movieId: m.id,
      inCatalog: true,
      tmdbId: m.tmdbId,
      contentType: m.contentType,
      title: m.title,
      originalTitle: m.originalTitle,
      year: m.releaseYear,
      posterUrl: m.posterUrl,
      tmdbRating: m.tmdbRating,
      genres: m.genres,
    }));

    let results = localResults;
    if (localResults.length < MIN_LOCAL_RESULTS) {
      const knownTmdbIds = new Set(
        localResults.filter((r) => r.tmdbId != null).map((r) => `${r.contentType}-${r.tmdbId}`),
      );
      const external = await searchMulti(q, language);
      const externalMapped: SearchResultDto[] = external
        .filter((r) => !knownTmdbIds.has(`${r.contentType}-${r.tmdbId}`))
        .filter((r) => (contentType ? r.contentType === contentType : true))
        .map((r) => ({
          movieId: null,
          inCatalog: false,
          tmdbId: r.tmdbId,
          contentType: r.contentType,
          title: r.title,
          originalTitle: null,
          year: r.year,
          posterUrl: buildPosterUrl(r.posterPath, 'w342'),
          tmdbRating: r.tmdbRating,
          genres: r.genres,
        }));
      results = [...localResults, ...externalMapped];
    }

    res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: describeError(err, 'Search failed') });
  }
}
