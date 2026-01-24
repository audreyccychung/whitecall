// Rating icon - renders grayscale circles for call ratings
// Black (worst) → Dark gray → Light gray → White (best)
import type { CallRatingValue } from '../types/database';
import { RATING_COLORS } from '../types/database';

interface RatingIconProps {
  rating: CallRatingValue;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function RatingIcon({ rating, size = 'md', className = '' }: RatingIconProps) {
  const color = RATING_COLORS[rating];
  const sizeClass = SIZE_CLASSES[size];

  // White needs a border to be visible on white backgrounds
  const needsBorder = rating === 'great' || rating === 'good';

  return (
    <span
      className={`inline-block rounded-full ${sizeClass} ${className}`}
      style={{
        backgroundColor: color,
        border: needsBorder ? '1.5px solid #d1d5db' : 'none',
        boxShadow: rating === 'great' ? '0 0 0 1px #e5e7eb' : 'none',
      }}
      role="img"
      aria-label={`${rating} rating`}
    />
  );
}

// For places that need a numeric score (1-4) instead of rating value
export function RatingIconByScore({ score, size = 'md', className = '' }: { score: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const ratings: CallRatingValue[] = ['rough', 'okay', 'good', 'great'];
  const rating = ratings[Math.min(Math.max(score - 1, 0), 3)];
  return <RatingIcon rating={rating} size={size} className={className} />;
}
