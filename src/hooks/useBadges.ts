// Simple badge calculation - no DB writes, just derived from profile stats
// Badges: First Heart, 7-Day Streak, 50 Hearts Sent

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
}

interface BadgeInput {
  totalHeartsSent: number;
  currentStreak: number;
  longestStreak: number;
}

export function useBadges(input: BadgeInput): Badge[] {
  const { totalHeartsSent, currentStreak, longestStreak } = input;

  return [
    {
      id: 'first_heart',
      name: 'First Heart',
      emoji: '🤍',
      description: 'Send your first heart',
      earned: totalHeartsSent >= 1,
    },
    {
      id: 'streak_7',
      name: '7-Day Streak',
      emoji: '🔥',
      description: 'Maintain a 7-day streak',
      earned: currentStreak >= 7 || longestStreak >= 7,
    },
    {
      id: 'hearts_50',
      name: '50 Hearts',
      emoji: '💝',
      description: 'Send 50 hearts total',
      earned: totalHeartsSent >= 50,
    },
  ];
}
