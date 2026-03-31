export function HeroGlobe() {
  return (
    <div className="relative w-[500px] h-[500px] lg:w-[600px] lg:h-[600px] xl:w-[700px] xl:h-[700px]">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gold-dim blur-3xl" />

      {/* Globe */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Globe circle */}
        <circle cx="200" cy="200" r="180" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="180" fill="rgba(255,255,255,0.02)" />

        {/* Latitude lines */}
        <ellipse cx="200" cy="200" rx="180" ry="60" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="180" ry="120" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="180" ry="160" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />

        {/* Longitude lines */}
        <ellipse cx="200" cy="200" rx="60" ry="180" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="120" ry="180" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
        <ellipse cx="200" cy="200" rx="160" ry="180" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />

        {/* Equator - slightly brighter */}
        <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Prime meridian */}
        <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Pulsing dots representing countries */}
        <circle cx="140" cy="140" r="4" fill="#c9a44c" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="160" r="3" fill="#c9a44c" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="180" cy="230" r="5" fill="#c9a44c" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.25;0.7" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="280" cy="210" r="3.5" fill="#c9a44c" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="280" r="4" fill="#c9a44c" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="4.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="140" r="3" fill="#c9a44c" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="120" cy="190" r="3.5" fill="#c9a44c" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="4.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="230" cy="280" r="3" fill="#c9a44c" opacity="0.45">
          <animate attributeName="opacity" values="0.45;0.1;0.45" dur="3.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="310" cy="260" r="4" fill="#c9a44c" opacity="0.55">
          <animate attributeName="opacity" values="0.55;0.2;0.55" dur="4.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="240" r="2.5" fill="#c9a44c" opacity="0.35">
          <animate attributeName="opacity" values="0.35;0.1;0.35" dur="5.5s" repeatCount="indefinite" />
        </circle>

        {/* Connecting arcs between some dots */}
        <path d="M140,140 Q200,100 250,160" stroke="rgba(201,164,76,0.15)" strokeWidth="1" fill="none" />
        <path d="M180,230 Q240,200 280,210" stroke="rgba(201,164,76,0.12)" strokeWidth="1" fill="none" />
        <path d="M250,160 Q300,190 310,260" stroke="rgba(201,164,76,0.1)" strokeWidth="1" fill="none" />
        <path d="M120,190 Q150,230 160,280" stroke="rgba(201,164,76,0.1)" strokeWidth="1" fill="none" />

        {/* Outer ring */}
        <circle cx="200" cy="200" r="185" stroke="rgba(201,164,76,0.1)" strokeWidth="0.5" strokeDasharray="4 6" />
      </svg>
    </div>
  );
}
