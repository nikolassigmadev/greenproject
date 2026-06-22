import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { ArrowRight, Check, Maximize, WifiOff, Zap, MoreVertical, MoreHorizontal, Menu, MonitorDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import { OB_CSS } from "@/components/onboardingTheme";

/** True when the app is already running as an installed PWA / standalone app. */
export function isStandalonePWA(): boolean {
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      // iOS Safari exposes this non-standard flag when launched from the Home Screen
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

// iOS share glyph (rounded square is the toolbar; the up-arrow is "share").
const ShareGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V3" /><path d="m7 8 5-5 5 5" />
    <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);
const PlusSquareGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" />
  </svg>
);

/** Small inline icon used inside step text to point at a specific button. */
const Ic = ({ children }: { children: ReactNode }) => <span className="ios-ic">{children}</span>;

// ── Browser logos ──
// Compact, on-brand inline SVGs (no external assets, so they render on the
// install gate even offline). Recognizable by each browser's signature shape
// + colour; shown next to the "How to install in …" caption.
const ChromeLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 24 4.95 13A22 22 0 0 1 43.05 13Z" fill="#EA4335" />
    <path d="M24 24 24 46A22 22 0 0 1 4.95 13Z" fill="#34A853" />
    <path d="M24 24 43.05 13A22 22 0 0 1 24 46Z" fill="#FBBC05" />
    <circle cx="24" cy="24" r="10" fill="#fff" />
    <circle cx="24" cy="24" r="8" fill="#4285F4" />
  </svg>
);
const SafariLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#1E8FE1" />
    <circle cx="24" cy="24" r="19.5" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.85" />
    <polygon points="16,16 27,21 21,27" fill="#f6f6f6" />
    <polygon points="32,32 27,21 21,27" fill="#FF5150" />
  </svg>
);
const FirefoxLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <radialGradient id="gs-ff" cx="38%" cy="72%" r="92%">
        <stop offset="0%" stopColor="#FFE25A" />
        <stop offset="35%" stopColor="#FFA01E" />
        <stop offset="68%" stopColor="#FF5B27" />
        <stop offset="100%" stopColor="#C42A6E" />
      </radialGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#gs-ff)" />
    <path d="M24 13c3.5 4 5.5 8 5.5 12.5a5.5 5.5 0 0 1-11 0c0-2.2.8-4 2.4-5.4.1 1.9.9 3 2.3 3.6-1.7-3.6-.5-7.6 1.8-10.7z" fill="#FFDA6B" />
  </svg>
);
const EdgeLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="gs-edge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#37C0F0" />
        <stop offset="50%" stopColor="#1A8FE3" />
        <stop offset="100%" stopColor="#1B59C8" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#gs-edge)" />
    <path d="M15 24h18a9 9 0 1 0-3 7" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" />
  </svg>
);
const OperaLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <ellipse cx="24" cy="24" rx="13" ry="17" fill="none" stroke="#F5232E" strokeWidth="9" />
  </svg>
);
const SamsungLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#1B59C8" />
    <circle cx="24" cy="24" r="13" fill="none" stroke="#fff" strokeWidth="2.4" />
    <ellipse cx="24" cy="24" rx="5.5" ry="13" fill="none" stroke="#fff" strokeWidth="2.4" />
    <line x1="11" y1="24" x2="37" y2="24" stroke="#fff" strokeWidth="2.4" />
  </svg>
);
const GenericLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

type BrowserKey = "chrome" | "safari" | "firefox" | "edge" | "opera" | "samsung" | "generic";

const BROWSER_LOGOS: Record<BrowserKey, () => JSX.Element> = {
  chrome: ChromeLogo,
  safari: SafariLogo,
  firefox: FirefoxLogo,
  edge: EdgeLogo,
  opera: OperaLogo,
  samsung: SamsungLogo,
  generic: GenericLogo,
};

/** Pick the logo that matches a guide's browser label. */
function logoFor(browser: string): BrowserKey {
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "chrome";
  if (b.includes("samsung")) return "samsung";
  if (b.includes("firefox")) return "firefox";
  if (b.includes("edge")) return "edge";
  if (b.includes("opera")) return "opera";
  if (b.includes("safari")) return "safari";
  return "generic";
}

interface InstallStep {
  text: ReactNode;
  /** Render a check badge instead of a step number — used for the final "launch" step. */
  done?: boolean;
}
interface InstallGuide {
  /** Friendly name of the detected browser, shown above the steps. */
  browser: string;
  steps: InstallStep[];
  /** Optional caveat, e.g. when the browser can't install web apps at all. */
  note?: string;
}

/**
 * Inspect the UA and return install steps tailored to the user's exact browser
 * + platform. Covers Safari/Chrome/Edge/Firefox on iOS; Chrome/Edge/Samsung/
 * Firefox/Opera on Android; and Chrome/Edge/Safari/Firefox on desktop — each
 * with a sensible generic fallback. Only used when the browser doesn't fire a
 * native install prompt (see the "prompt" mode, which is always preferred).
 */
function buildInstallGuide(): InstallGuide {
  const ua = navigator.userAgent || "";
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as Mac; disambiguate by touch support
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);

  // Order matters: every Chromium browser also matches /chrome/, and almost
  // everything matches /safari/, so test the specific brands first.
  const isEdge = /edg(a|ios)?\//i.test(ua);                       // Edg/ · EdgA/ · EdgiOS/
  const isSamsung = /samsungbrowser/i.test(ua);
  const isFirefox = /firefox\/|fxios/i.test(ua);                  // Firefox/ · FxiOS
  const isOpera = /\bopr\/|opios|opt\//i.test(ua);                // OPR/ · OPiOS · OPT/
  const isChrome = !isEdge && !isSamsung && !isOpera && /chrome\/|crios|chromium/i.test(ua);
  const isSafari = !isChrome && !isEdge && !isFirefox && !isSamsung && !isOpera && /safari/i.test(ua);

  // Shared final step.
  const launch: InstallStep = { done: true, text: <>Open <b>GoodScan</b> from your Home Screen.</> };
  const launchDesktop: InstallStep = { done: true, text: <>Launch <b>GoodScan</b> from your apps.</> };

  // ── iOS (every browser routes through the iOS share sheet) ──
  if (isIOS) {
    if (isChrome) {
      return {
        browser: "Chrome",
        steps: [
          { text: <>Tap the <Ic><ShareGlyph /></Ic> <b>Share</b> icon in the toolbar.</> },
          { text: <>Choose <Ic><PlusSquareGlyph /></Ic> <b>Add to Home Screen</b>.</> },
          launch,
        ],
      };
    }
    if (isEdge) {
      return {
        browser: "Edge",
        steps: [
          { text: <>Tap the <Ic><MoreHorizontal /></Ic> menu, then <b>Share</b>.</> },
          { text: <>Choose <Ic><PlusSquareGlyph /></Ic> <b>Add to Home Screen</b>.</> },
          launch,
        ],
      };
    }
    if (isFirefox) {
      return {
        browser: "Firefox",
        steps: [
          { text: <>Tap the <Ic><Menu /></Ic> menu, then <b>Share</b>.</> },
          { text: <>Choose <Ic><PlusSquareGlyph /></Ic> <b>Add to Home Screen</b>.</> },
          launch,
        ],
      };
    }
    // Safari — and any other iOS browser — use the canonical share-sheet flow.
    return {
      browser: "Safari",
      steps: [
        { text: <>Tap the <Ic><ShareGlyph /></Ic> <b>Share</b> button in the toolbar.</> },
        { text: <>Scroll down and tap <Ic><PlusSquareGlyph /></Ic> <b>Add to Home Screen</b>.</> },
        launch,
      ],
    };
  }

  // ── Android ──
  if (isAndroid) {
    if (isSamsung) {
      return {
        browser: "Samsung Internet",
        steps: [
          { text: <>Tap the <Ic><Menu /></Ic> menu (bottom-right).</> },
          { text: <>Tap <b>Add page to</b> → <b>Home screen</b>.</> },
          launch,
        ],
      };
    }
    if (isFirefox) {
      return {
        browser: "Firefox",
        steps: [
          { text: <>Tap the <Ic><MoreVertical /></Ic> menu.</> },
          { text: <>Tap <b>Install</b> (or <b>Add to Home screen</b>).</> },
          launch,
        ],
      };
    }
    if (isEdge) {
      return {
        browser: "Edge",
        steps: [
          { text: <>Tap the <Ic><MoreHorizontal /></Ic> menu.</> },
          { text: <>Tap <b>Add to phone</b>, then <b>Install</b>.</> },
          launch,
        ],
      };
    }
    if (isOpera) {
      return {
        browser: "Opera",
        steps: [
          { text: <>Tap the <Ic><MoreVertical /></Ic> menu.</> },
          { text: <>Tap <b>Home screen</b> to add it.</> },
          launch,
        ],
      };
    }
    if (isChrome) {
      return {
        browser: "Chrome",
        steps: [
          { text: <>Tap the <Ic><MoreVertical /></Ic> menu (top-right of the address bar).</> },
          { text: <>Tap <b>Install app</b> — or <b>Add to Home screen</b> if that's what you see.</> },
          { text: <>In the pop-up, tap <b>Install</b> (then <b>Add</b> if asked).</> },
          launch,
        ],
      };
    }
    return {
      browser: "your browser",
      steps: [
        { text: <>Open your browser's <Ic><MoreVertical /></Ic> menu.</> },
        { text: <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</> },
        launch,
      ],
    };
  }

  // ── Desktop ──
  if (isFirefox) {
    return {
      browser: "Firefox",
      steps: [
        { text: <>Open <b>GoodScan</b> in <b>Chrome</b>, <b>Edge</b>, or <b>Safari</b>.</> },
        { done: true, text: <>Install it from there.</> },
      ],
      note: "Firefox on desktop can't install web apps.",
    };
  }
  if (isSafari) {
    return {
      browser: "Safari",
      steps: [
        { text: <>Open the <b>File</b> menu in the menu bar.</> },
        { text: <>Choose <b>Add to Dock…</b></> },
        { done: true, text: <>Click <b>Add</b>, then open <b>GoodScan</b> from your Dock.</> },
      ],
    };
  }
  if (isEdge) {
    return {
      browser: "Edge",
      steps: [
        { text: <>Click the <Ic><MonitorDown /></Ic> <b>Install</b> icon in the address bar.</> },
        { text: <>Or open <Ic><MoreHorizontal /></Ic> → <b>Apps</b> → <b>Install this site as an app</b>.</> },
        launchDesktop,
      ],
    };
  }
  if (isChrome) {
    return {
      browser: "Chrome",
      steps: [
        { text: <>Look for the <Ic><MonitorDown /></Ic> <b>Install</b> icon at the right end of the address bar and click it.</> },
        { text: <>No icon there? Open the <Ic><MoreVertical /></Ic> menu (top-right) → <b>Cast, save, and share</b> → <b>Install page as app…</b></> },
        { text: <>Click <b>Install</b> in the pop-up that appears.</> },
        { done: true, text: <>GoodScan opens in its own window — reopen it anytime from your apps.</> },
      ],
    };
  }
  return {
    browser: "your browser",
    steps: [
      { text: <>Open your browser's menu.</> },
      { text: <>Look for <b>Install</b> or <b>Add to Home Screen</b>.</> },
      launchDesktop,
    ],
  };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  /**
   * Called only when the app is *genuinely* installed — i.e. the native install
   * prompt is accepted or the `appinstalled` event fires. There is intentionally
   * no "skip"/"continue" escape: in a regular browser the user must add the app
   * to their Home Screen (or use a bypass URL) before they can use it.
   */
  onInstalled?: () => void;
}

export function AddToHomeScreen({ onInstalled }: Props) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  // Detect the exact browser + platform so we can show install steps for it.
  const guide = useMemo(() => buildInstallGuide(), []);

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  // First-run choreography (guide mode only): after a beat, the intro text
  // collapses up into the logo, the steps rise to the top, and the bottom
  // "Add to Home Screen" sign slides in.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (deferred) return; // prompt mode has its own native CTA — skip the choreography
    const t = setTimeout(() => setCollapsed(true), 1300);
    return () => clearTimeout(t);
  }, [deferred]);

  // Lock the page behind the overlay so it can't scroll underneath.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => onInstalled?.();
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [onInstalled]);

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") onInstalled?.();
    } catch {
      /* ignore */
    }
    setDeferred(null);
  };

  const mode: "prompt" | "guide" = deferred ? "prompt" : "guide";
  const BrowserMark = BROWSER_LOGOS[logoFor(guide.browser)];

  // Rendered through a portal to document.body so the fixed full-screen overlay
  // sits in the root stacking context — otherwise the page's `.page-transition`
  // animation traps its z-index and the BottomNav paints over the CTA.
  return createPortal(
    <div className="gs-ob" data-theme={theme} role="dialog" aria-modal="true">
      <style>{OB_CSS}</style>

      <div className="screen">
        <div className={`anim a2hs${mode === "guide" && collapsed ? " collapsed" : ""}`}>
          <div className="hero-mark"><Logo size={76} /></div>

          <div className="intro-text">
            <div className="intro-inner">
              <h1 className="title">Add GoodScan to your Home&nbsp;Screen</h1>
              <p className="sub">
                Install it for a full-screen, app-like experience — with faster, offline-ready scans
                and one-tap access.
              </p>
            </div>
          </div>

          {mode === "guide" && (
            <>
              <div className="for-browser">
                <span className="browser-logo"><BrowserMark /></span>
                How to install in {guide.browser}
              </div>
              <div className="steps">
                {guide.steps.map((s, i) => {
                  // Number the action steps; show a check for the final "launch" step.
                  const n = guide.steps.slice(0, i + 1).filter((st) => !st.done).length;
                  return (
                    <div className="step" key={i}>
                      <span className="num">{s.done ? <Check /> : n}</span>
                      <span className="txt">{s.text}</span>
                    </div>
                  );
                })}
              </div>
              {guide.note && <p className="note">{guide.note}</p>}
            </>
          )}

          {mode === "prompt" && (
            <div className="steps">
              <div className="step">
                <span className="num"><Maximize /></span>
                <span className="txt"><b>Full-screen</b> — no browser bars, just GoodScan.</span>
              </div>
              <div className="step">
                <span className="num"><Zap /></span>
                <span className="txt"><b>Faster</b> scans that load instantly.</span>
              </div>
              <div className="step">
                <span className="num"><WifiOff /></span>
                <span className="txt">Works <b>offline</b> wherever you shop.</span>
              </div>
            </div>
          )}

        </div>

        {mode === "prompt" && (
          <div className="footer">
            <button type="button" className="cta" onClick={install}>
              Add to Home Screen
              <ArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
