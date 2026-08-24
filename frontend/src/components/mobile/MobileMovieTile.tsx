import type { CSSProperties } from 'react';
import type { Movie } from '../../api/movies';

type TitleLang = 'en' | 'ua';

interface MobileMovieTileProps {
  movie: Movie;
  titleLang: TitleLang;
  onSelect: (movie: Movie) => void;
}

const TILE_PALETTES = [
  ['#8b1e2d', '#4a1018'],
  ['#1f3f7a', '#122448'],
  ['#1a6a68', '#0e3838'],
  ['#6e2438', '#3a1420'],
  ['#9a4d18', '#4f280c'],
  ['#2a6a3a', '#153820'],
  ['#3a2a6e', '#1c1540'],
  ['#7a3a18', '#3f1c0c'],
] as const;

function displayTitle(movie: Movie, titleLang: TitleLang) {
  return titleLang === 'ua' && movie.titleUa?.trim() ? movie.titleUa : movie.title;
}

function tilePalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TILE_PALETTES[hash % TILE_PALETTES.length];
}

function formatScore(value: number | null | undefined) {
  return value != null && !Number.isNaN(value) ? value.toFixed(1) : '—';
}

export function MobileMovieTile({
  movie,
  titleLang,
  onSelect,
}: MobileMovieTileProps) {
  const title = displayTitle(movie, titleLang);
  const [from, to] = tilePalette(movie.id);
  const statusClass = movie.status === 'WATCHED' ? 'is-watched' : 'is-planned';
  const artStyle = {
    '--tile-from': from,
    '--tile-to': to,
  } as CSSProperties;

  return (
    <article
      className="mobile-movie-tile"
      onClick={() => onSelect(movie)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(movie);
        }
      }}
      aria-label={title}
    >
      <div className="mobile-movie-tile-art" style={artStyle}>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt="" loading="lazy" draggable={false} />
        ) : null}
        <div className="mobile-movie-tile-scrim" aria-hidden />
        <span className="mobile-movie-tile-score">{formatScore(movie.userAvgRating)}</span>
        <span
          className={`mobile-movie-tile-dot ${statusClass}`}
          aria-label={movie.status === 'WATCHED' ? 'Watched' : 'Planned'}
        />
        <div className="mobile-movie-tile-title-block">
          <h2>{title}</h2>
          {!movie.posterUrl ? <small>poster</small> : null}
        </div>
      </div>

      <div className="mobile-movie-tile-meta">
        <span className="mobile-movie-tile-year">{movie.releaseYear ?? '—'}</span>
        <div className="mobile-movie-tile-avatars" aria-label="Ratings">
          {movie.tmdbRating != null ? (
            <span className="is-tmdb" title={`TMDB ${movie.tmdbRating.toFixed(1)}`}>
              T
            </span>
          ) : null}
          {movie.innaRating != null ? (
            <span className="is-inna" title={`Inna ${movie.innaRating.toFixed(1)}`}>
              I
            </span>
          ) : null}
          {movie.bogdanRating != null ? (
            <span className="is-bohdan" title={`Bohdan ${movie.bogdanRating.toFixed(1)}`}>
              B
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
