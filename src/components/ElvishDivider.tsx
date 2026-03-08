export function ElvishDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <svg width="20" height="12" viewBox="0 0 20 12" className="text-primary/40">
        <path d="M0 6 L6 0 L10 4 L14 0 L20 6 L14 12 L10 8 L6 12 Z" fill="currentColor" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
}
