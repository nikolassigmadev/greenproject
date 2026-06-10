import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DS } from "@/styles/design-tokens";

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  label?: string;
  size?: number;
  ariaLabel?: string;
  /** "default" matches the page surface; "overlay" sits on top of imagery/hero. */
  variant?: "default" | "overlay";
}

/**
 * Unified back button used across every page.
 * - Circular, theme-aware, theme-tokenized.
 * - Falls back to `navigate(-1)` if no explicit destination is given.
 */
export function BackButton({
  to,
  onClick,
  size = 38,
  ariaLabel = "Back",
  variant = "default",
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick();
    if (to) return navigate(to);
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const isOverlay = variant === "overlay";

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: isOverlay ? "1px solid rgba(255,255,255,0.18)" : `1px solid ${DS.hair}`,
        background: isOverlay ? "rgba(20,18,16,0.55)" : DS.card,
        color: isOverlay ? "#ffffff" : DS.ink,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        flexShrink: 0,
        backdropFilter: isOverlay ? "blur(10px)" : "none",
        WebkitBackdropFilter: isOverlay ? "blur(10px)" : "none",
        boxShadow: isOverlay
          ? "0 4px 14px rgba(0,0,0,0.25)"
          : "0 1px 2px rgba(0,0,0,0.04)",
        transition: "transform 0.12s ease, background 0.12s ease",
        fontFamily: DS.font,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <ChevronLeft size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </button>
  );
}

export default BackButton;
