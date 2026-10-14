/*
 * Server lookup for codecs and run details. GameEntryHost splits each interactive game
 * at the client boundary while preserving its server-rendered first board.
 */
import type { ComponentType } from "react";
import type { HostProps, PlayableSlug, RunDetailProps } from "./types";

import { GameEntryHost } from '@/features/play/game-entry-host';

import { codec as countryDraftCodec } from "./country-draft/codec";
import { codec as blindPickCodec } from "./blind-pick/codec";
import { codec as higherOrLowerCodec } from "./higher-or-lower/codec";
import { codec as pinpointCodec } from "./pinpoint/codec";
import { codec as geoWordleCodec } from "./geo-wordle/codec";
import { codec as statGuesserCodec } from "./stat-guesser/codec";
import { codec as flagQuizCodec } from "./flag-quiz/codec";
import { codec as speedFlagsCodec } from "./speed-flags/codec";

import { RunDetail as CountryDraftDetail } from "./country-draft/run-detail";
import { RunDetail as BlindPickDetail } from "./blind-pick/run-detail";
import { RunDetail as HigherOrLowerDetail } from "./higher-or-lower/run-detail";
import { RunDetail as PinpointDetail } from "./pinpoint/run-detail";
import { RunDetail as GeoWordleDetail } from "./geo-wordle/run-detail";
import { RunDetail as StatGuesserDetail } from "./stat-guesser/run-detail";
import { RunDetail as FlagQuizDetail } from "./flag-quiz/run-detail";
import { RunDetail as SpeedFlagsDetail } from "./speed-flags/run-detail";

/** The client host of every playable game, keyed by slug. */
export const HOSTS: Record<PlayableSlug, ComponentType<HostProps>> = {
  "country-draft": GameEntryHost,
  "blind-pick": GameEntryHost,
  "higher-or-lower": GameEntryHost,
  "geo-wordle": GameEntryHost,
  "pinpoint": GameEntryHost,
  "stat-guesser": GameEntryHost,
  "flag-quiz": GameEntryHost,
  "speed-flags": GameEntryHost,
};

/** Each game's log decoder, so the play page can discard a cookie the codec rejects (blueprint 8.6). */
export const CODECS: Record<PlayableSlug, { dec(s: string): unknown }> = {
  "country-draft": countryDraftCodec,
  "blind-pick": blindPickCodec,
  "higher-or-lower": higherOrLowerCodec,
  "geo-wordle": geoWordleCodec,
  "pinpoint": pinpointCodec,
  "stat-guesser": statGuesserCodec,
  "flag-quiz": flagQuizCodec,
  "speed-flags": speedFlagsCodec,
};

/** The run page rows per game (blueprint 7.7): a module's own or the GenericDetail. Server components. */
export const RUN_DETAILS: Record<PlayableSlug, ComponentType<RunDetailProps>> = {
  "country-draft": CountryDraftDetail,
  "blind-pick": BlindPickDetail,
  "higher-or-lower": HigherOrLowerDetail,
  "geo-wordle": GeoWordleDetail,
  "pinpoint": PinpointDetail,
  "stat-guesser": StatGuesserDetail,
  "flag-quiz": FlagQuizDetail,
  "speed-flags": SpeedFlagsDetail,
};

export const PLAYABLE_SLUGS = Object.keys(HOSTS) as PlayableSlug[];

export function isPlayable(slug: string): slug is PlayableSlug {
  return Object.prototype.hasOwnProperty.call(HOSTS, slug);
}
