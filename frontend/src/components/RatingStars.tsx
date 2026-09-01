import { starFillFractions } from '../lib/ratingStars';

interface RatingStarsProps {
  score: number | null | undefined;
  className?: string;
}

export function RatingStars({ score, className }: RatingStarsProps) {
  const fills =
    score != null && !Number.isNaN(score) ? starFillFractions(score) : [0, 0, 0, 0, 0];

  return (
    <i className={`rating-stars${className ? ` ${className}` : ''}`} aria-hidden>
      {fills.map((fill, index) => (
        <span
          key={index}
          className="rating-star"
          style={{ ['--star-fill' as string]: `${fill * 100}%` }}
        >
          <span className="rating-star-base">★</span>
          <span className="rating-star-fill">★</span>
        </span>
      ))}
    </i>
  );
}
