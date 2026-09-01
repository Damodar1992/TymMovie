/** Builds a watchable YouTube link from a TMDb video `key`. See
 *  api/_lib/tmdb.ts pickBestTrailerKey() for how the key is chosen. */
export function youtubeTrailerUrl(key: string): string {
  return `https://www.youtube.com/watch?v=${key}`;
}
