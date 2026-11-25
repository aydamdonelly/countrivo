import { cn } from "@/lib/utils";
import "./clay.css";

interface ClayProps {
  object: string;
  state?: string;
  alternate?: string;
  className?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  tone?: 'original' | 'monochrome' | 'color';
}

export const COLOR_FRAMES: ReadonlySet<string> = new Set([
  'cl-01/coins', 'cl-02/pressed', 'cl-03/deep',
  'cl-07/flip', 'cl-04/level', 'cl-06/slide',
]);

export function Clay({ object, state = "rest", alternate, className, sizes = '(min-width: 1024px) 200px, 120px', loading = 'lazy', tone = 'original' }: ClayProps) {
  const frameName = (frame: string) => tone === 'color' && COLOR_FRAMES.has(`${object}/${frame}`) ? `${frame}-color` : frame;
  const still = frameName(state);
  const motion = alternate ? frameName(alternate) : undefined;
  const sources = (frame: string) => [128, 256, 480].map(width => `/clay/${object}/${frame}${width === 480 ? '' : `.${width}`}.webp ${width}w`).join(', ');
  return (
    <span className={cn("clay-object", alternate && "clay-animated", className)} data-clay-tone={tone} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- small pre-sized local clay assets */}
      <img className="clay-still" src={`/clay/${object}/${still}.webp`} srcSet={sources(still)} sizes={sizes} loading={loading} width={480} height={480} alt="" decoding="async" />
      {motion ? (
        /* eslint-disable-next-line @next/next/no-img-element -- the second stop-motion frame */
        <img className="clay-motion-frame" src={`/clay/${object}/${motion}.webp`} srcSet={sources(motion)} sizes={sizes} loading={loading} width={480} height={480} alt="" decoding="async" />
      ) : null}
    </span>
  );
}

/**
 * A game's clay on its tiles and rows (25 November 2026): the generated colour frame wherever one
 * exists, so a game you have not played yet looks as inviting as one you finished. Games without
 * a colour frame show their own rest frame in its original tone, never a grayscale filter.
 */
export function gameClayFrame(object: string, done: string): { state: string; tone: 'original' | 'color' } {
  if (COLOR_FRAMES.has(`${object}/${done}`)) return { state: done, tone: 'color' };
  return { state: object === 'cl-08' ? 'full' : 'rest', tone: 'original' };
}
