import { useEffect, useState } from "react";
import {
  Leaf, Users, Heart, ArrowRight, ArrowLeft, Check, MapPin,
  Sparkles, ScanLine, ShieldCheck,
} from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { Logo } from "@/components/Logo";
import {
  COUNTRIES, saveRegion, loadRegion, guessCountryCode,
} from "@/utils/userRegion";
import {
  loadPriorities, savePriorities, DEFAULT_PRIORITIES, type UserPriorities,
} from "@/utils/userPreferences";

const ONBOARDING_KEY = "goodscan-onboarding-complete";

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return true; // if storage is unavailable, never trap the user
  }
}

function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // ignore
  }
}

// ── Priority levels (mirrors the Preferences page) ──
const LEVELS = [
  { value: 0,   label: "None",     effect: "Left out of scoring" },
  { value: 25,  label: "Low",      effect: "A small nudge on the verdict" },
  { value: 50,  label: "Medium",   effect: "Counted the usual amount" },
  { value: 75,  label: "High",     effect: "Weighs heavily on the verdict" },
  { value: 100, label: "Critical", effect: "Can outweigh everything else" },
] as const;

const levelIndex = (v: number): number => {
  if (v <= 12) return 0;
  if (v <= 37) return 1;
  if (v <= 62) return 2;
  if (v <= 87) return 3;
  return 4;
};

const PRIORITY_CONFIG = [
  { key: "laborRights" as keyof UserPriorities, label: "Labor & Human Rights", desc: "Child & forced labor, fair wages", icon: Users, color: DS.bad },
  { key: "environment" as keyof UserPriorities, label: "Environmental Impact", desc: "Carbon footprint, eco-score, packaging", icon: Leaf, color: DS.good },
  { key: "animalWelfare" as keyof UserPriorities, label: "Animal Welfare", desc: "Factory farming, animal testing", icon: Heart, color: "#9B7AAE" },
];

type StepId = "welcome" | "location" | "priorities" | "ready";
const STEPS: StepId[] = ["welcome", "location", "priorities", "ready"];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  // Pre-fill from anything the user already has (current users see it too).
  const existingRegion = loadRegion();
  const [country, setCountry] = useState(existingRegion?.countryCode || guessCountryCode() || "");
  const [city, setCity] = useState(existingRegion?.city || "");
  const [priorities, setPriorities] = useState<UserPriorities>(() => loadPriorities());

  const step = STEPS[stepIdx];
  const canGoNext = step === "location" ? !!country : true;

  // Re-trigger the entrance animation each time the step changes.
  useEffect(() => { setAnimKey((k) => k + 1); }, [stepIdx]);

  // Lock the page behind the overlay so focusing inputs can't scroll it; the
  // window is reset to the top when we hand back to the app.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const finish = () => {
    const match = COUNTRIES.find((c) => c.code === country);
    if (match) {
      saveRegion({ countryCode: match.code, country: match.name, city: city.trim() || undefined });
    }
    savePriorities(priorities);
    markOnboardingComplete();
    // Drop focus (closes mobile keyboard / native picker) and hand back to the
    // app at the top of the page, not wherever an input nudged the viewport.
    (document.activeElement as HTMLElement | null)?.blur?.();
    onComplete();
    requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  const next = () => {
    if (!canGoNext) return;
    if (stepIdx >= STEPS.length - 1) finish();
    else setStepIdx((i) => i + 1);
  };
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  const setLevel = (key: keyof UserPriorities, value: number) =>
    setPriorities((p) => ({ ...p, [key]: value }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: DS.bg, color: DS.ink, fontFamily: DS.font,
        display: "flex", flexDirection: "column",
        paddingTop: "max(20px, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))",
        overflow: "hidden",
      }}
    >
      {/* Ambient gradient orbs */}
      <div aria-hidden style={{
        position: "absolute", top: "-18%", right: "-12%", width: 360, height: 360,
        borderRadius: "50%", filter: "blur(70px)", opacity: 0.5, pointerEvents: "none",
        background: `radial-gradient(circle, ${DS.good}, transparent 70%)`,
        animation: "ob-float 9s ease-in-out infinite",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: "-16%", left: "-14%", width: 320, height: 320,
        borderRadius: "50%", filter: "blur(70px)", opacity: 0.35, pointerEvents: "none",
        background: `radial-gradient(circle, #9B7AAE, transparent 70%)`,
        animation: "ob-float 11s ease-in-out infinite reverse",
      }} />

      {/* Progress segments */}
      <div style={{ display: "flex", gap: 6, padding: "0 22px 8px", position: "relative", zIndex: 1 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= stepIdx ? DS.good : DS.hair,
            transition: "background 0.4s ease",
          }} />
        ))}
      </div>

      {/* Step body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative", zIndex: 1 }}>
        <div
          key={animKey}
          style={{
            maxWidth: 460, margin: "0 auto", width: "100%",
            padding: "16px 22px 8px", boxSizing: "border-box",
            animation: "ob-rise 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {step === "welcome" && <WelcomeStep />}
          {step === "location" && (
            <LocationStep country={country} setCountry={setCountry} city={city} setCity={setCity} />
          )}
          {step === "priorities" && (
            <PrioritiesStep priorities={priorities} setLevel={setLevel} />
          )}
          {step === "ready" && (
            <ReadyStep country={country} city={city} priorities={priorities} />
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div style={{
        maxWidth: 460, margin: "0 auto", width: "100%", boxSizing: "border-box",
        padding: "12px 22px 4px", display: "flex", alignItems: "center", gap: 10,
        position: "relative", zIndex: 1,
      }}>
        {stepIdx > 0 ? (
          <button
            type="button" onClick={back}
            aria-label="Back"
            style={{
              width: 52, height: 54, borderRadius: 15, flexShrink: 0,
              border: `1px solid ${DS.hair}`, background: DS.card, color: DS.ink,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowLeft style={{ width: 19, height: 19 }} />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            style={{
              height: 54, padding: "0 4px", flexShrink: 0,
              background: "none", border: "none", color: DS.muted,
              fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: DS.font,
            }}
          >
            Skip
          </button>
        )}

        <button
          type="button"
          onClick={next}
          disabled={!canGoNext}
          style={{
            flex: 1, height: 54, borderRadius: 15, border: "none",
            background: canGoNext ? DS.ink : DS.hair,
            color: canGoNext ? DS.card : DS.muted,
            fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em",
            cursor: canGoNext ? "pointer" : "not-allowed", fontFamily: DS.font,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            boxShadow: canGoNext ? "0 8px 24px rgba(0,0,0,0.18)" : "none",
            transition: "background 0.2s",
          }}
        >
          {step === "ready" ? "Start scanning" : step === "welcome" ? "Get started" : "Continue"}
          {step === "ready"
            ? <ScanLine style={{ width: 18, height: 18 }} />
            : <ArrowRight style={{ width: 18, height: 18 }} />}
        </button>
      </div>

      <style>{`
        @keyframes ob-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ob-float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(0,-24px) scale(1.06); } }
        @keyframes ob-pop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function StaggerItem({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div style={{ animation: `ob-rise 0.55s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function WelcomeStep() {
  const bullets = [
    { icon: ScanLine, title: "Scan anything", text: "Point your camera at any product's barcode or label." },
    { icon: ShieldCheck, title: "See the ethics", text: "Labour, animal-welfare and carbon flags, sourced and dated." },
    { icon: Sparkles, title: "Get better swaps", text: "We suggest cleaner brands sold where you actually shop." },
  ];
  return (
    <div style={{ textAlign: "center", paddingTop: 18 }}>
      <div style={{
        width: 92, height: 92, borderRadius: 28, margin: "0 auto 22px",
        background: DS.card, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 12px 36px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
        animation: "ob-pop 0.6s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <Logo size={52} />
      </div>
      <StaggerItem delay={120}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.1 }}>
          Welcome to GoodScan
        </h1>
      </StaggerItem>
      <StaggerItem delay={200}>
        <p style={{ fontSize: 15, color: DS.muted, lineHeight: 1.5, margin: "0 0 28px" }}>
          Shop with your values. Let's set you up in about&nbsp;30&nbsp;seconds.
        </p>
      </StaggerItem>
      <div style={{ display: "grid", gap: 12, textAlign: "left" }}>
        {bullets.map((b, i) => (
          <StaggerItem key={b.title} delay={300 + i * 110}>
            <div style={{
              display: "flex", gap: 13, alignItems: "center",
              background: DS.card, borderRadius: 16, padding: "14px 15px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.035)",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: DS.goodBg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <b.icon style={{ width: 21, height: 21, color: DS.good }} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: DS.ink }}>{b.title}</div>
                <div style={{ fontSize: 12.5, color: DS.muted, marginTop: 2, lineHeight: 1.4 }}>{b.text}</div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, kicker, title, subtitle }: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  kicker: string; title: string; subtitle: string;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 14,
        background: DS.goodBg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 24, height: 24, color: DS.good }} />
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: DS.good, marginBottom: 5 }}>
        {kicker}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 8px", lineHeight: 1.12 }}>
        {title}
      </h1>
      <p style={{ fontSize: 13.5, color: DS.muted, lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function LocationStep({
  country, setCountry, city, setCity,
}: {
  country: string; setCountry: (v: string) => void;
  city: string; setCity: (v: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", height: 52, boxSizing: "border-box",
    border: `1.5px solid ${DS.hair}`, borderRadius: 14,
    background: DS.card, color: DS.ink, fontSize: 15, padding: "0 14px",
    outline: "none", fontFamily: DS.font,
  };
  return (
    <div>
      <StepHeader
        icon={MapPin}
        kicker="Step 1 of 2"
        title="Where do you shop?"
        subtitle="We use this for one thing — suggesting greener swaps that are actually sold near you. It stays on your device and is never sent anywhere."
      />
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 7 }}>
        Country <span style={{ color: DS.bad }}>*</span>
      </label>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16, cursor: "pointer", appearance: "none" }}
      >
        <option value="" disabled>Select your country…</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
        ))}
      </select>

      <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 7 }}>
        City <span style={{ fontWeight: 600, textTransform: "none", letterSpacing: 0, color: DS.muted }}>· optional</span>
      </label>
      <input
        type="text" value={city} onChange={(e) => setCity(e.target.value)}
        placeholder="e.g. Amsterdam" style={inputStyle}
      />
      <p style={{ fontSize: 12, color: DS.muted, lineHeight: 1.5, marginTop: 14, display: "flex", gap: 8 }}>
        <ShieldCheck style={{ width: 15, height: 15, color: DS.good, flexShrink: 0, marginTop: 1 }} />
        Only the country is required. Add a city if you'd like swaps tuned to where you live.
      </p>
    </div>
  );
}

function SegmentedLevel({
  value, color, onSelect,
}: { value: number; color: string; onSelect: (v: number) => void }) {
  const active = levelIndex(value);
  return (
    <div style={{ display: "flex", gap: 4, background: DS.bg, borderRadius: 12, padding: 4 }}>
      {LEVELS.map((lvl, i) => {
        const on = i === active;
        return (
          <button
            key={lvl.value}
            type="button"
            onClick={() => onSelect(lvl.value)}
            style={{
              flex: 1, height: 36, borderRadius: 9, border: "none", cursor: "pointer",
              background: on ? color : "transparent",
              color: on ? "#fff" : DS.muted,
              fontSize: 11.5, fontWeight: 800, fontFamily: DS.font,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {lvl.label}
          </button>
        );
      })}
    </div>
  );
}

function PrioritiesStep({
  priorities, setLevel,
}: {
  priorities: UserPriorities;
  setLevel: (key: keyof UserPriorities, value: number) => void;
}) {
  return (
    <div>
      <StepHeader
        icon={Sparkles}
        kicker="Step 2 of 2"
        title="What matters most to you?"
        subtitle="This shapes every verdict and swap. You can fine-tune it later in Settings."
      />
      <div style={{ display: "grid", gap: 12 }}>
        {PRIORITY_CONFIG.map((cfg) => {
          const Icon = cfg.icon;
          const lvl = LEVELS[levelIndex(priorities[cfg.key])];
          return (
            <div key={cfg.key} style={{
              background: DS.card, borderRadius: 16, padding: "14px 15px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.035)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon style={{ width: 19, height: 19, color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: DS.ink, lineHeight: 1.2 }}>{cfg.label}</div>
                  <div style={{ fontSize: 11.5, color: DS.muted, marginTop: 2 }}>{cfg.desc}</div>
                </div>
              </div>
              <SegmentedLevel value={priorities[cfg.key]} color={cfg.color} onSelect={(v) => setLevel(cfg.key, v)} />
              <div style={{ fontSize: 11.5, color: DS.muted, marginTop: 8, textAlign: "center" }}>
                {lvl.effect}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadyStep({
  country, city, priorities,
}: {
  country: string; city: string; priorities: UserPriorities;
}) {
  const countryName = COUNTRIES.find((c) => c.code === country)?.name;
  const flag = COUNTRIES.find((c) => c.code === country)?.flag;
  const top = [...PRIORITY_CONFIG]
    .sort((a, b) => priorities[b.key] - priorities[a.key])[0];
  return (
    <div style={{ textAlign: "center", paddingTop: 16 }}>
      <div style={{
        width: 88, height: 88, borderRadius: "50%", margin: "0 auto 22px",
        background: DS.goodBg, display: "flex", alignItems: "center", justifyContent: "center",
        animation: "ob-pop 0.55s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <Check style={{ width: 44, height: 44, color: DS.good }} strokeWidth={2.6} />
      </div>
      <StaggerItem delay={120}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.1 }}>
          You're all set
        </h1>
      </StaggerItem>
      <StaggerItem delay={200}>
        <p style={{ fontSize: 14.5, color: DS.muted, lineHeight: 1.5, margin: "0 0 24px" }}>
          Scan your first product and we'll do the rest.
        </p>
      </StaggerItem>
      <div style={{ display: "grid", gap: 10, textAlign: "left" }}>
        {countryName && (
          <StaggerItem delay={280}>
            <SummaryRow icon={MapPin} label="Shopping in" value={`${flag ? flag + " " : ""}${city ? `${city}, ` : ""}${countryName}`} />
          </StaggerItem>
        )}
        <StaggerItem delay={360}>
          <SummaryRow icon={top.icon} label="Top priority" value={`${top.label} · ${LEVELS[levelIndex(priorities[top.key])].label}`} color={top.color} />
        </StaggerItem>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon, label, value, color = DS.good,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string; value: string; color?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: DS.card, borderRadius: 14, padding: "13px 15px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.035)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 19, height: 19, color }} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: DS.ink, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
