// Shift type definitions - single source of truth for display config
import type { ShiftType, WorkPattern } from '../types/database';

export interface ShiftTypeConfig {
  id: ShiftType;
  label: string;
  shortLabel: string;
  color: string;        // Pastel hex color for backgrounds (picker, legend, upcoming list)
  accentColor: string;  // Deeper color for calendar left-edge accent
  ringColor: string;    // Darker shade for selection rings
  icon: string;         // Emoji icon for the picker
  workPattern: WorkPattern;
}

export const SHIFT_TYPES: ShiftTypeConfig[] = [
  // Call-based pattern
  {
    id: 'call',
    label: 'Call',
    shortLabel: 'Call',
    color: '#7dd3fc',
    accentColor: '#38bdf8',
    ringColor: '#0284c7',
    icon: '🤍',
    workPattern: 'call',
  },
  {
    id: 'day_off',
    label: 'Day Off',
    shortLabel: 'Off',
    color: '#5eead4',
    accentColor: '#2dd4bf',
    ringColor: '#0d9488',
    icon: '🏖️',
    workPattern: 'call',
  },
  {
    id: 'work',
    label: 'Full Day Work',
    shortLabel: 'Work',
    color: '#c084fc',
    accentColor: '#a855f7',
    ringColor: '#9333ea',
    icon: '💼',
    workPattern: 'call',
  },
  {
    id: 'half_day',
    label: 'Half Day',
    shortLabel: 'Half',
    color: '#fdba74',
    accentColor: '#fb923c',
    ringColor: '#ea580c',
    icon: '⏰',
    workPattern: 'call',
  },
  // Shift-based pattern
  {
    id: 'am',
    label: 'AM Shift',
    shortLabel: 'AM',
    color: '#fde047',
    accentColor: '#eab308',
    ringColor: '#ca8a04',
    icon: '🌅',
    workPattern: 'shift',
  },
  {
    id: 'pm',
    label: 'PM Shift',
    shortLabel: 'PM',
    color: '#7dd3fc',
    accentColor: '#38bdf8',
    ringColor: '#0284c7',
    icon: '🌤️',
    workPattern: 'shift',
  },
  {
    id: 'night',
    label: 'Night Shift',
    shortLabel: 'Night',
    color: '#a5b4fc',
    accentColor: '#818cf8',
    ringColor: '#4f46e5',
    icon: '🌙',
    workPattern: 'shift',
  },
  {
    id: 'off',
    label: 'Off',
    shortLabel: 'Off',
    color: '#5eead4',
    accentColor: '#2dd4bf',
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

// Shift types that count as "on call" (person needs support)
// Must match backend filter: shift_type IN ('call', 'am', 'pm', 'night')
const ON_DUTY_SHIFT_TYPES = new Set<ShiftType>(['call', 'am', 'pm', 'night']);

// Check if a shift type counts as "on call" (eligible for hearts, shows in groups)
export function isOnDutyShift(shiftType: ShiftType): boolean {
  return ON_DUTY_SHIFT_TYPES.has(shiftType);
}

// Check if a shift type is ratable based on work pattern
// Call-based: only 'call' type is ratable
// Shift-based: all shift types are ratable
export function isShiftRatable(shiftType: ShiftType, workPattern: WorkPattern): boolean {
  if (workPattern === 'shift') return true;
  return shiftType === 'call';
}

// Returns accentColor with 35% opacity for past day left-edge accents
export function getPastAccentColor(accentColor: string): string {
  return accentColor + '59';
}
