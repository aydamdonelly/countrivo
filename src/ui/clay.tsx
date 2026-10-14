import { cn } from "@/lib/utils";

interface ClayProps {
  object: string;
  state?: string;
  alternate?: string;
  className?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
}

export function Clay({ object, state = "rest", alternate, className, sizes = '(min-width: 1024px) 200px, 120px', loading = 'lazy' }: ClayProps) {
  const sources = (frame: string) => [128, 256, 480].map(width => `/clay/${object}/${frame}${width === 480 ? '' : `.${width}`}.webp ${width}w`).join(', ');
  return (
    <span className={cn("clay-object", alternate && "clay-animated", className)} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- small pre-sized local clay assets */}
      <img className="clay-still" src={`/clay/${object}/${state}.webp`} srcSet={sources(state)} sizes={sizes} loading={loading} width={480} height={480} alt="" decoding="async" />
      {alternate ? (
        /* eslint-disable-next-line @next/next/no-img-element -- the second stop-motion frame */
        <img className="clay-motion-frame" src={`/clay/${object}/${alternate}.webp`} srcSet={sources(alternate)} sizes={sizes} loading={loading} width={480} height={480} alt="" decoding="async" />
      ) : null}
    </span>
  );
}
