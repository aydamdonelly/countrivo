import { Glyph, type GlyphProps } from "./glyph";

/*
 * The five Country Draft seats, drawn as the furniture and the instruments they are named
 * for: a chair, a pennant planted in the ground, a purse, a lectern, a desk. House rules
 * (blueprint 4.1): 24 grid, 2 px round stroke, no fill, one filled seed. None of them is a
 * redrawn icon-pack glyph, and none of them sits in a tile.
 */

/** The Chair: runs the room. */
export function ChairIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 7.6, 1.3]}>
      <path d="M7.5 4.6h9v6h-9z" />
      <path d="M5.4 10.6h13.2" />
      <path d="M7.6 10.6v8.8M16.4 10.6v8.8" />
    </Glyph>
  );
}

/** The Field: takes ground. */
export function FieldIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12.8, 8.2, 1.2]}>
      <path d="M4 19.4h16" />
      <path d="M8.6 19.4V4.2" />
      <path d="M8.6 4.8h7.8l-2.3 3.4 2.3 3.4H8.6" />
    </Glyph>
  );
}

/** The Purse: pays for it. */
export function PurseIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 14.8, 1.4]}>
      <path d="M6 10h12l1.4 9.4H4.6z" />
      <path d="M9 10V7.6a3 3 0 0 1 6 0V10" />
    </Glyph>
  );
}

/** The Voice: sells it. A lectern, never a megaphone and never a speaker cone. */
export function VoiceIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 18.4, 1.3]}>
      <path d="M5.2 10.2l13.6-3.4v3.2L5.2 13.4z" />
      <path d="M12 13.8v4.4" />
      <path d="M7.4 18.4h9.2" />
    </Glyph>
  );
}

/**
 * The Desk: makes it hold. A pedestal desk with its drawers, so it never reads as the
 * chair at 22 px: the chair carries a box above its line, the desk carries one below.
 */
export function DeskIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[15.8, 15.6, 1.2]}>
      <path d="M3.4 8.6h17.2" />
      <path d="M5.8 8.6v10" />
      <path d="M12.6 8.8v9.8h6v-9.8" />
      <path d="M12.6 12.6h6" />
    </Glyph>
  );
}

export const SEAT_ICONS = [ChairIcon, FieldIcon, PurseIcon, VoiceIcon, DeskIcon] as const;

/** The seat mark for seat 0 to 4, bare on the row. */
export function SeatIcon({ seat, ...p }: GlyphProps & { seat: number }) {
  const Mark = SEAT_ICONS[seat] ?? ChairIcon;
  return <Mark {...p} />;
}
