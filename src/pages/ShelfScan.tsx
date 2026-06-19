import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ScanLine, Camera, ImageUp, Loader2, Trophy, ChevronRight,
  Sparkles, AlertTriangle, RefreshCw, Tag,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DS, scoreTone, toneColor, toneBg } from "@/styles/design-tokens";
import { scanShelf, type ShelfPick } from "@/services/shelf/shelfScan";
import { toast } from "sonner";

const CARD_SHADOW = "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)";

type Phase = "idle" | "scanning" | "done" | "error";

const VERDICT_LABEL: Record<string, string> = {
  BUY: "Buy", CONSIDER: "Consider", CAUTION: "Caution", AVOID: "Avoid", UNKNOWN: "No data",
};

/** Load a file, downscale to maxDim, and return raw base64 JPEG (no data: prefix). */
function fileToBase64Jpeg(file: File, maxDim = 1280, quality = 0.8): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load the image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl, base64: dataUrl.split(",")[1] ?? "" });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Circular score badge — tone-coloured, matches the rest of the app. */
function ScoreBadge({ score, size = 44 }: { score: number | null; size?: number }) {
  if (score == null) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size / 2, background: DS.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: DS.muted, flexShrink: 0,
      }}>—</div>
    );
  }
  const tone = scoreTone(score);
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, background: toneBg(tone),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: toneColor(tone), flexShrink: 0,
    }}>{score}</div>
  );
}

function Thumb({ url, size = 46 }: { url: string | null | undefined; size?: number }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", background: DS.bg, flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: DS.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Tag style={{ width: size * 0.4, height: size * 0.4, color: DS.muted }} />
    </div>
  );
}

/** A row in the "everything else" list. Links to the detail page when matched. */
function PickRow({ pick, divider }: { pick: ShelfPick; divider: boolean }) {
  const name = pick.product?.productName || pick.label || "Unknown product";
  const brand = pick.product?.brand || pick.detectedBrand;
  const tone = pick.hasData && pick.score != null ? scoreTone(pick.score) : null;

  const subtitle = pick.hasData
    ? `${brand || "Unknown brand"} · ${VERDICT_LABEL[pick.verdict] ?? "—"}`
    : pick.product
      ? `${brand || "Unknown brand"} · Limited data`
      : "Couldn't match in our database";

  const inner = (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderTop: divider ? `1px solid ${DS.hair}` : "none",
    }}>
      {/* No data ⇒ neutral "—" badge, never an inflated brand-only number. */}
      <ScoreBadge score={pick.hasData ? pick.score : null} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: DS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {name}
        </div>
        <div style={{ fontSize: 12.5, color: DS.muted, marginTop: 2 }}>{subtitle}</div>
      </div>
      {pick.hasData && tone && (
        <span style={{ fontSize: 12, fontWeight: 800, color: toneColor(tone), flexShrink: 0 }}>
          {VERDICT_LABEL[pick.verdict]}
        </span>
      )}
      {pick.product && <ChevronRight style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />}
    </div>
  );

  if (pick.product) {
    return (
      <Link to={`/product-off/${pick.product.barcode}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function ShelfScan() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [picks, setPicks] = useState<ShelfPick[]>([]);
  const [detectedCount, setDetectedCount] = useState(0);

  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase("idle");
    setPreview(null);
    setPicks([]);
    setDetectedCount(0);
    if (cameraInput.current) cameraInput.current.value = "";
    if (libraryInput.current) libraryInput.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhase("scanning");
      const { dataUrl, base64 } = await fileToBase64Jpeg(file);
      setPreview(dataUrl);
      if (!base64) throw new Error("Could not process the image");
      const result = await scanShelf(base64);
      setPicks(result.picks);
      setDetectedCount(result.detectedCount);
      setPhase("done");
    } catch (err) {
      console.error("Shelf scan failed:", err);
      toast.error(err instanceof Error ? err.message : "Shelf scan failed");
      setPhase("error");
    }
  };

  // The winner must be a data-backed pick — a clean-but-unknown brand with no
  // product data is never crowned over something we could actually assess.
  const winner = picks.find((p) => p.hasData) ?? null;
  const rest = winner ? picks.filter((p) => p !== winner) : picks;

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ paddingBottom: 120, maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          padding: "max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px 18px",
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 800, color: DS.good,
              letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 4px",
            }}>
              Smart pick
            </p>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: DS.ink, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 6px" }}>
              Scan a shelf
            </h1>
            <p style={{ fontSize: 13.5, color: DS.muted, lineHeight: 1.5, margin: 0 }}>
              Point your camera at a shelf. We read every product we can, score each against your values, and pick the best.
            </p>
          </div>
        </div>

        {/* Hidden inputs: one opens the rear camera, one the photo library. */}
        <input
          ref={cameraInput} type="file" accept="image/*" capture="environment"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={libraryInput} type="file" accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div style={{ padding: "0 16px" }}>

          {/* ── Idle / capture ─────────────────────────────────────────── */}
          {phase === "idle" && (
            <>
              <div style={{
                background: DS.card, borderRadius: 18, padding: "30px 20px",
                boxShadow: CARD_SHADOW, textAlign: "center", marginBottom: 14,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px",
                  background: DS.goodBg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ScanLine style={{ width: 34, height: 34, color: DS.good }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: DS.ink, margin: "0 0 6px" }}>
                  Snap the whole shelf
                </p>
                <p style={{ fontSize: 13, color: DS.muted, margin: "0 auto", maxWidth: 320, lineHeight: 1.5 }}>
                  Get the product faces in frame and hold steady — the clearer the labels, the more we can compare.
                </p>
              </div>

              <button
                onClick={() => cameraInput.current?.click()}
                style={{
                  width: "100%", height: 56, borderRadius: 16, border: "none",
                  background: DS.ink, color: DS.card, fontWeight: 800, fontSize: 15.5,
                  letterSpacing: "-0.01em", cursor: "pointer", fontFamily: DS.font,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.18)", marginBottom: 10,
                }}
              >
                <Camera size={19} strokeWidth={2.2} />
                Take a shelf photo
              </button>
              <button
                onClick={() => libraryInput.current?.click()}
                style={{
                  width: "100%", height: 50, borderRadius: 14,
                  background: "transparent", border: `1px solid ${DS.hair}`, color: DS.ink,
                  fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: DS.font,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <ImageUp size={17} strokeWidth={2} />
                Choose from library
              </button>
            </>
          )}

          {/* ── Scanning ───────────────────────────────────────────────── */}
          {phase === "scanning" && (
            <div style={{
              background: DS.card, borderRadius: 18, padding: 18, boxShadow: CARD_SHADOW,
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            }}>
              {preview && (
                <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                  <img src={preview} alt="Shelf" style={{ width: "100%", display: "block", maxHeight: 260, objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 style={{ width: 30, height: 30, color: "#fff", animation: "spin 1s linear infinite" }} />
                  </div>
                </div>
              )}
              <p style={{ fontSize: 15, fontWeight: 700, color: DS.ink, margin: "0 0 4px" }}>Reading the shelf…</p>
              <p style={{ fontSize: 13, color: DS.muted, margin: 0 }}>Finding products and scoring each one</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────── */}
          {phase === "error" && (
            <div style={{ background: DS.card, borderRadius: 18, padding: 24, boxShadow: CARD_SHADOW, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
                background: DS.badBg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AlertTriangle style={{ width: 26, height: 26, color: DS.bad }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>That scan didn't work</p>
              <p style={{ fontSize: 13, color: DS.muted, margin: "0 0 18px", lineHeight: 1.5 }}>
                We couldn't reach the scanner. Check your connection and try again.
              </p>
              <button onClick={reset} style={primaryBtn}>
                <RefreshCw size={17} strokeWidth={2.2} /> Try again
              </button>
            </div>
          )}

          {/* ── Results ────────────────────────────────────────────────── */}
          {phase === "done" && (
            <>
              {winner ? (
                <>
                  {/* Best pick hero */}
                  <p style={{ fontSize: 12, fontWeight: 800, color: DS.good, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
                    Best for your values
                  </p>
                  <Link
                    to={winner.product ? `/product-off/${winner.product.barcode}` : "#"}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div style={{
                      background: DS.card, borderRadius: 20, padding: 18, marginBottom: 22,
                      boxShadow: "0 6px 22px rgba(0,0,0,0.10), 0 0 0 1.5px " + toneColor(scoreTone(winner.score!)),
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <Thumb url={winner.product?.imageUrl} size={62} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                            <Trophy style={{ width: 13, height: 13, color: DS.good }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: DS.good, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              Top pick
                            </span>
                          </div>
                          <div style={{ fontSize: 16.5, fontWeight: 800, color: DS.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {winner.product?.productName || winner.label}
                          </div>
                          <div style={{ fontSize: 13, color: DS.muted, marginTop: 2 }}>
                            {winner.product?.brand || winner.detectedBrand}
                          </div>
                        </div>
                        <ScoreBadge score={winner.score} size={54} />
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginTop: 16, paddingTop: 14, borderTop: `1px solid ${DS.hair}`,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: toneColor(scoreTone(winner.score!)) }}>
                          {VERDICT_LABEL[winner.verdict]} · scored for your values
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: DS.ink }}>
                          Breakdown <ChevronRight style={{ width: 15, height: 15 }} />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Everything else */}
                  {rest.length > 0 && (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 700, color: DS.ink, margin: "0 0 10px" }}>
                        Also on the shelf
                      </p>
                      <div style={{ background: DS.card, borderRadius: 16, overflow: "hidden", boxShadow: CARD_SHADOW, marginBottom: 20 }}>
                        {rest.map((p, i) => <PickRow key={p.label + i} pick={p} divider={i > 0} />)}
                      </div>
                    </>
                  )}
                </>
              ) : picks.length > 0 ? (
                /* Identified by brand, but no data-backed score for any of them. */
                <>
                  <div style={{ background: DS.card, borderRadius: 16, padding: "14px 16px", boxShadow: CARD_SHADOW, marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Sparkles style={{ width: 18, height: 18, color: DS.warn, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: DS.ink2, margin: 0, lineHeight: 1.5 }}>
                      We identified these by brand, but couldn't find full product data to score them confidently. Try getting closer to the labels.
                    </p>
                  </div>
                  <div style={{ background: DS.card, borderRadius: 16, overflow: "hidden", boxShadow: CARD_SHADOW, marginBottom: 20 }}>
                    {picks.map((p, i) => <PickRow key={p.label + i} pick={p} divider={i > 0} />)}
                  </div>
                </>
              ) : (
                /* Nothing readable on the shelf at all. */
                <div style={{ background: DS.card, borderRadius: 18, padding: 24, boxShadow: CARD_SHADOW, textAlign: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
                    background: DS.warnBg, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles style={{ width: 26, height: 26, color: DS.warn }} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>No products spotted</p>
                  <p style={{ fontSize: 13, color: DS.muted, margin: 0, lineHeight: 1.5 }}>
                    Get the product labels in frame, hold steady, and make sure there's good light.
                  </p>
                </div>
              )}

              <button onClick={reset} style={primaryBtn}>
                <ScanLine size={18} strokeWidth={2.2} /> Scan another shelf
              </button>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%", height: 54, borderRadius: 15, border: "none",
  background: DS.ink, color: DS.card, fontWeight: 800, fontSize: 15,
  letterSpacing: "-0.01em", cursor: "pointer", fontFamily: DS.font,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};
