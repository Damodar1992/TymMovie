import type { Movie } from '../api/movies';
import { MovieCard } from './MovieCard';

type TitleLang = 'en' | 'ua';

interface MovieGridProps {
  movies: Movie[];
  titleLang: TitleLang;
  onEdit: (movie: Movie) => void;
  onSelect?: (movie: Movie) => void;
}

export function MovieGrid({ movies, titleLang, onEdit, onSelect }: MovieGridProps) {
  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          titleLang={titleLang}
          onEdit={onEdit}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

