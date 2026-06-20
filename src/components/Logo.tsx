import { DS } from "@/styles/design-tokens";

/**
 * GoodScan brand mark — a scan-frame (corner brackets) with a checkmark.
 * Theme-aware via CSS custom properties (set in index.css), so it paints the
 * correct colors on first render with no flash:
 *   --gs-bracket  → ink-black on light, white on dark
 *   --gs-green    → deep green on light, bright green on dark
 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GoodScan"
      role="img"
    >
      {/* Corner brackets (viewfinder frame) */}
      <g
        stroke="var(--gs-bracket, #0B0B0B)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13.4 L5 8 Q5 5 8 5 L13.4 5" />
        <path d="M34.6 5 L40 5 Q43 5 43 8 L43 13.4" />
        <path d="M43 34.6 L43 40 Q43 43 40 43 L34.6 43" />
        <path d="M13.4 43 L8 43 Q5 43 5 40 L5 34.6" />
      </g>
      {/* Checkmark */}
      <path
        d="M12.8 24.5 L21.2 33.4 L35.7 17.4"
        stroke="var(--gs-green, #1F7A4D)"
        strokeWidth={4.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * GoodScan wordmark — lowercase "goodscan" with the two-tone brand lockup:
 * "good" in the page ink color, "scan" in brand green. Pairs with <Logo />.
 */
export function Wordmark({
  fontSize = 16,
  className,
}: {
  fontSize?: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: DS.font,
        fontWeight: 800,
        fontSize,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "var(--ds-ink)" }}>good</span>
      <span style={{ color: "var(--gs-green, #1F7A4D)" }}>scan</span>
    </span>
  );
}
