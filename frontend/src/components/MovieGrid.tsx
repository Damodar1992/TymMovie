import type { Movie } from '../api/movies';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  onEdit: (movie: Movie) => void;
}

export function MovieGrid({ movies, onEdit }: MovieGridProps) {
  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onEdit={onEdit} />
      ))}
    </div>
  );
}

