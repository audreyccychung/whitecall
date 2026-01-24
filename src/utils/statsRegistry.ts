/**
 * Centralized stat definitions - single source of truth for labels and formatting.
 *
 * Each surface (UI cards, share cards) selects which stats to display,
 * but all formatting and labels come from here.
 */

// Mood score to emoji mapping - moon phases (dark to bright)
function getMoodEmoji(score: number | null): string {
  if (score === null) return '-';
  if (score >= 3.5) return '🌕'; // White call - full moon
  if (score >= 2.5) return '🌖'; // Mostly bright
  if (score >= 1.5) return '🌘'; // Mostly dark
  return '🌑'; // Black call - new moon
}

export interface StatDefinition {
  label: string;
  format: (value: number | null) => string;
  emoji?: string;
}

export const STAT_DEFINITIONS = {
  calls: {
    label: 'Calls',
    format: (v: number | null) => (v ?? 0).toString(),
  },
  heartsReceived: {
    label: 'Hearts',
    format: (v: number | null) => (v ?? 0).toString(),
    emoji: '🤍',
  },
  avgSleep: {
    label: 'Avg Sleep',
    format: (v: number | null) => (v === null ? '-' : `${v.toFixed(1)}h`),
  },
  avgMood: {
    label: 'Avg Mood',
    format: getMoodEmoji,
  },
  avgSupport: {
    label: 'Avg Support',
    format: (v: number | null) => (v === null ? '-' : `${v.toFixed(1)} 🤍`),
  },
  streak: {
    label: 'Streak',
    format: (v: number | null) => (v ?? 0).toString(),
    emoji: '🔥',
  },
} as const satisfies Record<string, StatDefinition>;

export type StatKey = keyof typeof STAT_DEFINITIONS;

/**
 * Helper to get formatted stat value
 */
export function formatStat(key: StatKey, value: number | null): string {
  return STAT_DEFINITIONS[key].format(value);
}

/**
 * Helper to get stat label
 */
export function getStatLabel(key: StatKey): string {
  return STAT_DEFINITIONS[key].label;
}

/**
 * Helper to get stat emoji (if defined)
 */
export function getStatEmoji(key: StatKey): string | undefined {
  const def = STAT_DEFINITIONS[key] as StatDefinition;
  return def.emoji;
}

// Re-export getMoodEmoji for components that need it directly
export { getMoodEmoji };
