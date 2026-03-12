const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface EnrichedMetadata {
  title: string | null;
  originalTitle: string | null;
  imdbId: string | null;
  posterUrl: string | null;
  genres: string[] | null;
  imdbRating: number | null;
  year: number | null;
  source: 'tmdb';
  raw?: unknown;
}

export async function enrichByTitle(title: string): Promise<EnrichedMetadata | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey?.trim()) return null;

  const url = `${TMDB_BASE}/search/multi?${new URLSearchParams({
    query: title.trim(),
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  })}`;
  const searchRes = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' },
  });
  if (!searchRes.ok) return null;
  const searchData = (await searchRes.json()) as { results?: unknown[] };
  const results = Array.isArray(searchData?.results) ? searchData.results : [];
  const first = results[0] as Record<string, unknown> | undefined;
  if (!first) return null;

  const mediaType = (first.media_type as string) ?? 'movie';

  if (mediaType === 'movie') {
    const detailsRes = await fetch(`${TMDB_BASE}/movie/${first.id}?language=en-US`, {
      headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' },
    });
    if (!detailsRes.ok) return null;
    const details = (await detailsRes.json()) as { genres?: { name: string }[] };
    const posterPath = first.poster_path as string | undefined;
    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
    const releaseDate = first.release_date as string | undefined;
    const year =
      typeof releaseDate === 'string' && releaseDate.length >= 4 ? Number(releaseDate.slice(0, 4)) : null;
    const voteAvg = first.vote_average as number | undefined;
    const imdbRating = typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
    const genres = Array.isArray(details?.genres) ? details.genres.map((g) => g.name) : null;
    return {
      title: (first.title as string) ?? null,
      originalTitle: (first.original_title as string) ?? (first.title as string) ?? null,
      imdbId: null,
      posterUrl,
      genres,
      imdbRating,
      year,
      source: 'tmdb',
      raw: { search: searchData, details },
    };
  }

  if (mediaType === 'tv') {
    const detailsRes = await fetch(`${TMDB_BASE}/tv/${first.id}?language=en-US`, {
      headers: { Authorization: `Bearer ${apiKey}`, accept: 'application/json' },
    });
    if (!detailsRes.ok) return null;
    const details = (await detailsRes.json()) as { genres?: { name: string }[] };
    const posterPath = first.poster_path as string | undefined;
    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
    const firstAirDate = first.first_air_date as string | undefined;
    const year =
      typeof firstAirDate === 'string' && firstAirDate.length >= 4 ? Number(firstAirDate.slice(0, 4)) : null;
    const voteAvg = first.vote_average as number | undefined;
    const imdbRating = typeof voteAvg === 'number' ? Math.round(voteAvg * 10) / 10 : null;
    const genres = Array.isArray(details?.genres) ? details.genres.map((g) => g.name) : null;
    return {
      title: (first.name as string) ?? null,
      originalTitle: (first.original_name as string) ?? (first.name as string) ?? null,
      imdbId: null,
      posterUrl,
      genres,
      imdbRating,
      year,
      source: 'tmdb',
      raw: { search: searchData, details },
    };
  }

  return null;
}
