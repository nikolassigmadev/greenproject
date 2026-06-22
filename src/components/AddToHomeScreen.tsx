import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { ArrowRight, Check, Maximize, WifiOff, Zap, MoreVertical } from "lucide-react";
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

  const isIOS = useMemo(
    () =>
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPadOS 13+ reports as Mac; disambiguate by touch support
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    [],
  );

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

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

  const mode: "prompt" | "ios" | "generic" = deferred ? "prompt" : isIOS ? "ios" : "generic";

  // Rendered through a portal to document.body so the fixed full-screen overlay
  // sits in the root stacking context — otherwise the page's `.page-transition`
  // animation traps its z-index and the BottomNav paints over the CTA.
  return createPortal(
    <div className="gs-ob" data-theme={theme} role="dialog" aria-modal="true">
      <style>{OB_CSS}</style>

      <div className="screen">
        <div className="anim a2hs">
          <div className="hero-mark"><Logo size={76} /></div>
          <h1 className="title">Add GoodScan to your Home&nbsp;Screen</h1>
          <p className="sub">
            Install it for a full-screen, app-like experience — with faster, offline-ready scans
            and one-tap access.
          </p>

          {mode === "ios" && (
            <div className="steps">
              <div className="step">
                <span className="num">1</span>
                <span className="txt">
                  Tap the <span className="ios-ic"><ShareGlyph /></span> <b>Share</b> button in the browser toolbar.
                </span>
              </div>
              <div className="step">
                <span className="num">2</span>
                <span className="txt">
                  Scroll down and choose <span className="ios-ic"><PlusSquareGlyph /></span> <b>Add to Home Screen</b>.
                </span>
              </div>
              <div className="step">
                <span className="num">3</span>
                <span className="txt">
                  Tap <b>Add</b>, then open <b>GoodScan</b> from your Home Screen.
                </span>
              </div>
            </div>
          )}

          {mode === "generic" && (
            <div className="steps">
              <div className="step">
                <span className="num"><MoreVertical /></span>
                <span className="txt">Open your browser menu.</span>
              </div>
              <div className="step">
                <span className="num">2</span>
                <span className="txt">
                  Choose <b>Install app</b> or <b>Add to Home Screen</b>.
                </span>
              </div>
              <div className="step">
                <span className="num"><Check /></span>
                <span className="txt">Launch <b>GoodScan</b> from your Home Screen.</span>
              </div>
            </div>
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
