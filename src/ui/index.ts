/**
 * The Countrivo primitive set (blueprint section 3). Published by F0; later changes are
 * additive only. Composites live in src/features, boards in src/games.
 */
export type { Viewer, Clock, Mode, GameSlug, BoardTab, Tone } from "./types";
export { GAME_SLUGS, GUEST_VIEWER, AUTH_EVENT, isGameSlug, requestAuth, toneVar } from "./types";

export { Wordmark } from "./wordmark";
export { Countdown, formatCountdown, type CountdownProps } from "./countdown";
export { Streak, type StreakProps } from "./streak";
export { Header, TODAYS_DRAFT_HREF, type HeaderProps } from "./header";
export { Nav, NAV_ITEMS, type NavItem, type NavProps } from "./nav";
export { TabBar, hidesTabBar, type TabBarProps } from "./tab-bar";
export { FadeBar } from "./fade-bar";
export { ViewerSeed, type ViewerSeedProps } from "./viewer-seed";

export { ModeSwitch, ModePane, MODE_HELP, MODE_COOKIE, applyMode, writeModeCookie, type ModeSwitchProps, type ModePaneProps } from "./mode-switch";
export { AnchorCard, DRAFT_STEPS, type AnchorCardProps, type AnchorVariant, type AnchorResult } from "./anchor-card";
export { Board, shotsLabel, type BoardProps, type BoardData, type BoardRowWithRun, type FriendRowWithRun } from "./board";
export { BoardRowView, ScoreCell, type BoardRowViewProps } from "./board-row";
export { SectionHead, type SectionHeadProps } from "./section-head";
export { GameRow, type GameRowProps } from "./game-row";
export { GameList, type GameListProps } from "./game-list";
export { FriendsStrip, type FriendsStripProps, type StripFriend } from "./friends-strip";
export { Nudge, type NudgeProps } from "./nudge";
export { StreakWeek, type StreakWeekProps, type WeekDay } from "./streak-week";

export { Button, type ButtonProps, type ButtonVariant } from "./button";
export { Chip, type ChipProps } from "./chip";
export { Flag, FLAG_SIZES, type FlagProps, type FlagSize } from "./flag";
export { Crest, type CrestProps } from "./crest";
export { Mark, type MarkProps } from "./mark";
export { Flame, type FlameProps } from "./flame";
export { ConquestMap, CONQUEST_COUNTRIES, type ConquestMapProps } from "./conquest-map";

export { PlayBar, type PlayBarProps } from "./play-bar";
export { Progress, derivePips, MAX_PIPS, type ProgressProps, type PipState } from "./progress";
export { Subject, type SubjectProps, type PairSide } from "./subject";
export { Options, OptionButton, type OptionsProps, type OptionButtonProps, type OptionState } from "./options";
export { Slot, rankQuality, type SlotProps, type RankQuality } from "./slot";
export { Tile, GroupBand, type TileProps, type GroupBandProps, type GroupId } from "./tile";
export { Verdict, type VerdictProps, type VerdictTone } from "./verdict";
export { ResultPanel, failReasonText, type ResultPanelProps, type ResultRanks, type ResultMode } from "./result-panel";
export { JoinRow, type JoinRowProps } from "./join-row";
export { KeyHint } from "./key-hint";
export { NextDailies, type NextDailiesProps } from "./next-dailies";
export { ShareButton, type ShareButtonProps } from "./share-button";

export { Sheet, type SheetProps } from "./sheet";
export { AuthSheet, AUTH_ERROR_COPY, classifyAuthError, type AuthSheetProps, type AuthErrorKind, type AuthTab } from "./auth-sheet";
export { ToastProvider, useToast, type ToastMessage } from "./toast";
export { Field, type FieldProps } from "./field";
export { Select, type SelectProps } from "./select";
export { Suggest, type SuggestProps, type SuggestItem } from "./suggest";

export { Table, type TableProps, type TableColumn } from "./table";
export { RankTable, type RankTableProps, type RankRow } from "./rank-table";
export { StatRows, type StatRowsProps, type StatRow } from "./stat-rows";
export { PageTitle, type PageTitleProps } from "./page-title";
export { EditorialHead, type EditorialHeadProps } from "./editorial-head";
export { Prose, type ProseProps } from "./prose";
export { QaList, type QaListProps, type QaItem } from "./qa-list";
export { FactRow, type FactRowProps, type Fact } from "./fact-row";
export { SiteFoot } from "./site-foot";

export { Icon, ICONS, ICON_NAMES, type IconName, type IconProps, type GlyphProps, type IconColor } from "./icons";
export { StatIcon, STAT_ICONS, STAT_SLUGS, type StatIconProps, type StatSlug } from "./icons/stat";

// Added by P3 (additive): the counting number behind the result score, the reveal and the Draft rank.
export { CountUp, groupThousands, type CountUpProps, type CountUpKind } from "./count-up";
