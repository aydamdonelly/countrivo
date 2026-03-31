/**
 * Fixed topographic-line background that sits behind all page content.
 * Renders faint gold contour lines with one breathing highlight line.
 */
export function TopoBg() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg
        viewBox="0 0 430 1200"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          {/* Vertical gradient mask: transparent at top/bottom, visible in middle */}
          <linearGradient id="topo-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity={0} />
            <stop offset="20%" stopColor="white" stopOpacity={1} />
            <stop offset="80%" stopColor="white" stopOpacity={1} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
          <mask id="topo-mask">
            <rect width="430" height="1200" fill="url(#topo-fade)" />
          </mask>
        </defs>

        <g
          mask="url(#topo-mask)"
          fill="none"
          stroke="#c9a44c"
          strokeWidth={0.8}
          opacity={0.14}
        >
          {/* ~12 contour lines at varying y-positions (180–730) */}
          <path d="M0 180 Q80 160 160 185 T320 175 430 190" />
          <path d="M0 230 Q110 210 200 240 T380 225 430 235" />
          <path d="M0 300 Q60 280 140 310 T300 295 430 310" />
          <path d="M0 370 Q100 350 210 375 T360 360 430 380" />
          <path d="M0 420 Q70 400 180 425 T340 415 430 430" />
          <path d="M0 480 Q120 460 220 490 T380 475 430 490" />
          <path d="M0 530 Q90 510 190 535 T350 525 430 540" />
          <path d="M0 580 Q60 565 150 590 T310 575 430 590" />
          <path d="M0 630 Q100 610 200 640 T370 625 430 640" />
          <path d="M0 670 Q80 655 170 680 T340 665 430 680" />
          <path d="M0 710 Q110 695 210 720 T380 705 430 720" />
          <path d="M0 730 Q70 720 160 740 T320 725 430 740" />
        </g>

        {/* Breathing highlight line */}
        <path
          d="M0 460 Q100 440 200 465 T370 450 430 470"
          fill="none"
          stroke="#c9a44c"
          strokeWidth={1}
          mask="url(#topo-mask)"
        >
          <animate
            attributeName="opacity"
            values="0;0.3;0"
            dur="8s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );
}
