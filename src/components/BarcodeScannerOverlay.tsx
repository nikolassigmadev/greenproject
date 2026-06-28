import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { X, Loader2, ScanBarcode, AlertCircle, Camera, Keyboard, Search, Upload } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";
import { extractBarcode } from "@/utils/gs1";
import { smartProductSearch } from "@/utils/smartProductSearch";
import { logScan } from "@/utils/scanLogger";
import { advancedProductOCR } from "@/services/ocr/advanced-openai-ocr";
import { useStableViewportHeight } from "@/hooks/useStableViewportHeight";

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

// Retail product symbologies. 1D EAN/UPC plus the 2D codes (QR carrying a GS1
// Digital Link, and DataMatrix) that products are migrating to under GS1's
// "Sunrise 2027" — all decode to a GTIN we parse out via extractBarcode().
const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "data_matrix"];

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false); // playing the collapse animation
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
  const rootRef = useRef<HTMLDivElement>(null);

  // Defeat the iOS standalone-PWA `100vh` bug (black strip along the bottom that
  // only clears once you scroll). See the hook for the full explanation.
  useStableViewportHeight(rootRef);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Keep the morphing control pinned just above the on-screen keyboard while the
  // search field OR the manual-entry sheet is focused. The visual viewport shrinks
  // by the keyboard height, so the overlap = layout height − visual height − its top offset.
  useEffect(() => {
    const vv = window.visualViewport;
    if ((!searchOpen && !manualOpen) || !vv) { setKbOffset(0); return; }
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
  }, [searchOpen, manualOpen]);

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
      // Accept 1D EAN/UPC and 2D GS1 codes alike — extract the GTIN from either.
      const cleaned = extractBarcode(raw);
      if (!cleaned || !isValidBarcode(cleaned)) return; // ignore non-product / partial reads
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
            zx.BarcodeFormat.QR_CODE,
            zx.BarcodeFormat.DATA_MATRIX,
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
    // Handle a pasted GS1 Digital Link / element string too, not just raw digits.
    const code = extractBarcode(manualInput) ?? manualInput.replace(/\D/g, "");
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
      // Cap at `target`, but always leave a clear margin on each side so the pill
      // stays centered and never runs edge-to-edge on narrow screens.
      setPillWidth(Math.min(window.innerWidth - 48, target));
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
    setSearchClosing(false);
    setSearchOpen(true);
  };
  // Animated collapse: play the circular reveal in reverse, then unmount the
  // full-screen panel and resume the live barcode scan.
  const closeSearch = () => {
    setSearchClosing(true);
    window.setTimeout(() => {
      if (!mountedRef.current) return;
      setSearchOpen(false);
      setSearchClosing(false);
      setSearchError("");
      pausedRef.current = false;
    }, 300);
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
  // Photo capture: OpenAI identifies the product NAME from the photo, we search
  // Open Food Facts for that name to resolve a barcode, then open the product —
  // same destination as a barcode scan, but the user just points at the product.
  // (If the model also read a barcode off the pack, we take that shortcut first.)
  const resumeScanning = (msg: string) => {
    if (!mountedRef.current) return;
    setAnalyzing(false);
    setCapturedImage(null);
    setStatus("not-found");
    setMessage(msg);
    window.setTimeout(() => {
      if (!mountedRef.current) return;
      pausedRef.current = false;
      setStatus("scanning");
      setMessage("");
    }, 1900);
  };
  const submitPhoto = async (img: string) => {
    pausedRef.current = true; // ignore live barcode reads while we work
    setCapturedImage(img);
    setPhotoOpen(false);
    setPillWidth(undefined); // release the photo-mode pill width back to auto
    setAnalyzing(true);
    try {
      const ocr = await advancedProductOCR(img);

      // Shortcut: a barcode read straight off the pack is the most accurate hit.
      const code = ocr.barcode?.replace(/\s+/g, "");
      if (code && isValidBarcode(code)) {
        const direct = await lookupBarcode(code);
        if (direct.found) {
          navigate(`/product-off/${direct.barcode}?from=scan`);
          return;
        }
      }

      // Otherwise: search Open Food Facts by the identified name → resolve a barcode.
      const clean = (s?: string) => {
        const t = (s || "").trim();
        return t && t.toLowerCase() !== "unknown" && t.toLowerCase() !== "none" ? t : "";
      };
      const name = [clean(ocr.brandName), clean(ocr.productName)].filter(Boolean).join(" ").trim();
      if (name) {
        const { product } = await smartProductSearch(name);
        if (product?.barcode) {
          navigate(`/product-off/${product.barcode}?from=scan`);
          return;
        }
        logScan({ name, resolved: false, verdict: "UNKNOWN", image: ocr.compressedBase64 ?? null });
        resumeScanning(`No match for "${name}" yet`);
        return;
      }

      // OpenAI couldn't identify the product at all.
      logScan({ name: "Unknown product", resolved: false, verdict: "UNKNOWN", image: ocr.compressedBase64 ?? null });
      resumeScanning("Couldn't identify that — try again");
    } catch {
      resumeScanning("Couldn't reach the scanner — try again");
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
      // aiBarcode: also ask OpenAI for the product's barcode from the typed text
      // (the text analogue of reading a barcode off a scanned photo).
      const { product, cleanedQuery } = await smartProductSearch(query, { aiBarcode: true });
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
    width: 52,
    height: 52,
    top: v.t ? -2 : undefined,
    bottom: v.b ? -2 : undefined,
    left: v.l ? -2 : undefined,
    right: v.r ? -2 : undefined,
    borderTop: v.t ? `2px solid #fff` : undefined,
    borderBottom: v.b ? `2px solid #fff` : undefined,
    borderLeft: v.l ? `2px solid #fff` : undefined,
    borderRight: v.r ? `2px solid #fff` : undefined,
    borderTopLeftRadius: v.t && v.l ? 20 : 0,
    borderTopRightRadius: v.t && v.r ? 20 : 0,
    borderBottomLeftRadius: v.b && v.l ? 20 : 0,
    borderBottomRightRadius: v.b && v.r ? 20 : 0,
  });

  // Root is sized from viewport BOUNDS (top:0 + bottom:0), never a `vh` unit:
  // in an installed iOS PWA `100vh`/`100dvh` under-compute on launch and leave a
  // black strip at the bottom until you scroll. `useStableViewportHeight` adds a
  // JS minHeight = window.innerHeight safety net for the same reason.
  return (
    <div ref={rootRef} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, background: "#000", overflow: "hidden" }}>
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
            // Barcode mode uses a short, wide slot; photo mode opens up to a
            // large portrait photo frame so there's plenty of room to fit the
            // product. It's nudged upward (translateY) to fill the empty space
            // under the top bar instead of sitting dead-centre, and maxHeight
            // keeps it clear of the controls/hint on shorter screens.
            width: photoOpen ? "92%" : "84%",
            maxWidth: photoOpen ? 440 : 384,
            aspectRatio: photoOpen ? "3 / 4" : "1.7 / 1",
            maxHeight: photoOpen ? "calc(100dvh - 290px)" : undefined,
            transform: photoOpen ? "translateY(-32px)" : "translateY(0)",
            transition:
              "aspect-ratio 420ms cubic-bezier(0.32, 0.72, 0, 1), width 420ms cubic-bezier(0.32, 0.72, 0, 1), max-width 420ms cubic-bezier(0.32, 0.72, 0, 1), transform 420ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* The window itself is clear; the huge box-shadow dims the surround. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              boxShadow: "0 0 0 2000px rgba(0,0,0,0.62), inset 0 0 0 1px rgba(61,186,130,0.18), inset 0 0 32px rgba(61,186,130,0.05)",
            }}
          />
          <div className="scanCorner" style={cornerStyle({ t: true, l: true })} />
          <div className="scanCorner" style={cornerStyle({ t: true, r: true })} />
          <div className="scanCorner" style={cornerStyle({ b: true, l: true })} />
          <div className="scanCorner" style={cornerStyle({ b: true, r: true })} />

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

      {/* ── Bottom fade: a soft shadow that eases the camera into pure black at
           the very bottom. In an installed iOS PWA a thin black home-indicator
           strip can still sit below the viewfinder; fading the feed to #000 here
           makes that strip read as an intentional vignette instead of a hard
           seam. Sits above the dimmed feed (z2) but below the controls (z11). ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 190,
          zIndex: 3,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, #000 0%, #000 12%, rgba(0,0,0,0.55) 46%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* ── Analyzing layer: the captured frame stays put as the backdrop while
           the product is identified, so we never jump to a separate scan page. ── */}
      {/* z-index 12 keeps this above the bottom controls (z-11) so the resting
          Barcode/Photo/Search toggle never bleeds through while identifying. */}
      {analyzing && capturedImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 12,
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
            <span style={{ fontFamily: DS.font, fontWeight: 700, fontSize: "0.92rem", color: "#fff" }}>Identifying product…</span>
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
        {/* Barcode mode shows a "Point at a barcode" hint; photo mode has its own
            framing + "Take photo" button, so no guidance pill there. */}
        {status === "scanning" && !photoOpen && (
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
            <span style={{ color: "#fff", fontFamily: DS.font, fontSize: "0.82rem", fontWeight: 600 }}>
              Point at a barcode
            </span>
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
          transform: entered && !manualOpen && !searchOpen
            ? "translateX(-50%)"
            : "translate(-50%, calc(100% + env(safe-area-inset-bottom, 0px) + 40px))",
          opacity: entered && !manualOpen && !searchOpen ? 1 : 0,
          pointerEvents: entered && !manualOpen && !searchOpen ? "auto" : "none",
          transition: "transform 540ms cubic-bezier(0.32, 0.72, 0, 1), bottom 220ms ease-out, opacity 320ms ease-out",
          zIndex: 11,
        }}
      >
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
            transform: photoOpen ? "scale(1.05)" : "scale(1)",
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
          {photoOpen ? (
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
                  position: "relative",
                  overflow: "hidden",
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
                  // Gentle breathing pulse to flag this as the action that
                  // captures the product.
                  animation: "takePhotoBreathe 2.6s ease-in-out infinite",
                }}
              >
                {/* Light glint that sweeps across the button on a loop. */}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: "45%",
                    background:
                      "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                    animation: "takePhotoShimmer 2.6s ease-in-out infinite",
                    pointerEvents: "none",
                  }}
                />
                <Camera
                  size={17}
                  color={GREEN_INK}
                  strokeWidth={2.4}
                  style={{ position: "relative", animation: "cameraNudge 2.6s ease-in-out infinite" }}
                />
                <span style={{ position: "relative", fontFamily: DS.font, fontWeight: 700, fontSize: "0.88rem", color: GREEN_INK }}>Take photo</span>
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

      {/* ── Full-screen search ──────────────────────────────────────────────
           Tapping the Search tab opens this over the whole scanner with a
           circular reveal that wipes away the barcode UI (origin = the Search
           tab's spot, bottom-centre). Collapses with the same animation in
           reverse via the X or by tapping the empty area below the field. ── */}
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            background: "rgba(8,9,11,0.94)",
            backdropFilter: "blur(26px) saturate(140%)",
            WebkitBackdropFilter: "blur(26px) saturate(140%)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            animation: searchClosing
              ? "searchRevealOut 280ms cubic-bezier(0.4, 0, 1, 1) forwards"
              : "searchRevealIn 440ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          {/* Header: title + big, obvious collapse button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 0" }}>
            <span style={{ fontFamily: DS.font, fontSize: "1.1rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              Search
            </span>
            <button onClick={closeSearch} aria-label="Close search" style={glassBtn}>
              <X size={18} color="#fff" />
            </button>
          </div>

          {/* Search field */}
          <form
            onSubmit={submitSearch}
            style={{
              padding: "20px 16px 0",
              animation: searchClosing ? undefined : "searchContentIn 460ms ease-out 90ms both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 58,
                padding: "0 8px 0 16px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.08)",
                border: `1px solid ${searchInput.trim() ? "rgba(61,186,130,0.5)" : "rgba(255,255,255,0.12)"}`,
                transition: "border-color 0.2s",
              }}
            >
              <Search size={20} color={GREEN} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <input
                autoFocus
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search product or brand…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontFamily: DS.font,
                  fontSize: "1.02rem",
                  color: "#fff",
                }}
              />
              <button
                type="submit"
                aria-label="Search"
                disabled={!searchInput.trim() || searchLooking}
                style={{
                  height: 44,
                  minWidth: 56,
                  padding: "0 18px",
                  borderRadius: 14,
                  border: "none",
                  background: searchInput.trim() ? GREEN : "rgba(255,255,255,0.14)",
                  color: GREEN_INK,
                  fontFamily: DS.font,
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: searchInput.trim() ? "pointer" : "default",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {searchLooking ? <Loader2 size={17} color={GREEN_INK} style={{ animation: "spin 1s linear infinite" }} /> : "Go"}
              </button>
            </div>
            {searchError && (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: DS.font,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: DS.warn,
                  margin: "12px 4px 0",
                }}
              >
                <AlertCircle size={14} /> {searchError}
              </p>
            )}
          </form>

          {/* Empty state / hint — also a generous tap target to collapse. */}
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "0 36px",
              // Reserve the keyboard's height at the bottom so the centred hint
              // lifts above it instead of hiding behind it when the field focuses.
              paddingBottom: kbOffset,
              textAlign: "center",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              transition: "padding-bottom 240ms cubic-bezier(0.22, 1, 0.36, 1)",
              animation: searchClosing ? undefined : "searchContentIn 460ms ease-out 170ms both",
            }}
          >
            <div style={{ width: 66, height: 66, borderRadius: 22, background: "rgba(61,186,130,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={28} color={GREEN} strokeWidth={1.8} />
            </div>
            <span style={{ fontFamily: DS.font, fontSize: "0.98rem", fontWeight: 700, color: "#fff" }}>
              Search any product or brand
            </span>
            <span style={{ fontFamily: DS.font, fontSize: "0.84rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.55, maxWidth: 280 }}>
              Type a name and we'll pull up its ethics score. Tap anywhere here to go back to scanning.
            </span>
          </button>
        </div>
      )}

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
            padding: `20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px + ${kbOffset}px)`,
            transition: "padding-bottom 220ms ease-out",
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
              onBlur={() => { if (!manualInput.trim()) closeManual(); }}
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
        @keyframes searchRevealIn {
          from { clip-path: circle(0% at 50% 96%); opacity: 0.4; }
          to   { clip-path: circle(150% at 50% 96%); opacity: 1; }
        }
        @keyframes searchRevealOut {
          from { clip-path: circle(150% at 50% 96%); opacity: 1; }
          to   { clip-path: circle(0% at 50% 96%); opacity: 0; }
        }
        @keyframes searchContentIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes takePhotoBreathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.035); }
        }
        @keyframes takePhotoShimmer {
          0%        { transform: translateX(-180%) skewX(-18deg); }
          55%, 100% { transform: translateX(360%) skewX(-18deg); }
        }
        @keyframes cameraNudge {
          0%, 72%, 100% { transform: scale(1) rotate(0deg); }
          80%           { transform: scale(1.22) rotate(-7deg); }
          90%           { transform: scale(1.1) rotate(5deg); }
        }
        @keyframes scanCornerPulse {
          0%, 100% {
            opacity: 0.55;
            filter: drop-shadow(0 0 2px rgba(255,255,255,0.2));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(61,186,130,0.9)) drop-shadow(0 0 16px rgba(61,186,130,0.4));
          }
        }
        .scanCorner { animation: scanCornerPulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
