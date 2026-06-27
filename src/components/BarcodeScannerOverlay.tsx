import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Loader2, ScanBarcode, AlertCircle, Camera } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";

/**
 * Primary live barcode scanner — the default scan experience, an entirely
 * separate path from the camera/OCR photo-scan flow on the Scan page. It
 * resolves the EXACT product by EAN/UPC lookup (OpenFoodFacts is keyed by
 * barcode), so there is no fuzzy matching. The top-right "Photo" toggle
 * (`onClose`) switches to the camera/OCR scan; "Barcode" up top switches back.
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

// Product symbologies only. Restricting formats speeds up decoding and avoids
// false reads from QR codes or other 1D codes printed on packaging.
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

const roundBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 19,
  background: "rgba(0,0,0,0.4)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
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

  const [status, setStatus] = useState<Status>("scanning");
  const [message, setMessage] = useState("");

  useEffect(() => {
    activeRef.current = true;
    handledRef.current = false;
    const video = videoRef.current;

    if (!stream || !video) {
      setStatus("error");
      setMessage("Camera isn't available. Close and use the photo scan instead.");
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
      if (handledRef.current) return;
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
        // Valid barcode but not in OpenFoodFacts — resume scanning shortly.
        setStatus("not-found");
        setMessage(`No match for ${cleaned} in the database yet.`);
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
        setMessage("Lookup failed — keep the barcode steady.");
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        // Sit ABOVE the camera viewfinder + page top controls (z20) but BELOW the
        // shared capture-deck footer (z49) and the page's modal sheets (z40/50),
        // so the Scan page's real footer — with its own slide animation and
        // handlers — shows through unchanged. The parent only mounts this overlay
        // when no sheet is open, so nothing it should sit under is ever active.
        zIndex: 45,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Dark scrim for legibility over any camera content */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.34)" }} />

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px 24px",
          }}
        >
          {/* Exit the scanner entirely */}
          <Link to="/" aria-label="Exit scanner" style={{ textDecoration: "none" }}>
            <div style={roundBtn}>
              <X size={17} color="#fff" />
            </div>
          </Link>
          {/* Current mode */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
            <ScanBarcode size={18} color="#3DBA82" strokeWidth={2.2} />
            <span style={{ fontFamily: DS.font, fontSize: "0.95rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              Barcode
            </span>
          </div>
          {/* Switch to the camera/OCR photo scan */}
          <button
            onClick={onClose}
            aria-label="Switch to photo scan"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 38,
              padding: "0 13px",
              borderRadius: 19,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.16)",
              cursor: "pointer",
            }}
          >
            <Camera size={16} color="#fff" />
            <span style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Photo
            </span>
          </button>
        </div>
      </div>

      {/* Reticle */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "80%", maxWidth: 360, aspectRatio: "1.55 / 1", position: "relative" }}>
          {([
            { top: 0, left: 0, borderTop: true, borderLeft: true },
            { top: 0, right: 0, borderTop: true, borderRight: true },
            { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
            { bottom: 0, right: 0, borderBottom: true, borderRight: true },
          ] as const).map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 34,
                height: 34,
                top: "top" in c ? (c as any).top : undefined,
                bottom: "bottom" in c ? (c as any).bottom : undefined,
                left: "left" in c ? (c as any).left : undefined,
                right: "right" in c ? (c as any).right : undefined,
                borderTop: (c as any).borderTop ? "3px solid #3DBA82" : undefined,
                borderBottom: (c as any).borderBottom ? "3px solid #3DBA82" : undefined,
                borderLeft: (c as any).borderLeft ? "3px solid #3DBA82" : undefined,
                borderRight: (c as any).borderRight ? "3px solid #3DBA82" : undefined,
                borderTopLeftRadius: (c as any).borderTop && (c as any).borderLeft ? 10 : 0,
                borderTopRightRadius: (c as any).borderTop && (c as any).borderRight ? 10 : 0,
                borderBottomLeftRadius: (c as any).borderBottom && (c as any).borderLeft ? 10 : 0,
                borderBottomRightRadius: (c as any).borderBottom && (c as any).borderRight ? 10 : 0,
              }}
            />
          ))}
          {status === "scanning" && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 12, pointerEvents: "none" }}>
              {/* One soft, directional sweep: a thin hairline leads, a faint glow
                  trails above it, both fading in/out at the ends. No hard neon
                  laser — it reads as a deliberate scan, not a stock effect. */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 46,
                  animation: "bcSweep 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(61,186,130,0.18), rgba(61,186,130,0))",
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "7%",
                    right: "7%",
                    bottom: 0,
                    height: 1.5,
                    borderRadius: 2,
                    background:
                      "linear-gradient(90deg, rgba(61,186,130,0) 0%, rgba(61,186,130,0.85) 24%, rgba(255,255,255,0.92) 50%, rgba(61,186,130,0.85) 76%, rgba(61,186,130,0) 100%)",
                    boxShadow: "0 0 5px rgba(61,186,130,0.3)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status — floats just ABOVE the shared capture-deck footer so the two
          never overlap. The footer (rendered by the Scan page) owns the very
          bottom of the screen. */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 112px)",
          left: 0,
          right: 0,
          zIndex: 3,
          padding: "0 28px",
          textAlign: "center",
        }}
      >
        {status === "scanning" && (
          <p style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.9rem", fontWeight: 600, margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
            Line up the product's barcode inside the frame
          </p>
        )}
        {status === "looking-up" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: DS.font, fontSize: "0.9rem", fontWeight: 600 }}>Looking up {message}…</span>
          </div>
        )}
        {(status === "not-found" || status === "error") && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 50,
              padding: "8px 16px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <AlertCircle size={15} color={DS.warn} />
            <span style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.82rem", fontWeight: 600 }}>{message}</span>
          </div>
        )}
      </div>

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
