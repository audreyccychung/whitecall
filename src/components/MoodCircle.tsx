// Grayscale mood indicator circle
// white = best (4), black = worst (1), grays in between

interface MoodCircleProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

// Map score (1-4) to grayscale color
function getGrayscaleColor(score: number | null): string {
  if (score === null) return '#9ca3af'; // gray-400 for no data
  // Score 1 = black, Score 4 = white
  // Linear interpolation: 1->0%, 4->100%
  const percentage = ((score - 1) / 3) * 100;
  const gray = Math.round((percentage / 100) * 255);
  return `rgb(${gray}, ${gray}, ${gray})`;
}

export function MoodCircle({ score, size = 'md' }: MoodCircleProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const color = getGrayscaleColor(score);
  const borderColor = score !== null && score >= 3.5 ? '#d1d5db' : 'transparent'; // gray-300 border for white circles

  return (
    <span
      className={`inline-block rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: color,
        border: borderColor !== 'transparent' ? `1px solid ${borderColor}` : undefined,
      }}
      title={score !== null ? `Quality: ${score.toFixed(1)}/4` : 'No data'}
    />
  );
}
