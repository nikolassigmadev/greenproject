import { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import {
  COUNTRIES,
  saveRegion,
  loadRegion,
  guessCountryCode,
  type UserRegion,
} from "@/utils/userRegion";

interface RegionPickerProps {
  /** Called after the user saves a region. */
  onSaved?: (region: UserRegion) => void;
  /** Optional cancel affordance (e.g. when shown as an expandable prompt). */
  onCancel?: () => void;
  /** Tighter spacing for inline use inside another card. */
  compact?: boolean;
}

/**
 * Explicit, opt-in location capture. Country is required; city / ZIP are
 * optional. We state plainly why we ask and that it stays on-device.
 */
export function RegionPicker({ onSaved, onCancel, compact }: RegionPickerProps) {
  const existing = loadRegion();
  const [country, setCountry] = useState<string>(
    existing?.countryCode || guessCountryCode() || "",
  );
  const [city, setCity] = useState<string>(existing?.city || "");
  const [zip, setZip] = useState<string>(existing?.zip || "");

  const handleSave = () => {
    const match = COUNTRIES.find((c) => c.code === country);
    if (!match) return;
    const region = saveRegion({
      countryCode: match.code,
      country: match.name,
      city: city.trim() || undefined,
      zip: zip.trim() || undefined,
    });
    onSaved?.(region);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 44, boxSizing: "border-box",
    border: `1.5px solid ${DS.hair}`, borderRadius: 12,
    background: DS.bg, color: DS.ink,
    fontSize: 14, padding: "0 12px", outline: "none",
    fontFamily: DS.font,
  };

  return (
    <div style={{
      background: DS.card, borderRadius: 16,
      border: `1px solid ${DS.hair}`,
      padding: compact ? 14 : 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: DS.goodBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <MapPin style={{ width: 16, height: 16, color: DS.good }} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: DS.ink }}>
          Where do you shop?
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: DS.muted, lineHeight: 1.5, margin: "0 0 14px" }}>
        We use this for one thing: suggesting greener swaps that are actually
        sold where you are, and showing your local impact. Pick your country —
        add a city or ZIP only if you're comfortable. It's stored on this device
        and never sent anywhere.
      </p>

      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
        Country <span style={{ color: DS.bad }}>*</span>
      </label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        style={{ ...inputStyle, marginBottom: 12, cursor: "pointer", appearance: "none" }}
      >
        <option value="" disabled>Select a country…</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 2, minWidth: 0 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
            City <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            type="text" value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Amsterdam" style={inputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
            ZIP <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(opt.)</span>
          </label>
          <input
            type="text" value={zip} onChange={(e) => setZip(e.target.value)}
            placeholder="1011" style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!country}
          style={{
            flex: 1, height: 46, borderRadius: 12, border: "none",
            background: country ? DS.good : DS.hair,
            color: country ? "#fff" : DS.muted,
            fontSize: 14, fontWeight: 800,
            cursor: country ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: DS.font,
          }}
        >
          <Check style={{ width: 16, height: 16 }} />
          Save location
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 46, padding: "0 18px", borderRadius: 12,
              border: `1px solid ${DS.hair}`, background: DS.card,
              color: DS.muted, fontSize: 13.5, fontWeight: 700,
              cursor: "pointer", fontFamily: DS.font,
            }}
          >
            Not now
          </button>
        )}
      </div>
    </div>
  );
}
