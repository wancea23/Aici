// The Aici logo: a round "a" whose middle is the marked spot. The letter takes the text color,
// so it follows the theme; the dot stays amber. Same drawing as src/app/icon.svg.
export default function AiciMark({ className }: { className?: string }) {
  return (
    <svg viewBox="10 17.5 38 38" fill="none" aria-hidden="true" className={className}>
      <circle cx="29" cy="36" r="14" stroke="currentColor" strokeWidth="7" />
      <path d="M43 22v29" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <circle cx="29" cy="36" r="4.5" fill="#f59e0b" />
    </svg>
  );
}
