// Hook to fetch group members' calls for calendar view
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { handleRpcResponse } from '../utils/rpc';
import type { GroupCalendarDay, GroupMemberOnCall, GetGroupCallsCode } from '../types/group';
import type { ShiftType } from '../types/database';

// Error message mapping (1:1 with result codes)
const GET_GROUP_CALLS_MESSAGES: Record<GetGroupCallsCode, string> = {
  SUCCESS: '',
  UNAUTHORIZED: 'Please log in to view this group.',
  GROUP_NOT_FOUND: 'This group no longer exists.',
  NOT_A_MEMBER: 'You are not a member of this group.',
  INVALID_DATE_RANGE: 'Invalid date range selected.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate array of dates between start and end (inclusive)
function getDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

interface UseGroupCallsResult {
  calendarDays: GroupCalendarDay[];
  members: GroupMemberOnCall[];
  nextFreeDay: string | null;
  // For overlap calendar: date -> userId -> shiftType
  callsMap: Map<string, Map<string, ShiftType>>;
  loading: boolean;
  error: string | null;
  errorCode: GetGroupCallsCode | null;
  refreshCalls: () => Promise<void>;
}

export function useGroupCalls(
  groupId: string | undefined,
  _daysAhead?: number
): UseGroupCallsResult {
  const [calendarDays, setCalendarDays] = useState<GroupCalendarDay[]>([]);
  const [members, setMembers] = useState<GroupMemberOnCall[]>([]);
  const [nextFreeDay, setNextFreeDay] = useState<string | null>(null);
  const [callsMap, setCallsMap] = useState<Map<string, Map<string, ShiftType>>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<GetGroupCallsCode | null>(null);

  const loadCalls = useCallback(async () => {
    if (!groupId) {
      setCalendarDays([]);
      setMembers([]);
      setNextFreeDay(null);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      // Calculate date range: start of current month + 60 days forward (stays under 90 day RPC limit)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 60);

      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      // Call RPC
      const { data, error: rpcError } = await supabase.rpc('get_group_calls', {
        p_group_id: groupId,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
      });

      if (rpcError) throw rpcError;

      // Use centralized RPC response handling
      const result = handleRpcResponse<{
        code: string;
        members?: GroupMemberOnCall[];
        calls?: { user_id: string; call_date: string; shift_type?: string }[];
      }>(data);
      const code = result.code as GetGroupCallsCode;

      if (code !== 'SUCCESS') {
        setErrorCode(code);
        setError(GET_GROUP_CALLS_MESSAGES[code]);
        setCalendarDays([]);
        setMembers([]);
        setNextFreeDay(null);
        setCallsMap(new Map());
        return;
      }

      // Parse members and calls from RPC response
      const membersData: GroupMemberOnCall[] = result.members || [];
      const callsData: { user_id: string; call_date: string; shift_type?: string }[] = result.calls || [];

      // Build overlap calendar map: date -> userId -> shiftType
      const overlapMap = new Map<string, Map<string, ShiftType>>();
      for (const call of callsData) {
        if (!overlapMap.has(call.call_date)) {
          overlapMap.set(call.call_date, new Map());
        }
        if (call.shift_type) {
          overlapMap.get(call.call_date)!.set(call.user_id, call.shift_type as ShiftType);
        }
      }

      // Create member lookup map
      const memberMap = new Map<string, GroupMemberOnCall>();
      for (const member of membersData) {
        memberMap.set(member.user_id, member);
      }

      // Group calls by date
      const callsByDate = new Map<string, string[]>();
      for (const call of callsData) {
        const existing = callsByDate.get(call.call_date) || [];
        existing.push(call.user_id);
        callsByDate.set(call.call_date, existing);
      }

      // Generate calendar days
      const dateRange = getDateRange(today, endDate);
      const days: GroupCalendarDay[] = dateRange.map((dateStr) => {
        const userIds = callsByDate.get(dateStr) || [];
        const membersOnCall = userIds
          .map((id) => memberMap.get(id))
          .filter((m): m is GroupMemberOnCall => m !== undefined);

        return {
          date: dateStr,
          membersOnCall,
          isFree: membersOnCall.length === 0,
        };
      });

      // Find next free day
      const freeDay = days.find((day) => day.isFree);

      setMembers(membersData);
      setCalendarDays(days);
      setNextFreeDay(freeDay?.date || null);
      setCallsMap(overlapMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
      setErrorCode('UNKNOWN_ERROR');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  return {
    calendarDays,
    members,
    nextFreeDay,
    callsMap,
    loading,
    error,
    errorCode,
    refreshCalls: loadCalls,
  };
}
