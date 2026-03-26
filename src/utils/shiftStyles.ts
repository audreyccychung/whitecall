// Shared shift cell styling for overlap calendars (1-on-1 and group)
import type { ShiftType } from '../types/database';
import { SHIFT_TYPE_MAP } from '../constants/shiftTypes';

export function getShiftCellStyle(shiftType: ShiftType | undefined, isPast: boolean): React.CSSProperties {
  if (!shiftType) {
    return { backgroundColor: isPast ? '#f9fafb' : '#f3f4f6' };
  }
  const config = SHIFT_TYPE_MAP[shiftType];
  if (!config) return { backgroundColor: '#f3f4f6' };

  if (isPast) {
    return {
      backgroundColor: config.color + '40',
      boxShadow: `inset 2px 0 0 0 ${config.accentColor}60`,
    };
  }
  return {
    backgroundColor: config.color,
    boxShadow: `inset 2px 0 0 0 ${config.accentColor}`,
  };
}
