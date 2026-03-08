export function ElvishVineBorder({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 60"
      className={`w-full text-primary/15 ${className}`}
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Central vine */}
      <path
        d="M0 30 Q100 10 200 30 Q300 50 400 30 Q500 10 600 30 Q700 50 800 30 Q900 10 1000 30 Q1100 50 1200 30"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Upper flourishes */}
      <path
        d="M150 25 Q160 10 180 15 Q190 20 175 28"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M450 25 Q460 10 480 15 Q490 20 475 28"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M750 25 Q760 10 780 15 Q790 20 775 28"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M1050 25 Q1060 10 1080 15 Q1090 20 1075 28"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Lower flourishes */}
      <path
        d="M300 35 Q310 50 330 45 Q340 40 325 33"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M600 35 Q610 50 630 45 Q640 40 625 33"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M900 35 Q910 50 930 45 Q940 40 925 33"
        stroke="currentColor"
        strokeWidth="1"
      />
      {/* Diamond accents */}
      <path d="M595 26 L600 20 L605 26 L600 32 Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
