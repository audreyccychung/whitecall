import { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { shareImage } from '../utils/share';

interface UseShareCardReturn {
  cardRef: React.RefObject<HTMLDivElement | null>;
  isGenerating: boolean;
  error: string | null;
  generateAndShare: () => Promise<void>;
  generateAndDownload: () => Promise<void>;
}

export function useShareCard(): UseShareCardReturn {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      setIsGenerating(true);
      setError(null);

      // Generate PNG at 2x for retina
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        quality: 0.95,
      });

      const response = await fetch(dataUrl);
      return await response.blob();
    } catch (err) {
      setError('Failed to generate image');
      console.error('[ShareCard] Generation failed:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateAndShare = useCallback(async () => {
    const blob = await generateImage();
    if (blob) {
      await shareImage(blob, `whitecall-recap-${Date.now()}.png`);
    }
  }, [generateImage]);

  const generateAndDownload = useCallback(async () => {
    const blob = await generateImage();
    if (blob) {
      await shareImage(blob, `whitecall-recap-${Date.now()}.png`);
    }
  }, [generateImage]);

  return {
    cardRef,
    isGenerating,
    error,
    generateAndShare,
    generateAndDownload,
  };
}
