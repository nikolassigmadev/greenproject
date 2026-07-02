import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import {
  loadDietaryPrefs, saveDietaryPrefs, DIET_OPTIONS, ALLERGEN_OPTIONS,
  DIETARY_EVENT, type DietaryPrefs, type DietKey, type AllergenKey,
} from "@/utils/dietaryPreferences";

function Chip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "7px 12px", borderRadius: 999,
        border: `1px solid ${active ? DS.good : DS.hair}`,
        background: active ? DS.goodBg : DS.bg,
        color: active ? DS.ink : DS.muted,
        fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: DS.font,
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
    >
      {active && <Check size={12} strokeWidth={3} style={{ color: DS.good }} />}
      {label}
    </button>
  );
}

/**
 * Card for editing the user's dietary needs (diets + allergens). Persists on
 * every toggle, matching the priorities pattern — no save button.
 */
export function DietaryEditor() {
  const [prefs, setPrefs] = useState<DietaryPrefs>(() => loadDietaryPrefs());

  useEffect(() => {
    const refresh = () => setPrefs(loadDietaryPrefs());
    window.addEventListener(DIETARY_EVENT, refresh);
    return () => window.removeEventListener(DIETARY_EVENT, refresh);
  }, []);

  const toggleDiet = (key: DietKey) => {
    const diets = prefs.diets.includes(key)
      ? prefs.diets.filter((d) => d !== key)
      : [...prefs.diets, key];
    saveDietaryPrefs({ ...prefs, diets });
  };

  const toggleAllergen = (key: AllergenKey) => {
    const allergens = prefs.allergens.includes(key)
      ? prefs.allergens.filter((a) => a !== key)
      : [...prefs.allergens, key];
    saveDietaryPrefs({ ...prefs, allergens });
  };

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 2 }}>
        Dietary needs
      </div>
      <div style={{ fontSize: 11.5, color: DS.muted, marginBottom: 14, lineHeight: 1.5 }}>
        We'll warn you on every scan when a product contains — or may contain — any of these.
      </div>

      <div style={{
        fontSize: 10.5, fontWeight: 800, color: DS.muted, letterSpacing: "0.07em",
        textTransform: "uppercase", margin: "0 0 8px",
      }}>
        Diet
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
        {DIET_OPTIONS.map((o) => (
          <Chip
            key={o.key}
            label={o.label}
            active={prefs.diets.includes(o.key)}
            onToggle={() => toggleDiet(o.key)}
          />
        ))}
      </div>

      <div style={{
        fontSize: 10.5, fontWeight: 800, color: DS.muted, letterSpacing: "0.07em",
        textTransform: "uppercase", margin: "0 0 8px",
      }}>
        Allergies & intolerances
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {ALLERGEN_OPTIONS.map((o) => (
          <Chip
            key={o.key}
            label={o.label}
            active={prefs.allergens.includes(o.key)}
            onToggle={() => toggleAllergen(o.key)}
          />
        ))}
      </div>
    </div>
  );
}
