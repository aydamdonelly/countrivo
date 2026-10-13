import { cn } from "@/lib/utils";

interface ClayProps {
  object: string;
  state?: string;
  alternate?: string;
  className?: string;
}

export function Clay({ object, state = "rest", alternate, className }: ClayProps) {
  return (
    <span className={cn("clay-object", alternate && "clay-animated", className)} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- small pre-sized local clay assets */}
      <img className="clay-still" src={`/clay/${object}/${state}.webp`} width={480} height={480} alt="" decoding="async" />
      {alternate ? (
        /* eslint-disable-next-line @next/next/no-img-element -- the second stop-motion frame */
        <img className="clay-motion-frame" src={`/clay/${object}/${alternate}.webp`} width={480} height={480} alt="" decoding="async" />
      ) : null}
    </span>
  );
}
