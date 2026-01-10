// Haptic and sound feedback utilities

// Haptic feedback (vibration on mobile)
export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' = 'medium'): void => {
  if (!navigator.vibrate) {
    return; // Vibration API not supported
  }

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
  };

  navigator.vibrate(patterns[pattern]);
};

// Sound feedback
const soundCache: Map<string, HTMLAudioElement> = new Map();

export const playSound = (soundName: 'heart-sent' | 'heart-received' | 'success', volume = 0.5): void => {
  try {
    // Create audio element if not cached
    if (!soundCache.has(soundName)) {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = volume;
      soundCache.set(soundName, audio);
    }

    const audio = soundCache.get(soundName);
    if (audio) {
      // Clone and play to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = volume;
      clone.play().catch(err => {
        // Silently fail if user hasn't interacted with page yet
        console.debug('Audio play failed:', err);
      });
    }
  } catch (error) {
    console.debug('Sound playback error:', error);
  }
};

// Combined feedback for actions
export const triggerActionFeedback = (
  type: 'heart-sent' | 'heart-received' | 'success',
  settings?: { sound_enabled?: boolean; haptic_enabled?: boolean }
): void => {
  const { sound_enabled = true, haptic_enabled = true } = settings || {};

  if (haptic_enabled) {
    triggerHaptic('medium');
  }

  if (sound_enabled) {
    playSound(type, 0.4);
  }
};
