// Lucide 1.0 removed all trademarked brand icons (see
// https://lucide.dev/guide/react/migration), so there is no `Instagram`
// export in lucide-react anymore. This is a hand-drawn stand-in built to
// match lucide's own geometry (24x24 viewBox, round caps/joins, 1.75
// default stroke) so it sits visually flush with the rest of the icon set.
export function InstagramIcon({
  className,
  strokeWidth = 1.75,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37a4 4 0 1 1-7.914 1.174A4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
