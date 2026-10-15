'use client';

import { useState } from 'react';
import { activityWeek, EMPTY_ACTIVITY, withCompletedDay, type DailyActivity } from '@/lib/daily-activity';
import { CheckIcon } from './icons/check';
import './daily-habit.css';

interface DailyHabitProps {
  dateKey: string;
  activity?: DailyActivity;
  completed?: boolean;
}

function calendarFile(time: string): string {
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

export function DailyHabit({ dateKey, activity = EMPTY_ACTIVITY, completed = true }: DailyHabitProps) {
  const progress = completed ? withCompletedDay(activity, dateKey) : activity;
  const week = activityWeek(dateKey);
  const played = new Set(progress.days);
  const count = week.filter(day => played.has(day)).length;
  const [time, setTime] = useState('18:00');
  const [downloaded, setDownloaded] = useState(false);
  if (!progress.played) return null;
  function remind() {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    const url = URL.createObjectURL(new Blob([calendarFile(time)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'countrivo-daily.ics'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }
  return <section className="daily-habit" aria-label="Your daily progress on this browser">
    <div className="habit-heading"><b>{count} {count === 1 ? 'day' : 'days'} this week</b><small>Best {progress.best} {progress.best === 1 ? 'day' : 'days'}</small></div>
    <ol className="habit-week">{week.map((day, index) => <li key={day} className={played.has(day) ? 'played' : day > dateKey ? 'future' : undefined} aria-current={day === dateKey ? 'date' : undefined}>
      <span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span><span className="habit-stamp" aria-label={`${day}: ${played.has(day) ? 'played' : day > dateKey ? 'upcoming' : 'not played'}`}>{played.has(day) ? <CheckIcon size={18} /> : <span aria-hidden="true">·</span>}</span>
    </li>)}</ol>
    <div className="habit-footer"><small>One daily game counts.</small><details><summary>Remind me</summary><div className="habit-reminder"><label>Local time<input type="time" value={time} onChange={event => { setTime(event.target.value); setDownloaded(false); }} /></label><button className="btn btn-quiet" onClick={remind}>Add to calendar</button><p className="t-meta" role="status">{downloaded ? 'Open the calendar file to choose and save your reminder.' : 'A daily reminder in your calendar. You can remove it there.'}</p></div></details></div>
  </section>;
}
