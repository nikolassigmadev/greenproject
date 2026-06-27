import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Loader2, ScanBarcode, AlertCircle, Camera, Keyboard, Search, Upload } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";
import { smartProductSearch } from "@/utils/smartProductSearch";
import { logScan } from "@/utils/scanLogger";

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
  /** Hand a captured/uploaded photo (data URL) to the parent's analysis flow.
   *  May be async — the overlay awaits it to know when analysis finished. */
  onPhoto?: (imageDataUrl: string) => void | Promise<void>;
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

export function BarcodeScannerOverlay({ stream, onClose, onPhoto }: Props) {
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searchLooking, setSearchLooking] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [kbOffset, setKbOffset] = useState(0); // on-screen keyboard height (px)
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pillWidth, setPillWidth] = useState<number | undefined>(undefined);
  const pillRef = useRef<HTMLDivElement>(null);
  const restWidthRef = useRef<number | undefined>(undefined);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Keep the morphing control pinned just above the on-screen keyboard while the
  // search field is focused. The visual viewport shrinks by the keyboard height,
  // so the overlap = layout height − visual height − its top offset.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!searchOpen || !vv) { setKbOffset(0); return; }
    const update = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(overlap);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKbOffset(0);
    };
  }, [searchOpen]);

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

  // Lock the pill at its current (tab) width, then grow to `target` on the next
  // frame so the width change actually tweens instead of jumping.
  const growPill = (target: number, after: () => void) => {
    const w = pillRef.current?.offsetWidth;
    restWidthRef.current = w;
    setPillWidth(w);
    requestAnimationFrame(() => {
      after();
      setPillWidth(Math.min(window.innerWidth * 0.9, target));
    });
  };
  // Collapse back to the tab width, then release to auto once settled.
  const shrinkPill = () => {
    setPillWidth(restWidthRef.current);
    window.setTimeout(() => setPillWidth(undefined), 380);
  };

  const openSearch = () => {
    pausedRef.current = true;
    setSearchError("");
    setSearchInput("");
    growPill(380, () => setSearchOpen(true));
  };
  const closeSearch = () => {
    pausedRef.current = false;
    setSearchOpen(false);
    setSearchError("");
    shrinkPill();
  };

  const openPhoto = () => {
    pausedRef.current = true;
    growPill(256, () => setPhotoOpen(true));
  };
  const closePhoto = () => {
    pausedRef.current = false;
    setPhotoOpen(false);
    shrinkPill();
  };
  // Run analysis without leaving the camera screen: freeze the captured frame as
  // a backdrop, show our own "analyzing" layer (which covers the parent's
  // full-screen scan UI), and await the parent. A confident match navigates away
  // and a no-match unmounts us via the parent's render gate — so the code after
  // the await only runs when analysis errored, where we resume scanning.
  const submitPhoto = async (img: string) => {
    if (!onPhoto) { onClose(); return; }
    pausedRef.current = true; // ignore live barcode reads while analyzing
    setCapturedImage(img);
    setPhotoOpen(false);
    setAnalyzing(true);
    try {
      await onPhoto(img);
    } finally {
      // A confident match navigates away and a no-match unmounts us via the
      // parent's render gate — both within a tick. If we're STILL mounted a
      // moment later, analysis genuinely errored: resume scanning.
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setAnalyzing(false);
        setCapturedImage(null);
        setStatus("not-found");
        setMessage("Couldn't read that photo — try again");
        window.setTimeout(() => {
          if (!mountedRef.current) return;
          pausedRef.current = false;
          setStatus("scanning");
          setMessage("");
        }, 1800);
      }, 400);
    }
  };
  const takePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    submitPhoto(c.toDataURL("image/jpeg", 0.95));
  };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => submitPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };
  const submitSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = searchInput.trim();
    if (query.length < 2) {
      setSearchError("Type a product or brand name to search.");
      return;
    }
    setSearchError("");
    setSearchLooking(true);
    try {
      const { product, cleanedQuery } = await smartProductSearch(query);
      if (product?.barcode) {
        navigate(`/product-off/${product.barcode}?from=scan`);
        return;
      }
      // Capture the unmet search so it's visible in Supabase (resolved=false).
      logScan({
        name: query,
        resolved: false,
        verdict: "UNKNOWN",
        fullOpenaiResponse: cleanedQuery && cleanedQuery !== query ? `typed: "${query}" → cleaned: "${cleanedQuery}"` : null,
      });
      setSearchError(`No match for "${query}" yet. Try another name.`);
    } catch {
      setSearchError("Couldn't reach the database. Check your connection.");
    }
    setSearchLooking(false);
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
        <div
          style={{
            position: "relative",
            width: "84%",
            maxWidth: 384,
            // Barcode mode uses a short, wide slot; photo mode opens up to a
            // normal (portrait-ish) photo frame so the framing matches what
            // you're capturing.
            aspectRatio: photoOpen ? "4 / 5" : "1.7 / 1",
            transition: "aspect-ratio 420ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
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

          {status === "scanning" && !photoOpen && (
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

      {/* ── Analyzing layer: the captured frame stays put as the backdrop while
           the product is identified, so we never jump to a separate scan page. ── */}
      {analyzing && capturedImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            animation: "searchFieldIn 240ms ease-out both",
          }}
        >
          <img
            src={capturedImage}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              borderRadius: 999,
              background: "rgba(20,20,22,0.72)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.32)",
            }}
          >
            <Loader2 size={18} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontFamily: DS.font, fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>Analyzing photo…</span>
          </div>
        </div>
      )}

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

      {/* ── Bottom: segmented control that morphs into a search field ── */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: kbOffset > 0
            ? `${kbOffset + 14}px`
            : "calc(env(safe-area-inset-bottom, 0px) + 26px)",
          transform: entered
            ? `translateX(calc(-50% - ${searchOpen || photoOpen ? 14 : 0}px))`
            : "translate(-50%, calc(100% + env(safe-area-inset-bottom, 0px) + 40px))",
          opacity: entered ? 1 : 0,
          transition: "transform 540ms cubic-bezier(0.32, 0.72, 0, 1), bottom 220ms ease-out, opacity 320ms ease-out",
          zIndex: 11,
        }}
      >
        {/* Search error floats just above the pill so the box stays compact. */}
        {searchOpen && searchError && (
          <p
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: DS.font,
              fontSize: "0.76rem",
              fontWeight: 600,
              color: "#fff",
              margin: 0,
              padding: "7px 12px",
              borderRadius: 12,
              background: "rgba(20,20,22,0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              animation: "searchFieldIn 220ms ease-out both",
            }}
          >
            <AlertCircle size={14} /> {searchError}
          </p>
        )}
        <div
          ref={pillRef}
          role="tablist"
          aria-label="Scan mode"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 4,
            height: 52,
            boxSizing: "border-box",
            width: pillWidth ? `${pillWidth}px` : "auto",
            transform: searchOpen || photoOpen ? "scale(1.05)" : "scale(1)",
            transformOrigin: "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
            borderRadius: 999,
            background: "rgba(20,20,22,0.72)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)",
            transition: "width 380ms cubic-bezier(0.32, 0.72, 0, 1), transform 380ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {searchOpen ? (
            <form
              onSubmit={submitSearch}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "0 4px 0 12px",
                animation: "searchFieldIn 300ms ease-out both",
              }}
            >
              <Search size={17} color={GREEN} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <input
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search product or brand…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 40,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontFamily: DS.font,
                  fontSize: "0.92rem",
                  color: "#fff",
                }}
              />
              <button
                type="submit"
                aria-label="Search"
                disabled={!searchInput.trim() || searchLooking}
                style={{
                  height: 38,
                  minWidth: 38,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: "none",
                  background: searchInput.trim() ? GREEN : "rgba(255,255,255,0.14)",
                  color: GREEN_INK,
                  fontFamily: DS.font,
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: searchInput.trim() ? "pointer" : "default",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {searchLooking ? <Loader2 size={16} color={GREEN_INK} style={{ animation: "spin 1s linear infinite" }} /> : "Go"}
              </button>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Cancel search"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={18} color="rgba(255,255,255,0.7)" />
              </button>
            </form>
          ) : photoOpen ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                padding: "0 6px",
                animation: "searchFieldIn 300ms ease-out both",
              }}
            >
              <button
                type="button"
                onClick={takePhoto}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 44,
                  padding: "0 22px",
                  borderRadius: 999,
                  border: "none",
                  background: GREEN,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Camera size={17} color={GREEN_INK} strokeWidth={2.4} />
                <span style={{ fontFamily: DS.font, fontWeight: 700, fontSize: "0.88rem", color: GREEN_INK }}>Take photo</span>
              </button>
              <button
                type="button"
                onClick={() => photoFileRef.current?.click()}
                aria-label="Upload image"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Upload size={18} color="#fff" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={closePhoto}
                aria-label="Cancel photo"
                style={{
                  width: 34,
                  height: 44,
                  borderRadius: 999,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={18} color="rgba(255,255,255,0.6)" />
              </button>
            </div>
          ) : (
            <>
              <div
                role="tab"
                aria-selected="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 44,
                  padding: "0 17px",
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
                onClick={openPhoto}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 44,
                  padding: "0 17px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Camera size={17} color="rgba(255,255,255,0.82)" strokeWidth={2} />
                <span style={{ fontFamily: DS.font, fontWeight: 600, fontSize: "0.9rem", color: "rgba(255,255,255,0.82)" }}>Photo</span>
              </button>
              <button
                role="tab"
                aria-selected="false"
                onClick={openSearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 44,
                  padding: "0 17px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Search size={17} color="rgba(255,255,255,0.82)" strokeWidth={2} />
                <span style={{ fontFamily: DS.font, fontWeight: 600, fontSize: "0.9rem", color: "rgba(255,255,255,0.82)" }}>Search</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden picker backing the Photo → Upload action. */}
      <input
        ref={photoFileRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: "none" }}
      />

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
        @keyframes searchFieldIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
