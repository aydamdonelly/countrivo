'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { HostProps, PlayableSlug } from '@/games/types';

// Keep the split inside a client boundary: a server import alone groups every host.
const hosts: Record<PlayableSlug, ComponentType<HostProps>> = {
  'country-draft': dynamic(() => import('@/games/country-draft/host').then(module => module.CountryDraftHost)),
  'blind-pick': dynamic(() => import('@/games/blind-pick/host').then(module => module.BlindPickHost)),
  'higher-or-lower': dynamic(() => import('@/games/higher-or-lower/host').then(module => module.HigherOrLowerHost)),
  'geo-wordle': dynamic(() => import('@/games/geo-wordle/host').then(module => module.GeoWordleHost)),
  pinpoint: dynamic(() => import('@/games/pinpoint/host').then(module => module.PinpointHost)),
  'stat-guesser': dynamic(() => import('@/games/stat-guesser/host').then(module => module.StatGuesserHost)),
  'flag-quiz': dynamic(() => import('@/games/flag-quiz/host').then(module => module.FlagQuizHost)),
  'speed-flags': dynamic(() => import('@/games/speed-flags/host').then(module => module.SpeedFlagsHost)),
};

export function GameEntryHost(props: HostProps) {
  const Host = hosts[props.slug];
  return <Host {...props} />;
}
