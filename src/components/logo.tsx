export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[1em] w-[1em] shrink-0"
        strokeWidth={2}
      >
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" />
        <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-bold tracking-tight">heysash85</span>
      <span className="font-serif italic text-neutral-500">viral lab</span>
    </span>
  );
}
