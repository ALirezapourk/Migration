export function ElvishArch({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 500"
      className={`text-primary/20 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main arch structure */}
      <path
        d="M80 480 L80 200 Q80 80 200 40 Q320 80 320 200 L320 480"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Inner arch */}
      <path
        d="M110 480 L110 210 Q110 110 200 70 Q290 110 290 210 L290 480"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Pointed top ornament */}
      <path
        d="M200 20 L200 40"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="200" cy="16" r="3" stroke="currentColor" strokeWidth="1" fill="none" />

      {/* Top trefoil / knotwork */}
      <path
        d="M170 100 Q180 70 200 65 Q220 70 230 100"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M160 120 Q175 85 200 78 Q225 85 240 120"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="200" cy="95" r="8" stroke="currentColor" strokeWidth="1" fill="none" />

      {/* Left vine scrollwork */}
      <path
        d="M80 350 Q50 330 60 300 Q70 270 95 280 Q110 290 100 310 Q90 330 80 320"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M80 280 Q55 260 65 235 Q75 210 95 220 Q105 230 100 245"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />

      {/* Right vine scrollwork */}
      <path
        d="M320 350 Q350 330 340 300 Q330 270 305 280 Q290 290 300 310 Q310 330 320 320"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M320 280 Q345 260 335 235 Q325 210 305 220 Q295 230 300 245"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />

      {/* Base ornaments */}
      <path
        d="M80 480 Q90 465 100 470 Q110 475 100 480"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M320 480 Q310 465 300 470 Q290 475 300 480"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />

      {/* Corner flourishes */}
      <path
        d="M30 30 Q60 35 55 60 Q50 80 35 70 Q25 55 40 50"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M370 30 Q340 35 345 60 Q350 80 365 70 Q375 55 360 50"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
