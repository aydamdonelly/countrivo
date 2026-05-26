export function HeroGlobe() {
  return (
    <div className="relative w-[500px] h-[500px] lg:w-[600px] lg:h-[600px] xl:w-[700px] xl:h-[700px]">
      {/* Outer glow — gentle, on cream background */}
      <div className="absolute inset-0 rounded-full bg-gold-dim blur-3xl" />

      {/* Globe — strokes recoloured to ink-on-cream alpha per Bruckner */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Globe circle */}
        <circle cx="200" cy="200" r="180" stroke="rgba(26,26,26,0.10)" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="180" fill="rgba(26,26,26,0.015)" />

        {/* Latitude lines */}
        <ellipse cx="200" cy="200" rx="180" ry="60" stroke="rgba(26,26,26,0.08)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="180" ry="120" stroke="rgba(26,26,26,0.07)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="180" ry="160" stroke="rgba(26,26,26,0.06)" strokeWidth="0.8" />

        {/* Longitude lines */}
        <ellipse cx="200" cy="200" rx="60" ry="180" stroke="rgba(26,26,26,0.08)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="120" ry="180" stroke="rgba(26,26,26,0.07)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="160" ry="180" stroke="rgba(26,26,26,0.06)" strokeWidth="0.8" />

        {/* Equator + prime meridian — slightly stronger anchors */}
        <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(26,26,26,0.10)" strokeWidth="1" />
        <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(26,26,26,0.10)" strokeWidth="1" />

        {/* Three pulsing dots — yesterday · today · tomorrow */}
        {/* yesterday — faded, smaller */}
        <circle cx="140" cy="180" r="3" fill="var(--color-gold)" opacity="0.45">
          <animate attributeName="opacity" values="0.45;0.18;0.45" dur="4.5s" repeatCount="indefinite" />
        </circle>
        {/* today — bright, central */}
        <circle cx="200" cy="200" r="5" fill="var(--color-gold)" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.45;0.85" dur="3s" repeatCount="indefinite" />
        </circle>
        {/* tomorrow — anticipating, smaller */}
        <circle cx="260" cy="220" r="3" fill="var(--color-gold)" opacity="0.55">
          <animate attributeName="opacity" values="0.55;0.22;0.55" dur="3.6s" repeatCount="indefinite" />
        </circle>

        {/* Outer ring */}
        <circle cx="200" cy="200" r="185" stroke="rgba(184,134,11,0.18)" strokeWidth="0.5" strokeDasharray="4 6" />
      </svg>
    </div>
  );
}
