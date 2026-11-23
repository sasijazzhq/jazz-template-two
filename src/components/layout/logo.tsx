/** Icon-only steaming-bowl mark. Decorative next to the wordmark. */
export function BowlMark({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 64 64">
      <g fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round">
        <path d="M24 22c-3-4 3-6 0-10" />
        <path d="M32 22c-3-4 3-6 0-10" />
        <path d="M40 22c-3-4 3-6 0-10" />
      </g>
      <path d="M10 30h44c0 12-8 20-22 20S10 42 10 30z" fill="var(--primary)" />
      <rect x="24" y="50" width="16" height="4" rx="2" fill="var(--green)" />
      <path d="M8 28h48" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <BowlMark />
      <span className="text-[20px] font-bold tracking-tight text-green">
        Rusi <span className="text-primary dark:text-green">AI</span>
      </span>
    </span>
  );
}
