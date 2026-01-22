// ICS file generator for calendar export
import type { Call } from '../types/database';

/**
 * Generates an ICS (iCalendar) file content for a list of calls.
 * Uses stable UIDs based on call IDs for calendar app compatibility.
 *
 * Note: Each call is a single-day event. Consecutive days will appear as
 * separate events in the calendar (not merged into multi-day events).
 */
export function generateICS(calls: Call[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WhiteCall//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const call of calls) {
    // Stable UID based on call ID - ensures calendar apps can update events
    const uid = `whitecall-${call.id}@whitecall.app`;

    // Convert YYYY-MM-DD to YYYYMMDD for ICS format (all-day event)
    const dateValue = call.call_date.replace(/-/g, '');

    // DTSTAMP in UTC format (required by ICS spec)
    const now = new Date();
    const dtstamp = formatICSDate(now);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dateValue}`,
      `DTEND;VALUE=DATE:${dateValue}`,
      'SUMMARY:Call',
      'DESCRIPTION:Scheduled call with a loved one',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  // Ensure trailing CRLF per RFC 5545
  return lines.join('\r\n') + '\r\n';
}

/**
 * Formats a Date object to ICS datetime format (UTC)
 */
function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Downloads an ICS file to the user's device
 */
export function downloadICS(calls: Call[], filename = 'whitecall-upcoming.ics'): void {
  const content = generateICS(calls);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
