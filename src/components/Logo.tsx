import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function Logo({ size = 26 }: { size?: number }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount, default to light to avoid flash
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GoodScan"
      role="img"
    >
      {/* Green circle */}
      <circle cx="50" cy="50" r="42" fill="#1F7A4D" />
      {/* Leaf — white on light, lighter green on dark for contrast */}
      <path
        d="M50 24 C70 34 72 58 50 74 C28 58 30 34 50 24 Z"
        fill={isDark ? "#0D4A2B" : "#FFFFFF"}
      />
      {/* Stem line */}
      <path
        d="M50 27 L50 73"
        stroke={isDark ? "#1F7A4D" : "#FFFFFF"}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
