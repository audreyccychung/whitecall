// Shift type definitions - single source of truth for display config
import type { ShiftType, WorkPattern } from '../types/database';

export interface ShiftTypeConfig {
  id: ShiftType;
  label: string;
  shortLabel: string;
  color: string;       // Hex color for calendar circles
  ringColor: string;   // Hex color for ring effect (darker shade)
  icon: string;        // Emoji icon for the picker
  workPattern: WorkPattern;
}

export const SHIFT_TYPES: ShiftTypeConfig[] = [
  // Call-based pattern
  {
    id: 'call',
    label: 'Call',
    shortLabel: 'Call',
    color: '#0ea5e9',
    ringColor: '#0284c7',
    icon: '🤍',
    workPattern: 'call',
  },
  {
    id: 'day_off',
    label: 'Day Off',
    shortLabel: 'Off',
    color: '#14b8a6',
    ringColor: '#0d9488',
    icon: '🏖️',
    workPattern: 'call',
  },
  {
    id: 'work',
    label: 'Full Day Work',
    shortLabel: 'Work',
    color: '#a855f7',
    ringColor: '#9333ea',
    icon: '💼',
    workPattern: 'call',
  },
  {
    id: 'half_day',
    label: 'Half Day',
    shortLabel: 'Half',
    color: '#f97316',
    ringColor: '#ea580c',
    icon: '⏰',
    workPattern: 'call',
  },
  // Shift-based pattern
  {
    id: 'am',
    label: 'AM Shift',
    shortLabel: 'AM',
    color: '#eab308',
    ringColor: '#ca8a04',
    icon: '🌅',
    workPattern: 'shift',
  },
  {
    id: 'pm',
    label: 'PM Shift',
    shortLabel: 'PM',
    color: '#0ea5e9',
    ringColor: '#0284c7',
    icon: '🌤️',
    workPattern: 'shift',
  },
  {
    id: 'night',
    label: 'Night Shift',
    shortLabel: 'Night',
    color: '#6366f1',
    ringColor: '#4f46e5',
    icon: '🌙',
    workPattern: 'shift',
  },
  {
    id: 'off',
    label: 'Off',
    shortLabel: 'Off',
    color: '#14b8a6',
    ringColor: '#0d9488',
    icon: '🏖️',
    workPattern: 'shift',
  },
];

// O(1) lookup by shift type id
export const SHIFT_TYPE_MAP: Record<ShiftType, ShiftTypeConfig> =
  Object.fromEntries(SHIFT_TYPES.map((st) => [st.id, st])) as Record<ShiftType, ShiftTypeConfig>;

// Get shift types for a given work pattern
export function getShiftTypesForPattern(pattern: WorkPattern): ShiftTypeConfig[] {
  return SHIFT_TYPES.filter((st) => st.workPattern === pattern);
}

// Check if a shift type is ratable based on work pattern
// Call-based: only 'call' type is ratable
// Shift-based: all shift types are ratable
export function isShiftRatable(shiftType: ShiftType, workPattern: WorkPattern): boolean {
  if (workPattern === 'shift') return true;
  return shiftType === 'call';
}

// Desaturated color for past dates - mixes toward gray while preserving hue identity
// Returns a muted version of the original hex color
export function getDesaturatedColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Mix 55% toward gray (160, 160, 160) to desaturate while keeping hue recognizable
  const mix = 0.55;
  const gray = 160;
  const dr = Math.round(r + (gray - r) * mix);
  const dg = Math.round(g + (gray - g) * mix);
  const db = Math.round(b + (gray - b) * mix);

  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}
