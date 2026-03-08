interface Props {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export function ElvishCornerOrnament({ position, className = "" }: Props) {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scale(-1, 1)",
    "bottom-left": "scale(1, -1)",
    "bottom-right": "scale(-1, -1)",
  };

  return (
    <svg
      viewBox="0 0 120 120"
      className={`w-20 h-20 md:w-28 md:h-28 text-primary/10 ${className}`}
      fill="none"
      style={{ transform: transforms[position] }}
    >
      <path
        d="M10 10 Q30 12 40 25 Q50 40 45 55 Q40 65 30 60 Q20 55 25 45 Q30 35 40 40"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M10 10 Q12 30 25 40 Q40 50 55 45 Q65 40 60 30 Q55 20 45 25 Q35 30 40 40"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M50 50 Q65 55 70 70 Q75 85 65 80 Q55 75 60 65"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
