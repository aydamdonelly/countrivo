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

const COLOR_FRAMES = new Set([
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
