import { Glyph, type GlyphProps } from "./glyph";
export function PlusIcon(p: GlyphProps) {
  return (
    <Glyph {...p} seedAt={[12, 12, 1.3]}>
      <path d="M12 5v14M5 12h14" />
    </Glyph>
  );
}
