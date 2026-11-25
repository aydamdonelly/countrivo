/** The optional local calendar reminder (an ICS file the player imports). No server involved. */

export function validReminderTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function calendarFile(time: string): string {
  const next = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}T${pad(hours)}${pad(minutes)}00`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Countrivo//Daily game//EN', 'BEGIN:VEVENT',
    `UID:countrivo-daily-${Date.now()}@countrivo.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
    `DTSTART:${start}`, 'DURATION:PT2M', 'RRULE:FREQ=DAILY', 'SUMMARY:Your daily geography game',
    'DESCRIPTION:One game is enough. Play at https://countrivo.com', 'URL:https://countrivo.com',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Your daily geography game', 'TRIGGER:PT0M',
    'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}


/** Builds the daily ICS file for `time` (local, HH:MM) and hands it to the browser as a download. */
export function downloadReminder(time: string): void {
  const url = URL.createObjectURL(new Blob([calendarFile(time)], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'countrivo-daily.ics'; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
