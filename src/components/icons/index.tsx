import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={24}
      height={24}
      {...props}
    >
      {children}
    </svg>
  );
}

/** 3 concentric circles – crosshair / target */
export function IconTarget(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={6} />
      <circle cx={12} cy={12} r={2} />
    </Icon>
  );
}

/** Balance scale */
export function IconScale(props: IconProps) {
  return (
    <Icon {...props}>
      {/* vertical pole */}
      <path d="M12 3v18" />
      {/* balance beam */}
      <path d="M4 7l8-4 8 4" />
      {/* left pan */}
      <path d="M4 7l-1 5h6L8 7" />
      {/* right pan */}
      <path d="M20 7l-1 5h-6l1-5" />
    </Icon>
  );
}

/** Two endpoints connected by a winding path */
export function IconPath(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx={5} cy={6} r={2} />
      <circle cx={19} cy={18} r={2} />
      <path d="M7 6h4c2 0 3 1 3 3v6c0 2 1 3 3 3h2" />
    </Icon>
  );
}

/** Lightning bolt */
export function IconBolt(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 2L4.5 13H12l-1 9L20 11H12l1-9z" />
    </Icon>
  );
}

/** Waving flag on a pole */
export function IconFlag(props: IconProps) {
  return (
    <Icon {...props}>
      {/* flagpole */}
      <path d="M4 22V2" />
      {/* waving flag */}
      <path d="M4 2c3-1 6 1 9 0s6-2 8 0v10c-2-2-5 0-8 1s-6-1-9 0" />
    </Icon>
  );
}

/** Two stacked chevron-right arrows */
export function IconChevronDouble(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="7 8 12 12 7 16" />
      <polyline points="13 8 18 12 13 16" />
    </Icon>
  );
}

/** 3 ascending bar chart rectangles */
export function IconBars(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x={4} y={14} width={4} height={6} rx={1} />
      <rect x={10} y={10} width={4} height={10} rx={1} />
      <rect x={16} y={4} width={4} height={16} rx={1} />
    </Icon>
  );
}

/** Map pin with highlight */
export function IconPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx={12} cy={9} r={2.5} />
    </Icon>
  );
}

/** Checkmark inside a rounded box */
export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x={3} y={3} width={18} height={18} rx={3} />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  );
}

/** Clock face with hands */
export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={10} />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

/** Magnifying glass with a minus line inside */
export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx={11} cy={11} r={7} />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6" />
    </Icon>
  );
}

/** Two linked chain links */
export function IconChain(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  );
}

/** Globe with equator and meridian */
export function IconGlobe(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx={12} cy={12} r={10} />
      {/* equator */}
      <path d="M2 12h20" />
      {/* meridian arc */}
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </Icon>
  );
}

/** Hash / number sign */
export function IconHash(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1={4} y1={9} x2={20} y2={9} />
      <line x1={4} y1={15} x2={20} y2={15} />
      <line x1={10} y1={3} x2={8} y2={21} />
      <line x1={16} y1={3} x2={14} y2={21} />
    </Icon>
  );
}

/** Small chevron-right arrow (16x16 viewBox) */
export function IconArrowRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      {...props}
    >
      <polyline points="6 3 11 8 6 13" />
    </svg>
  );
}

/** Two people — friends / social */
export function IconUsers(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

/** Single person — profile */
export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx={12} cy={7} r={4} />
    </Icon>
  );
}

/** Flame — streak. Pair with the amber/gold color at the call site. */
export function IconFlame(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Icon>
  );
}

/** Trophy cup — leaderboards / wins */
export function IconTrophy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Icon>
  );
}

/** Game controller — the games hub */
export function IconController(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1={6} x2={10} y1={11} y2={11} />
      <line x1={8} x2={8} y1={9} y2={13} />
      <line x1={15} x2={15.01} y1={12} y2={12} />
      <line x1={18} x2={18.01} y1={10} y2={10} />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </Icon>
  );
}

/** House — the Play tab (home). */
export function IconHome(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
    </Icon>
  );
}
