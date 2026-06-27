import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Loader2, ScanBarcode, AlertCircle, Camera, Keyboard } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";

/**
 * Primary live barcode scanner — the default scan experience, an entirely
 * separate path from the camera/OCR photo-scan flow on the Scan page. It
 * resolves the EXACT product by EAN/UPC lookup (OpenFoodFacts is keyed by
 * barcode), so there is no fuzzy matching.
 *
 * UI: a dimmed "spotlight" aperture frames a wide barcode window; the glass
 * `Barcode | Photo` segmented control switches modes (`onClose` → photo scan);
 * the keypad button opens manual entry for damaged/unreadable codes. The look is
 * shared with the rest of goodscan (wordmark, brand green, glass chrome).
 *
 * Camera ownership: this overlay does NOT open its own camera. It borrows the
 * `MediaStream` the Scan page already started and plays it in its own <video>.
 * One stream can drive multiple <video> elements, so there is no second
 * getUserMedia and no single-camera conflict (notably on iOS Safari). On unmount
 * it only detaches its own element and stops its decode loop — it NEVER stops
 * the stream tracks, leaving the parent page's camera lifecycle untouched.
 *
 * Engine: the native Shape-Detection `BarcodeDetector` (Android/macOS Chrome)
 * when available, otherwise a code-split ZXing fallback (iOS Safari, Firefox).
 */

type Status = "scanning" | "looking-up" | "not-found" | "error";

interface Props {
  /** The live stream owned by the Scan page. Shared, never stopped here. */
  stream: MediaStream | null;
  onClose: () => void;
}

const GREEN = "#3DBA82";
const GREEN_INK = "#06301f"; // dark green for text on the green pill

// Product symbologies only. Restricting formats speeds up decoding and avoids
// false reads from QR codes or other 1D codes printed on packaging.
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

const glassBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  background: "rgba(0,0,0,0.42)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.16)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export function BarcodeScannerOverlay({ stream, onClose }: Props) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(true);
  const handledRef = useRef(false);
  const pausedRef = useRef(false); // true while manual entry is open

  const [status, setStatus] = useState<Status>("scanning");
  const [message, setMessage] = useState("");
  const [entered, setEntered] = useState(false); // drives the controls slide-up
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualLooking, setManualLooking] = useState(false);

  // Slide the bottom controls up on mount (matches the Scan page's capture deck).
  useEffect(() => {
    const t = window.setTimeout(() => setEntered(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    activeRef.current = true;
    handledRef.current = false;
    const video = videoRef.current;

    if (!stream || !video) {
      setStatus("error");
      setMessage("Camera isn't available. Switch to photo to keep scanning.");
      return;
    }

    // Share the parent's stream — no new camera acquisition.
    video.srcObject = stream;
    video.play().catch(() => {});

    const canvas = document.createElement("canvas");
    let nativeDetector: { detect: (s: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } | null = null;
    // ZXing fallback pieces (only loaded if the native API is missing).
    let zxReader: { decode: (b: unknown) => { getText: () => string } } | null = null;
    let zxMake: ((c: HTMLCanvasElement) => unknown) | null = null;
    let cancelled = false;

    const handleCode = async (raw: string) => {
      if (handledRef.current || pausedRef.current) return;
      const cleaned = raw.replace(/\s+/g, "");
      if (!isValidBarcode(cleaned)) return; // ignore non-product / partial reads
      handledRef.current = true;
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      navigator.vibrate?.(40);
      setStatus("looking-up");
      setMessage(cleaned);
      try {
        const result = await lookupBarcode(cleaned);
        if (result.found) {
          navigate(`/product-off/${result.barcode}?from=scan`);
          return;
        }
        setStatus("not-found");
        setMessage(`No match for ${cleaned} yet`);
        window.setTimeout(() => {
          if (cancelled) return;
          handledRef.current = false;
          activeRef.current = true;
          setStatus("scanning");
          setMessage("");
          loop();
        }, 1900);
      } catch {
        setStatus("not-found");
        setMessage("Couldn't reach the database — hold steady");
        window.setTimeout(() => {
          if (cancelled) return;
          handledRef.current = false;
          activeRef.current = true;
          setStatus("scanning");
          setMessage("");
          loop();
        }, 1500);
      }
    };

    const drawFrame = (): HTMLCanvasElement | null => {
      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return null;
      const maxW = 720; // enough detail for thin barcode bars, still cheap
      const scale = Math.min(1, maxW / v.videoWidth);
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      return canvas;
    };

    let lastTick = 0;
    const loop = (ts?: number) => {
      if (!activeRef.current) return;
      rafRef.current = requestAnimationFrame(loop);
      if (pausedRef.current) return; // manual entry open — keep loop alive, skip decode
      const now = ts ?? performance.now();
      if (now - lastTick < 180) return; // throttle decode attempts (~5/s)
      lastTick = now;
      const c = drawFrame();
      if (!c) return;
      if (nativeDetector) {
        nativeDetector
          .detect(c)
          .then((codes) => {
            if (codes && codes.length) handleCode(codes[0].rawValue);
          })
          .catch(() => {});
      } else if (zxReader && zxMake) {
        try {
          const bitmap = zxMake(c);
          const res = zxReader.decode(bitmap);
          if (res) handleCode(res.getText());
        } catch {
          /* NotFoundException — no barcode in this frame */
        }
      }
    };

    (async () => {
      // 1) Native Shape-Detection API where supported.
      const BD = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
      if (BD) {
        try {
          const supported: string[] = (await BD.getSupportedFormats?.()) || [];
          const formats = NATIVE_FORMATS.filter((f) => supported.includes(f));
          nativeDetector = new BD(formats.length ? { formats } : undefined);
        } catch {
          nativeDetector = null;
        }
      }

      // 2) ZXing fallback (code-split — only fetched when needed).
      if (!nativeDetector) {
        try {
          const zx = await import("@zxing/library");
          if (cancelled) return;
          const hints = new Map();
          hints.set(zx.DecodeHintType.POSSIBLE_FORMATS, [
            zx.BarcodeFormat.EAN_13,
            zx.BarcodeFormat.EAN_8,
            zx.BarcodeFormat.UPC_A,
            zx.BarcodeFormat.UPC_E,
          ]);
          hints.set(zx.DecodeHintType.TRY_HARDER, true);
          const reader = new zx.MultiFormatReader();
          reader.setHints(hints);
          zxReader = {
            decode: (b: unknown) => reader.decode(b as never) as { getText: () => string },
          };
          zxMake = (c: HTMLCanvasElement) =>
            new zx.BinaryBitmap(new zx.HybridBinarizer(new zx.HTMLCanvasElementLuminanceSource(c)));
        } catch {
          if (!cancelled) {
            setStatus("error");
            setMessage("Barcode scanning isn't supported on this browser.");
          }
          return;
        }
      }

      if (activeRef.current && !cancelled) loop();
    })();

    return () => {
      cancelled = true;
      activeRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Detach our own element only. The parent owns and keeps the stream alive.
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream, navigate]);

  const openManual = () => {
    pausedRef.current = true;
    setManualError("");
    setManualInput("");
    setManualOpen(true);
  };
  const closeManual = () => {
    pausedRef.current = false;
    setManualOpen(false);
  };
  const submitManual = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = manualInput.replace(/\D/g, "");
    if (!isValidBarcode(code)) {
      setManualError("Enter the 8–13 digits printed under the barcode.");
      return;
    }
    setManualError("");
    setManualLooking(true);
    try {
      const result = await lookupBarcode(code);
      if (result.found) {
        navigate(`/product-off/${result.barcode}?from=scan`);
        return;
      }
      setManualError(`No match for ${code} in the database yet.`);
    } catch {
      setManualError("Couldn't reach the database. Check your connection.");
    }
    setManualLooking(false);
  };

  const cornerStyle = (v: { t?: boolean; b?: boolean; l?: boolean; r?: boolean }): React.CSSProperties => ({
    position: "absolute",
    width: 30,
    height: 30,
    top: v.t ? -1 : undefined,
    bottom: v.b ? -1 : undefined,
    left: v.l ? -1 : undefined,
    right: v.r ? -1 : undefined,
    borderTop: v.t ? `3px solid ${GREEN}` : undefined,
    borderBottom: v.b ? `3px solid ${GREEN}` : undefined,
    borderLeft: v.l ? `3px solid ${GREEN}` : undefined,
    borderRight: v.r ? `3px solid ${GREEN}` : undefined,
    borderTopLeftRadius: v.t && v.l ? 14 : 0,
    borderTopRightRadius: v.t && v.r ? 14 : 0,
    borderBottomLeftRadius: v.b && v.l ? 14 : 0,
    borderBottomRightRadius: v.b && v.r ? 14 : 0,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#000", overflow: "hidden" }}>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* ── Spotlight aperture: a bright barcode window, everything else dimmed ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", width: "84%", maxWidth: 384, aspectRatio: "1.7 / 1" }}>
          {/* The window itself is clear; the huge box-shadow dims the surround. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 0 0 2000px rgba(0,0,0,0.58)",
            }}
          />
          <div style={cornerStyle({ t: true, l: true })} />
          <div style={cornerStyle({ t: true, r: true })} />
          <div style={cornerStyle({ b: true, l: true })} />
          <div style={cornerStyle({ b: true, r: true })} />

          {status === "scanning" && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 22, pointerEvents: "none" }}>
              {/* Soft directional sweep: a thin hairline leads, a faint glow trails
                  above it, both fading in/out — a deliberate scan, not a laser. */}
              <div style={{ position: "absolute", left: 0, right: 0, height: 46, animation: "bcSweep 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(61,186,130,0.18), rgba(61,186,130,0))", borderRadius: 8 }} />
                <div
                  style={{
                    position: "absolute",
                    left: "6%",
                    right: "6%",
                    bottom: 0,
                    height: 1.5,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, rgba(61,186,130,0) 0%, rgba(61,186,130,0.85) 24%, rgba(255,255,255,0.92) 50%, rgba(61,186,130,0.85) 76%, rgba(61,186,130,0) 100%)",
                    boxShadow: "0 0 5px rgba(61,186,130,0.3)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 4,
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 22px" }}>
          <Link to="/" aria-label="Exit scanner" style={{ textDecoration: "none" }}>
            <div style={glassBtn}>
              <X size={18} color="#fff" />
            </div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
            <span style={{ fontFamily: DS.font, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, whiteSpace: "nowrap" }}>
              <span style={{ color: "#fff" }}>good</span>
              <span style={{ color: GREEN }}>scan</span>
            </span>
          </div>
          <button onClick={openManual} aria-label="Enter barcode number" style={glassBtn}>
            <Keyboard size={18} color="#fff" />
          </button>
        </div>
      </div>

      {/* ── Status line, just above the controls ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 128px)",
          zIndex: 4,
          display: "flex",
          justifyContent: "center",
          padding: "0 24px",
          pointerEvents: "none",
        }}
      >
        {status === "scanning" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.42)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 50,
              padding: "7px 15px",
            }}
          >
            <ScanBarcode size={15} color={GREEN} strokeWidth={2.2} />
            <span style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.82rem", fontWeight: 600 }}>Point at a barcode</span>
          </div>
        )}
        {status === "looking-up" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 50,
              padding: "7px 15px",
            }}
          >
            <Loader2 size={15} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.82rem", fontWeight: 600 }}>Looking up {message}…</span>
          </div>
        )}
        {(status === "not-found" || status === "error") && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 50,
              padding: "8px 16px",
            }}
          >
            <AlertCircle size={15} color={DS.warn} />
            <span style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.82rem", fontWeight: 600 }}>{message}</span>
          </div>
        )}
      </div>

      {/* ── Bottom: Barcode | Photo segmented control (slides up on mount) ── */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 26px)",
          transform: entered ? "translateX(-50%)" : "translate(-50%, calc(100% + env(safe-area-inset-bottom, 0px) + 40px))",
          opacity: entered ? 1 : 0,
          transition: "transform 540ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms ease-out",
          zIndex: 4,
        }}
      >
        <div
          role="tablist"
          aria-label="Scan mode"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 999,
            background: "rgba(20,20,22,0.72)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div
            role="tab"
            aria-selected="true"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              height: 44,
              padding: "0 22px",
              borderRadius: 999,
              background: GREEN,
            }}
          >
            <ScanBarcode size={17} color={GREEN_INK} strokeWidth={2.4} />
            <span style={{ fontFamily: DS.font, fontWeight: 700, fontSize: "0.9rem", color: GREEN_INK }}>Barcode</span>
          </div>
          <button
            role="tab"
            aria-selected="false"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              height: 44,
              padding: "0 22px",
              borderRadius: 999,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Camera size={17} color="rgba(255,255,255,0.82)" strokeWidth={2} />
            <span style={{ fontFamily: DS.font, fontWeight: 600, fontSize: "0.9rem", color: "rgba(255,255,255,0.82)" }}>Photo</span>
          </button>
        </div>
      </div>

      {/* ── Manual entry sheet (matches the Scan page's other bottom sheets) ── */}
      {manualOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 6,
            background: DS.bg,
            borderRadius: "20px 20px 0 0",
            padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.22)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: DS.goodBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ScanBarcode size={18} color={DS.good} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 800, fontSize: "0.95rem", color: DS.ink, margin: 0 }}>Enter barcode number</p>
              <p style={{ fontSize: "0.78rem", color: DS.muted, margin: 0, lineHeight: 1.4 }}>Type the digits printed under the barcode.</p>
            </div>
            <button onClick={closeManual} aria-label="Cancel" style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={18} color={DS.muted} />
            </button>
          </div>
          <form onSubmit={submitManual} style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. 5012345678900"
              style={{
                flex: 1,
                minWidth: 0,
                height: 50,
                border: `1.5px solid ${DS.hair}`,
                borderRadius: 14,
                background: DS.bg,
                fontSize: "1rem",
                letterSpacing: "0.04em",
                fontFamily: DS.mono,
                padding: "0 14px",
                outline: "none",
                color: DS.ink,
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || manualLooking}
              style={{
                height: 50,
                borderRadius: 14,
                border: "none",
                background: manualInput.trim() ? DS.good : DS.hair,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                padding: "0 22px",
                cursor: manualInput.trim() ? "pointer" : "default",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {manualLooking ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : "Go"}
            </button>
          </form>
          {manualError && (
            <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: DS.warn, fontWeight: 600, margin: "12px 2px 0" }}>
              <AlertCircle size={14} /> {manualError}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes bcSweep {
          0%   { top: 2%;  opacity: 0; }
          16%  { opacity: 1; }
          84%  { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
