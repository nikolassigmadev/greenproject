import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { DS } from "@/styles/design-tokens";
import { getVerdictMapCompanies } from "@/data/verdictMapCompanies";

/**
 * Global supply chain tracking — the interactive sourcing globe.
 *
 * The map itself is the standalone build in public/sourcing-map.html
 * (D3 orthographic globe + bottom sheet). On load it announces
 * `goodscan-map-ready`; we then inject every verdict-affecting company from
 * the app's datasets via `goodscan-companies`, and keep its theme in sync
 * with the app through `goodscan-theme` messages.
 */
export default function SupplyChain() {
  const { resolvedTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Theme at mount decides the iframe URL; later switches go via postMessage
  // so the globe doesn't reload mid-session.
  const [initialTheme] = useState(() => (resolvedTheme === "dark" ? "dark" : "light"));

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "goodscan-map-ready") return;
      iframeRef.current?.contentWindow?.postMessage(
        { type: "goodscan-companies", companies: getVerdictMapCompanies() },
        "*",
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    iframeRef.current?.contentWindow?.postMessage({ type: "goodscan-theme", theme }, "*");
  }, [resolvedTheme]);

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: DS.bg, fontFamily: DS.font, color: DS.ink, overflow: "hidden",
    }}>
      <div style={{
        padding: "max(48px, calc(env(safe-area-inset-top, 0px) + 12px)) 20px 12px",
        flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
          Global supply chain tracking
        </h1>
        <div style={{ fontSize: 13.5, color: DS.muted, marginTop: 4, lineHeight: 1.4 }}>
          Every company that moves a product's verdict — tap a pin for the evidence.
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={`/sourcing-map.html?theme=${initialTheme}`}
        title="Global supply chain map"
        style={{
          flex: 1, width: "calc(100% - 24px)", margin: "0 12px",
          marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)",
          border: `1px solid ${DS.hair}`, borderRadius: 20,
          background: DS.card, display: "block",
        }}
      />
    </div>
  );
}
