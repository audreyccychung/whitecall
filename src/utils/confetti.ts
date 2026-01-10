// Confetti celebration utilities
import confetti from 'canvas-confetti';

export const celebrateFirstHeart = (): void => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export const celebrateOnboarding = (): void => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFB6C1', '#87CEEB', '#DDA0DD', '#98FB98'],
  });
};

export const celebrateStreak = (streakDays: number): void => {
  const particleCount = Math.min(streakDays * 10, 150);

  confetti({
    particleCount,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#ff6b6b', '#ffa500', '#ffff00'],
    shapes: ['circle'],
  });
};

export const miniCelebration = (): void => {
  confetti({
    particleCount: 30,
    spread: 40,
    origin: { y: 0.8 },
    colors: ['#FFB6C1', '#87CEEB'],
  });
};
