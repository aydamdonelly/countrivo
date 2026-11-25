'use client';

import { useState } from 'react';
import { activityWeek, EMPTY_ACTIVITY, withCompletedDay, type DailyActivity } from '@/lib/daily-activity';
import { CheckIcon } from './icons/check';
import { downloadReminder, validReminderTime } from '@/lib/reminder-calendar';
import './daily-habit.css';

interface DailyHabitProps {
  dateKey: string;
  activity?: DailyActivity;
  completed?: boolean;
  /** The calendar reminder; the result page has its own Remind me next to the countdown. */
  reminder?: boolean;
}

export function DailyHabit({ dateKey, activity = EMPTY_ACTIVITY, completed = true, reminder = true }: DailyHabitProps) {
  const progress = completed ? withCompletedDay(activity, dateKey) : activity;
  const week = activityWeek(dateKey);
  const played = new Set(progress.days);
  const count = week.filter(day => played.has(day)).length;
  const [time, setTime] = useState('18:00');
  const [downloaded, setDownloaded] = useState(false);
  if (!progress.played) return null;
  function remind() {
    if (!validReminderTime(time)) return;
    downloadReminder(time);
    setDownloaded(true);
  }
  return <section className="daily-habit" aria-label="Your daily progress on this browser">
    <div className="habit-heading"><b>{count} {count === 1 ? 'day' : 'days'} this week</b><small>Best {progress.best} {progress.best === 1 ? 'day' : 'days'}</small></div>
    <ol className="habit-week">{week.map((day, index) => <li key={day} className={played.has(day) ? 'played' : day > dateKey ? 'future' : undefined} aria-current={day === dateKey ? 'date' : undefined}>
      <span>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span><span className="habit-stamp" aria-label={`${day}: ${played.has(day) ? 'played' : day > dateKey ? 'upcoming' : 'not played'}`}>{played.has(day) ? <CheckIcon size={18} /> : null}</span>
    </li>)}</ol>
    <div className="habit-footer"><small>One daily game counts.</small>{reminder ? <details><summary>Remind me</summary><div className="habit-reminder"><label>Local time<input type="time" value={time} onChange={event => { setTime(event.target.value); setDownloaded(false); }} /></label><button className="btn btn-secondary" onClick={remind}>Add to calendar</button><p className="t-meta" role="status">{downloaded ? 'Open the calendar file to choose and save your reminder.' : 'A daily reminder in your calendar. You can remove it there.'}</p></div></details> : null}</div>
  </section>;
}
