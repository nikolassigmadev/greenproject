import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ScanLine, ShieldCheck, Sparkles, MapPin, Users, Leaf, Heart,
  ArrowRight, ArrowLeft, ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  COUNTRIES, saveRegion, loadRegion, guessCountryCode,
} from "@/utils/userRegion";
import {
  loadPriorities, savePriorities, type UserPriorities,
} from "@/utils/userPreferences";
import { OB_CSS } from "@/components/onboardingTheme";

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

// ── Priority levels (3-level scale shared with Preferences) ──
const LEVELS = [
  { value: 25, label: "Low" },
  { value: 50, label: "Medium" },
  { value: 100, label: "Critical" },
] as const;

const levelIndex = (v: number): number => (v <= 37 ? 0 : v <= 62 ? 1 : 2);

const PRIORITY_CONFIG = [
  { key: "laborRights" as keyof UserPriorities, cls: "c1", label: "Labor & Human Rights", Icon: Users },
  { key: "environment" as keyof UserPriorities, cls: "c2", label: "Environmental Impact", Icon: Leaf },
  { key: "animalWelfare" as keyof UserPriorities, cls: "c3", label: "Animal Welfare", Icon: Heart },
];

type StepId = "welcome" | "location" | "priorities";
const STEPS: StepId[] = ["welcome", "location", "priorities"];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const [stepIdx, setStepIdx] = useState(0);

  // Pre-fill from anything the user already has (current users see it too).
  const existingRegion = loadRegion();
  const [country, setCountry] = useState(existingRegion?.countryCode || guessCountryCode() || "");
  const [city, setCity] = useState(existingRegion?.city || "");
  const [priorities, setPriorities] = useState<UserPriorities>(() => loadPriorities());

  const step = STEPS[stepIdx];
  const canGoNext = step === "location" ? !!country : true;

  // Lock the page behind the overlay so focusing inputs can't scroll it.
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

  const selected = COUNTRIES.find((c) => c.code === country);
  const ctaLabel = step === "welcome" ? "Get started" : "Continue";

  return (
    <div className="gs-ob" data-theme={theme} role="dialog" aria-modal="true">
      <style>{OB_CSS}</style>

      <div className="screen">
        <div className="anim" key={step}>
          {step === "welcome" && (
            <div className="welcome-head">
              <div className="hero-mark"><Logo size={76} /></div>
              <h1 className="title">Welcome to GoodScan</h1>
              <p className="sub">Shop with your values. Let's set you up in about 30&nbsp;seconds.</p>

              <div className="features">
                <div className="feature">
                  <span className="icon-tile"><ScanLine /></span>
                  <div>
                    <h3>Scan anything</h3>
                    <p>Point your camera at any product's barcode or label.</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon-tile"><ShieldCheck /></span>
                  <div>
                    <h3>See the ethics</h3>
                    <p>Labour, animal-welfare and carbon flags, sourced and dated.</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="icon-tile"><Sparkles /></span>
                  <div>
                    <h3>Get better swaps</h3>
                    <p>We suggest cleaner brands sold where you actually shop.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "location" && (
            <>
              <span className="icon-tile" style={{ marginBottom: 26 }}><MapPin /></span>
              <div className="eyebrow">
                <span className="label">Step 1 of 2</span>
                <span className="progress"><i className="on" /><i /></span>
              </div>
              <h1 className="title">Where do you shop?</h1>
              <p className="sub">
                We use this for one thing — suggesting greener swaps that are actually sold near you.
                It stays on your device and is never sent anywhere.
              </p>

              <div className="stack">
                <div className="field">
                  <label>Country <span className="req">*</span></label>
                  <div className={`control${country ? "" : " placeholder"}`} style={{ position: "relative" }}>
                    {selected && <span className="flag">{selected.flag}</span>}
                    <span>{selected ? selected.name : "Select your country…"}</span>
                    <span className="chev"><ChevronDown /></span>
                    <select
                      aria-label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        opacity: 0, border: 0, cursor: "pointer", appearance: "none",
                      }}
                    >
                      <option value="" disabled>Select your country…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>City <span className="opt">· optional</span></label>
                  <input
                    className="control"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Amsterdam"
                  />
                </div>
              </div>

              <div className="helper">
                <ShieldCheck />
                Only the country is required. Add a city if you'd like swaps tuned to where you live.
              </div>
            </>
          )}

          {step === "priorities" && (
            <>
              <span className="icon-tile" style={{ marginBottom: 26 }}><Sparkles /></span>
              <div className="eyebrow">
                <span className="label">Step 2 of 2</span>
                <span className="progress"><i className="on" /><i className="on" /></span>
              </div>
              <h1 className="title">What matters most to you?</h1>
              <p className="sub">This shapes every verdict and swap. You can fine-tune it later in Settings.</p>

              <div className="priorities">
                {PRIORITY_CONFIG.map(({ key, cls, label, Icon }) => {
                  const idx = levelIndex(priorities[key]);
                  return (
                    <div className={`prio ${cls}`} key={key}>
                      <div className="prio-head">
                        <span className="icon-tile"><Icon /></span>
                        <h3>{label}</h3>
                      </div>
                      <div className="seg">
                        {LEVELS.map((lvl, i) => (
                          <button
                            key={lvl.value}
                            type="button"
                            className={i === idx ? "on" : ""}
                            aria-pressed={i === idx}
                            onClick={() => setLevel(key, lvl.value)}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="footer">
          {stepIdx === 0 ? (
            <button type="button" className="skip" onClick={finish}>Skip</button>
          ) : (
            <button type="button" className="iconbtn" aria-label="Back" onClick={back}>
              <ArrowLeft />
            </button>
          )}
          <button type="button" className="cta" onClick={next} disabled={!canGoNext}>
            {ctaLabel}
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}
