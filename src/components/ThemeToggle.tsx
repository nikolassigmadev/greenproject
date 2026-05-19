import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { DS } from "@/styles/design-tokens";

const modes = ["light", "dark", "system"] as const;
const icons = { light: Sun, dark: Moon, system: Monitor };
const labels = { light: "Light", dark: "Dark", system: "System" };

export function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: DS.radius.sm,
        border: `1px solid ${DS.hair}`,
        overflow: "hidden",
        ...style,
      }}
    >
      {modes.map((mode) => {
        const Icon = icons[mode];
        const active = theme === mode;
        return (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            aria-label={`Switch to ${labels[mode]} mode`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: DS.font,
              background: active ? DS.ink : "transparent",
              color: active ? DS.card : DS.muted,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <Icon style={{ width: 16, height: 16 }} />
            <span>{labels[mode]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggleCompact() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 18,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: DS.muted,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Icon style={{ width: 20, height: 20 }} />
    </button>
  );
}
