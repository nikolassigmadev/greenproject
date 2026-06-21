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
      <style>{CSS}</style>

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

const CSS = `
.gs-ob {
  --green:#2FD18C; --green-strong:#15B879; --green-soft:rgba(47,209,140,0.14);
  --coral:#F26A5B; --coral-soft:rgba(242,106,91,0.16);
  --leaf:#2FD18C; --leaf-soft:rgba(47,209,140,0.16);
  --violet:#B49CEB; --violet-soft:rgba(180,156,235,0.18);
  --radius-card:22px; --radius-field:18px;
  --font:"Hanken Grotesk", system-ui, -apple-system, sans-serif;
  position:fixed; inset:0; z-index:10000;
  font-family:var(--font);
  background:var(--bg); color:var(--text);
  -webkit-font-smoothing:antialiased;
  display:flex; flex-direction:column; overflow:hidden;
}
.gs-ob[data-theme="dark"] {
  --bg:#0B0C0B; --surface:#161917; --surface-2:#1E2220;
  --border:rgba(255,255,255,0.07); --border-strong:rgba(255,255,255,0.12);
  --text:#F3F5F3; --text-2:#A7AEAB; --text-3:#6E7572;
  --eyebrow:#2FD18C;
  --cta-bg:#EDEBE3; --cta-text:#11140F;
  --back-bg:#1B1F1D; --back-text:#E6EAE7;
  --seg-track:#0C0E0D; --field-bg:#141716;
  --icon-tile-bg:rgba(47,209,140,0.13);
}
.gs-ob[data-theme="light"] {
  --bg:#F7F8F5; --surface:#FFFFFF; --surface-2:#F2F4F0;
  --border:rgba(18,30,24,0.09); --border-strong:rgba(18,30,24,0.14);
  --text:#131A16; --text-2:#5A635E; --text-3:#939B96;
  --eyebrow:#0E9E68;
  --cta-bg:#14181A; --cta-text:#F6F8F4;
  --back-bg:#EDF0EB; --back-text:#2A322D;
  --seg-track:#EDF0EC; --field-bg:#F6F8F4;
  --icon-tile-bg:rgba(15,158,104,0.10);
  --green:#12B97C; --leaf:#12B97C; --coral:#E0584B; --violet:#8C6FD6;
  --green-soft:rgba(18,185,124,0.12); --leaf-soft:rgba(18,185,124,0.12);
  --coral-soft:rgba(224,88,75,0.12); --violet-soft:rgba(140,111,214,0.14);
}

.gs-ob * { box-sizing:border-box; }

.gs-ob .screen {
  flex:1; min-height:0; width:100%; max-width:430px; margin:0 auto;
  overflow-y:auto; -webkit-overflow-scrolling:touch;
  display:flex; flex-direction:column;
  padding: max(54px, calc(env(safe-area-inset-top,0px) + 26px)) 26px
           max(26px, calc(env(safe-area-inset-bottom,0px) + 16px));
}
.gs-ob .anim { animation: gs-ob-rise .45s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes gs-ob-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

.gs-ob .icon-tile {
  width:52px; height:52px; border-radius:15px; display:grid; place-items:center;
  background:var(--icon-tile-bg); color:var(--green); flex:none;
}
.gs-ob .icon-tile svg { width:26px; height:26px; }

.gs-ob .eyebrow { display:flex; align-items:center; gap:12px; margin:0 0 12px; }
.gs-ob .eyebrow .label {
  font-size:12.5px; font-weight:800; letter-spacing:0.13em;
  color:var(--eyebrow); text-transform:uppercase; white-space:nowrap;
}
.gs-ob .progress { display:flex; gap:5px; }
.gs-ob .progress i {
  width:22px; height:4px; border-radius:99px; display:block;
  background:color-mix(in srgb, var(--text) 13%, transparent);
}
.gs-ob .progress i.on { background:var(--green); }

.gs-ob h1.title {
  font-size:33px; line-height:1.06; font-weight:800;
  letter-spacing:-0.025em; color:var(--text); margin-bottom:12px;
}
.gs-ob p.sub {
  font-size:16px; line-height:1.5; font-weight:500; color:var(--text-2); max-width:38ch;
}

.gs-ob .footer { margin-top:auto; display:flex; align-items:center; gap:12px; padding-top:24px; }
.gs-ob .cta {
  flex:1; appearance:none; border:0; cursor:pointer; font-family:inherit;
  font-weight:800; font-size:17px; letter-spacing:-0.01em;
  background:var(--cta-bg); color:var(--cta-text);
  height:60px; border-radius:18px;
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  box-shadow:0 14px 30px -16px rgba(0,0,0,0.55);
  transition:transform .12s ease, filter .2s ease, opacity .2s ease;
}
.gs-ob .cta:hover { filter:brightness(1.04); }
.gs-ob .cta:active { transform:translateY(1px) scale(0.995); }
.gs-ob .cta:disabled { opacity:0.45; cursor:not-allowed; box-shadow:none; }
.gs-ob .cta svg { width:19px; height:19px; }
.gs-ob .iconbtn {
  flex:none; width:60px; height:60px; border-radius:18px;
  border:1px solid var(--border-strong); cursor:pointer;
  background:var(--back-bg); color:var(--back-text);
  display:grid; place-items:center; transition:background .2s ease;
}
.gs-ob .iconbtn:hover { background:color-mix(in srgb, var(--back-bg) 80%, var(--text)); }
.gs-ob .iconbtn svg { width:21px; height:21px; }
.gs-ob .skip {
  flex:none; appearance:none; border:0; background:transparent; cursor:pointer;
  font-family:inherit; font-weight:700; font-size:16px; color:var(--text-3);
  padding:0 14px; height:60px;
}
.gs-ob .skip:hover { color:var(--text-2); }

.gs-ob .hero-mark { width:76px; height:76px; margin:8px auto 30px; display:grid; place-items:center; }
.gs-ob .welcome-head { text-align:center; }
.gs-ob .welcome-head h1.title { font-size:34px; }
.gs-ob .welcome-head p.sub { margin:0 auto; }
.gs-ob .features { display:flex; flex-direction:column; gap:13px; margin-top:38px; text-align:left; }
.gs-ob .feature {
  display:flex; align-items:flex-start; gap:15px; padding:17px 18px;
  border-radius:var(--radius-card); background:var(--surface); border:1px solid var(--border);
}
.gs-ob .feature .icon-tile { width:46px; height:46px; border-radius:13px; background:var(--green-soft); color:var(--green); }
.gs-ob .feature .icon-tile svg { width:23px; height:23px; }
.gs-ob .feature h3 { font-size:17.5px; font-weight:800; letter-spacing:-0.01em; color:var(--text); margin-bottom:4px; }
.gs-ob .feature p { font-size:14.5px; line-height:1.4; font-weight:500; color:var(--text-2); }

.gs-ob .stack { margin-top:34px; display:flex; flex-direction:column; gap:22px; }
.gs-ob .field label {
  display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:800;
  letter-spacing:0.07em; text-transform:uppercase; color:var(--text-2); margin-bottom:10px;
}
.gs-ob .field label .opt { color:var(--text-3); font-weight:600; text-transform:none; letter-spacing:0; }
.gs-ob .field label .req { color:var(--coral); }
.gs-ob .control {
  width:100%; height:62px; border-radius:var(--radius-field);
  background:var(--field-bg); border:1px solid var(--border-strong);
  display:flex; align-items:center; gap:12px; padding:0 18px;
  font-size:17px; font-weight:600; color:var(--text); font-family:inherit;
  cursor:pointer; outline:none; transition:border-color .2s ease, box-shadow .2s ease;
}
.gs-ob .control:hover { border-color:color-mix(in srgb, var(--green) 50%, var(--border-strong)); }
.gs-ob .control:focus-within, .gs-ob input.control:focus { border-color:var(--green); box-shadow:0 0 0 3px var(--green-soft); }
.gs-ob input.control { display:block; font-weight:500; }
.gs-ob .control::placeholder { color:var(--text-3); font-weight:500; }
.gs-ob .control .flag { font-size:21px; line-height:1; }
.gs-ob .control .chev { margin-left:auto; color:var(--text-3); display:grid; pointer-events:none; }
.gs-ob .control .chev svg { width:18px; height:18px; }
.gs-ob .control.placeholder > span:not(.chev) { color:var(--text-3); font-weight:500; }

.gs-ob .helper {
  display:flex; align-items:flex-start; gap:9px; margin-top:18px; color:var(--text-2);
  font-size:14px; line-height:1.45; font-weight:500;
}
.gs-ob .helper svg { width:17px; height:17px; color:var(--green); flex:none; margin-top:1px; }

.gs-ob .priorities {
  margin-top:30px; border-radius:var(--radius-card);
  background:var(--surface); border:1px solid var(--border); padding:6px 18px;
}
.gs-ob .prio { padding:19px 0; }
.gs-ob .prio + .prio { border-top:1px solid var(--border); }
.gs-ob .prio-head { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
.gs-ob .prio-head .icon-tile { width:38px; height:38px; border-radius:11px; }
.gs-ob .prio-head .icon-tile svg { width:20px; height:20px; }
.gs-ob .prio-head h3 { font-size:17px; font-weight:800; letter-spacing:-0.01em; color:var(--text); }
.gs-ob .prio.c1 .icon-tile { background:var(--coral-soft); color:var(--coral); }
.gs-ob .prio.c2 .icon-tile { background:var(--leaf-soft); color:var(--leaf); }
.gs-ob .prio.c3 .icon-tile { background:var(--violet-soft); color:var(--violet); }
.gs-ob .seg {
  display:grid; grid-template-columns:repeat(3,1fr);
  background:var(--seg-track); border-radius:14px; padding:4px; gap:3px;
}
.gs-ob .seg button {
  appearance:none; border:0; cursor:pointer; font-family:inherit; font-weight:700;
  font-size:14.5px; color:var(--text-2); height:42px; border-radius:10px;
  background:transparent; transition:all .18s ease;
}
.gs-ob .seg button:hover { color:var(--text); }
.gs-ob .prio.c1 .seg button.on { background:var(--coral); color:#fff; box-shadow:0 6px 14px -6px var(--coral); }
.gs-ob .prio.c2 .seg button.on { background:var(--leaf); color:#04130C; box-shadow:0 6px 14px -6px var(--leaf); }
.gs-ob .prio.c3 .seg button.on { background:var(--violet); color:#fff; box-shadow:0 6px 14px -6px var(--violet); }
`;
