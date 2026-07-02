import { AlertTriangle, HelpCircle } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import type { DietaryCheck } from "@/utils/dietaryPreferences";

/**
 * Product-page warning when a product conflicts with the user's declared
 * dietary needs. Hard conflicts ("contains milk") render red; uncertain ones
 * ("may contain traces of peanuts") render amber. When the product has no
 * ingredient data at all, a quiet note says we couldn't check.
 */
export function DietaryConflictBanner({ check }: { check: DietaryCheck }) {
  if (check.noData) {
    return (
      <div style={{
        display: "flex", gap: 10, alignItems: "center",
        background: DS.bg, borderRadius: 14, padding: "11px 14px",
        border: `1px solid ${DS.hair}`,
      }}>
        <HelpCircle style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: DS.muted, lineHeight: 1.4 }}>
          No ingredient data for this product — we couldn't check it against your dietary needs.
        </div>
      </div>
    );
  }

  if (check.conflicts.length === 0) return null;

  const hard = check.conflicts.some((c) => c.level === "contains");
  const color = hard ? DS.bad : DS.warn;
  const bg = hard ? DS.badBg : DS.warnBg;

  return (
    <div style={{
      background: bg, borderRadius: 14, padding: "14px 16px",
      display: "flex", gap: 12, alignItems: "flex-start",
      border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 99, background: color, color: DS.card,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1,
      }}>
        <AlertTriangle style={{ width: 13, height: 13 }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: DS.ink, lineHeight: 1.3 }}>
          {hard ? "Doesn't match your dietary needs" : "May not match your dietary needs"}
        </div>
        <div style={{ fontSize: 12, color: DS.ink2, marginTop: 3, lineHeight: 1.5 }}>
          {check.conflicts.map((c) => c.message).join(" · ")}
        </div>
      </div>
    </div>
  );
}
