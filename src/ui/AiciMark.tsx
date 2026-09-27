// The Aici emblem from the Stitch mockup (aici_civic_emblem): a map pin with a check inside,
// drawn as SVG so it stays sharp and takes the text color in both themes.
export default function AiciMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path
        d="M16 29.5 6.6 19.4A11 11 0 1 1 25.4 19.4Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 16.2 14.8 19.6 21.4 11.8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
