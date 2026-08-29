/*
 * The server-only registry (blueprint 8.1): the 17 host entries imported statically. A
 * server-side map of client components costs nothing on the client: the browser fetches
 * only the chunk of the host that appears in the RSC payload, so each board stays its own
 * chunk. Append-only: each P4 package owns its one line per map. Never import this from a
 * client component.
 */
import type { ComponentType } from "react";
import type { HostProps, PlayableSlug, RunDetailProps } from "./types";

import { CountryDraftHost } from "./country-draft/host";
import { HigherOrLowerHost } from "./higher-or-lower/host";
import { GeoWordleHost } from "./geo-wordle/host";
import { ClusterHost } from "./cluster/host";
import { StatGuesserHost } from "./stat-guesser/host";
import { RiskZoneHost } from "./risk-zone/host";
import { FlagQuizHost } from "./flag-quiz/host";
import { CapitalMatchHost } from "./capital-match/host";
import { PopulationSortHost } from "./population-sort/host";
import { CountryStreakHost } from "./country-streak/host";
import { BorderBuddiesHost } from "./border-buddies/host";
import { ContinentSprintHost } from "./continent-sprint/host";
import { OddOneOutHost } from "./odd-one-out/host";
import { SpeedFlagsHost } from "./speed-flags/host";
import { SupremacyHost } from "./supremacy/host";
import { BorderlineHost } from "./borderline/host";
import { BlitzHost } from "./blitz/host";

import { codec as countryDraftCodec } from "./country-draft/codec";
import { codec as higherOrLowerCodec } from "./higher-or-lower/codec";
import { codec as geoWordleCodec } from "./geo-wordle/codec";
import { codec as clusterCodec } from "./cluster/codec";
import { codec as statGuesserCodec } from "./stat-guesser/codec";
import { codec as riskZoneCodec } from "./risk-zone/codec";
import { codec as flagQuizCodec } from "./flag-quiz/codec";
import { codec as capitalMatchCodec } from "./capital-match/codec";
import { codec as populationSortCodec } from "./population-sort/codec";
import { codec as countryStreakCodec } from "./country-streak/codec";
import { codec as borderBuddiesCodec } from "./border-buddies/codec";
import { codec as continentSprintCodec } from "./continent-sprint/codec";
import { codec as oddOneOutCodec } from "./odd-one-out/codec";
import { codec as speedFlagsCodec } from "./speed-flags/codec";
import { codec as supremacyCodec } from "./supremacy/codec";
import { codec as borderlineCodec } from "./borderline/codec";
import { codec as blitzCodec } from "./blitz/codec";

import { RunDetail as CountryDraftDetail } from "./country-draft/run-detail";
import { RunDetail as HigherOrLowerDetail } from "./higher-or-lower/run-detail";
import { RunDetail as GeoWordleDetail } from "./geo-wordle/run-detail";
import { RunDetail as ClusterDetail } from "./cluster/run-detail";
import { RunDetail as StatGuesserDetail } from "./stat-guesser/run-detail";
import { RunDetail as RiskZoneDetail } from "./risk-zone/run-detail";
import { RunDetail as FlagQuizDetail } from "./flag-quiz/run-detail";
import { RunDetail as CapitalMatchDetail } from "./capital-match/run-detail";
import { RunDetail as PopulationSortDetail } from "./population-sort/run-detail";
import { RunDetail as CountryStreakDetail } from "./country-streak/run-detail";
import { RunDetail as BorderBuddiesDetail } from "./border-buddies/run-detail";
import { RunDetail as ContinentSprintDetail } from "./continent-sprint/run-detail";
import { RunDetail as OddOneOutDetail } from "./odd-one-out/run-detail";
import { RunDetail as SpeedFlagsDetail } from "./speed-flags/run-detail";
import { RunDetail as SupremacyDetail } from "./supremacy/run-detail";
import { RunDetail as BorderlineDetail } from "./borderline/run-detail";
import { RunDetail as BlitzDetail } from "./blitz/run-detail";

/** The client host of every playable game, keyed by slug. */
export const HOSTS: Record<PlayableSlug, ComponentType<HostProps>> = {
  "country-draft": CountryDraftHost,
  "higher-or-lower": HigherOrLowerHost,
  "geo-wordle": GeoWordleHost,
  cluster: ClusterHost,
  "stat-guesser": StatGuesserHost,
  "risk-zone": RiskZoneHost,
  "flag-quiz": FlagQuizHost,
  "capital-match": CapitalMatchHost,
  "population-sort": PopulationSortHost,
  "country-streak": CountryStreakHost,
  "border-buddies": BorderBuddiesHost,
  "continent-sprint": ContinentSprintHost,
  "odd-one-out": OddOneOutHost,
  "speed-flags": SpeedFlagsHost,
  supremacy: SupremacyHost,
  borderline: BorderlineHost,
  blitz: BlitzHost,
};

/** Each game's log decoder, so the play page can discard a cookie the codec rejects (blueprint 8.6). */
export const CODECS: Record<PlayableSlug, { dec(s: string): unknown }> = {
  "country-draft": countryDraftCodec,
  "higher-or-lower": higherOrLowerCodec,
  "geo-wordle": geoWordleCodec,
  cluster: clusterCodec,
  "stat-guesser": statGuesserCodec,
  "risk-zone": riskZoneCodec,
  "flag-quiz": flagQuizCodec,
  "capital-match": capitalMatchCodec,
  "population-sort": populationSortCodec,
  "country-streak": countryStreakCodec,
  "border-buddies": borderBuddiesCodec,
  "continent-sprint": continentSprintCodec,
  "odd-one-out": oddOneOutCodec,
  "speed-flags": speedFlagsCodec,
  supremacy: supremacyCodec,
  borderline: borderlineCodec,
  blitz: blitzCodec,
};

/** The run page rows per game (blueprint 7.7): a module's own or the GenericDetail. Server components. */
export const RUN_DETAILS: Record<PlayableSlug, ComponentType<RunDetailProps>> = {
  "country-draft": CountryDraftDetail,
  "higher-or-lower": HigherOrLowerDetail,
  "geo-wordle": GeoWordleDetail,
  cluster: ClusterDetail,
  "stat-guesser": StatGuesserDetail,
  "risk-zone": RiskZoneDetail,
  "flag-quiz": FlagQuizDetail,
  "capital-match": CapitalMatchDetail,
  "population-sort": PopulationSortDetail,
  "country-streak": CountryStreakDetail,
  "border-buddies": BorderBuddiesDetail,
  "continent-sprint": ContinentSprintDetail,
  "odd-one-out": OddOneOutDetail,
  "speed-flags": SpeedFlagsDetail,
  supremacy: SupremacyDetail,
  borderline: BorderlineDetail,
  blitz: BlitzDetail,
};

export const PLAYABLE_SLUGS = Object.keys(HOSTS) as PlayableSlug[];

export function isPlayable(slug: string): slug is PlayableSlug {
  return Object.prototype.hasOwnProperty.call(HOSTS, slug);
}
