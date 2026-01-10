// Component that triggers confetti when first heart is received
import { useEffect, useRef } from 'react';
import { celebrateFirstHeart } from '../utils/confetti';

interface FirstHeartConfettiProps {
  heartCount: number;
}

export function FirstHeartConfetti({ heartCount }: FirstHeartConfettiProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (heartCount === 1 && !hasTriggered.current) {
      hasTriggered.current = true;
      celebrateFirstHeart();
    }
  }, [heartCount]);

  return null;
}
