import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ScanLine, ShieldCheck, Sparkles, MapPin, Users, Leaf, Heart,
  ArrowRight, ArrowLeft, ChevronDown, ChevronRight, FileText, Check, X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { DS } from "@/styles/design-tokens";
import TermsOfService from "@/pages/TermsOfService";
import TermsAndConditions from "@/pages/TermsAndConditions";
import Privacy from "@/pages/Privacy";
import {
  COUNTRIES, saveRegion, loadRegion, guessCountryCode,
} from "@/utils/userRegion";
import {
  loadPriorities, savePriorities, summarizePriorities, type UserPriorities,
} from "@/utils/userPreferences";
import { OB_CSS } from "@/components/onboardingTheme";

const ONBOARDING_KEY = "goodscan-onboarding-complete";
const CONSENT_KEY = "goodscan-legal-consent";
// Bump when the legal documents change materially to re-prompt for consent.
const CONSENT_VERSION = "2026-06";

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

function recordConsent(): void {
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: CONSENT_VERSION, acceptedAt: new Date().toISOString() }),
    );
  } catch {
    // ignore
  }
}

// The legal documents a user must accept before using the app.
const LEGAL_DOCS = [
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy" },
];

// The page component behind each legal doc, rendered *in place* inside the
// onboarding sheet. We deliberately don't navigate (router links would unmount
// onboarding and lose the user's progress), so each doc is shown embedded.
const DOC_COMPONENTS: Record<
  string,
  React.ComponentType<{ embedded?: boolean; onOpenDoc?: (href: string) => void }>
> = {
  "/terms-of-service": TermsOfService,
  "/terms-and-conditions": TermsAndConditions,
  "/privacy": Privacy,
};

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

type StepId = "welcome" | "location" | "priorities" | "consent";
const STEPS: StepId[] = ["welcome", "location", "priorities", "consent"];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const [stepIdx, setStepIdx] = useState(0);
  const [docViewer, setDocViewer] = useState<{ label: string; href: string } | null>(null);

  // Pre-fill from anything the user already has (current users see it too).
  const existingRegion = loadRegion();
  const [country, setCountry] = useState(existingRegion?.countryCode || guessCountryCode() || "");
  const [city, setCity] = useState(existingRegion?.city || "");
  const [priorities, setPriorities] = useState<UserPriorities>(() => loadPriorities());
  const [agreed, setAgreed] = useState(false);

  const step = STEPS[stepIdx];
  const canGoNext =
    step === "location" ? !!country : step === "consent" ? agreed : true;

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
    recordConsent();
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
  const ctaLabel =
    step === "welcome" ? "Get started" : step === "consent" ? "Agree & continue" : "Continue";

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
                <span className="label">Step 1 of 3</span>
                <span className="progress"><i className="on" /><i /><i /></span>
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
                <span className="label">Step 2 of 3</span>
                <span className="progress"><i className="on" /><i className="on" /><i /></span>
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

              <div className="impact-note">
                <Sparkles />
                <span>{summarizePriorities(priorities)}</span>
              </div>
            </>
          )}

          {step === "consent" && (
            <>
              <span className="icon-tile" style={{ marginBottom: 26 }}><ShieldCheck /></span>
              <div className="eyebrow">
                <span className="label">Step 3 of 3</span>
                <span className="progress"><i className="on" /><i className="on" /><i className="on" /></span>
              </div>
              <h1 className="title">A quick agreement</h1>
              <p className="sub">
                Before you start, please review and accept the documents below. Tap any to read the full text.
              </p>

              <div className="doc-list">
                {LEGAL_DOCS.map((doc) => (
                  <button
                    key={doc.href}
                    type="button"
                    className="doc-row"
                    onClick={() => setDocViewer(doc)}
                  >
                    <span className="doc-ic"><FileText /></span>
                    <span className="doc-txt">{doc.label}</span>
                    <span className="doc-chev"><ChevronRight /></span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={`agree${agreed ? " checked" : ""}`}
                aria-pressed={agreed}
                onClick={() => setAgreed((v) => !v)}
              >
                <span className="box"><Check strokeWidth={3} /></span>
                <span className="agree-txt">
                  I have read and agree to the <b>Terms of Service</b>, <b>Terms &amp; Conditions</b>, and <b>Privacy Policy</b>.
                </span>
              </button>
            </>
          )}
        </div>

        <div className="footer">
          {stepIdx > 0 && (
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

      {/* In-app policy viewer — renders the doc *in place* (no navigation), so
          the user's onboarding progress is never lost. */}
      {docViewer && (() => {
        const DocComp = DOC_COMPONENTS[docViewer.href];
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 10,
              display: "flex", flexDirection: "column",
              background: DS.bg, fontFamily: DS.font,
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px)) 20px 12px",
              borderBottom: `1px solid ${DS.hair}`,
              flexShrink: 0, background: DS.bg,
            }}>
              <span style={{ fontWeight: 600, fontSize: 16, color: DS.ink }}>
                {docViewer.label}
              </span>
              <button
                type="button"
                onClick={() => setDocViewer(null)}
                aria-label="Close"
                style={{
                  background: DS.card, border: "none", borderRadius: "50%",
                  width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: DS.ink, flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
              {DocComp && (
                <DocComp
                  embedded
                  onOpenDoc={(href) =>
                    setDocViewer(LEGAL_DOCS.find((d) => d.href === href) ?? null)
                  }
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
