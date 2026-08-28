import { createElement } from "react";
import type { GlyphProps } from "./glyph";
import { Flame } from "@/ui/flame";
import { HomeIcon } from "./home";
import { TrophyIcon } from "./trophy";
import { UsersIcon } from "./users";
import { UserIcon } from "./user";
import { GlobeIcon } from "./globe";
import { ClockIcon } from "./clock";
import { CrownIcon } from "./crown";
import { BoltIcon } from "./bolt";
import { PlayIcon } from "./play";
import { TargetIcon } from "./target";
import { MedalIcon } from "./medal";
import { ChevronRightIcon } from "./chevron-right";
import { ChevronLeftIcon } from "./chevron-left";
import { ChevronDownIcon } from "./chevron-down";
import { ArrowUpIcon } from "./arrow-up";
import { ArrowDownIcon } from "./arrow-down";
import { ArrowUpRightIcon } from "./arrow-up-right";
import { CheckIcon } from "./check";
import { CrossIcon } from "./cross";
import { UndoIcon } from "./undo";
import { SearchIcon } from "./search";
import { CopyIcon } from "./copy";
import { PlusIcon } from "./plus";
import { MinusIcon } from "./minus";
import { CloseIcon } from "./close";
import { SoundIcon } from "./sound";
import { SoundOffIcon } from "./sound-off";
import { LockIcon } from "./lock";
import { PinIcon } from "./pin";
import { TimerIcon } from "./timer";
import { HashIcon } from "./hash";

export type { GlyphProps, IconColor } from "./glyph";
export {
  HomeIcon, TrophyIcon, UsersIcon, UserIcon, GlobeIcon, ClockIcon, CrownIcon, BoltIcon, PlayIcon, TargetIcon,
  MedalIcon, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpRightIcon,
  CheckIcon, CrossIcon, UndoIcon, SearchIcon, CopyIcon, PlusIcon, MinusIcon, CloseIcon, SoundIcon, SoundOffIcon,
  LockIcon, PinIcon, TimerIcon, HashIcon,
};

/** The flame is the only filled icon; it is always ember with a paper core, so colour props are ignored. */
function FlameIcon({ size = 22, className }: GlyphProps) {
  return createElement(Flame, { size, className });
}

export const ICONS = {
  home: HomeIcon,
  trophy: TrophyIcon,
  users: UsersIcon,
  user: UserIcon,
  globe: GlobeIcon,
  clock: ClockIcon,
  crown: CrownIcon,
  bolt: BoltIcon,
  play: PlayIcon,
  target: TargetIcon,
  medal: MedalIcon,
  "chevron-right": ChevronRightIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-down": ChevronDownIcon,
  "arrow-up": ArrowUpIcon,
  "arrow-down": ArrowDownIcon,
  "arrow-up-right": ArrowUpRightIcon,
  check: CheckIcon,
  cross: CrossIcon,
  undo: UndoIcon,
  search: SearchIcon,
  copy: CopyIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  close: CloseIcon,
  sound: SoundIcon,
  "sound-off": SoundOffIcon,
  lock: LockIcon,
  pin: PinIcon,
  timer: TimerIcon,
  hash: HashIcon,
  flame: FlameIcon,
} as const;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export interface IconProps extends GlyphProps {
  name: IconName;
}

/** `<Icon name size=22 color="currentColor" seed=color />` (blueprint 4.1). */
export function Icon({ name, ...rest }: IconProps) {
  return createElement(ICONS[name], rest);
}
