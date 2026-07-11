import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { DS } from "@/styles/design-tokens";
import { getVerdictMapCompanies } from "@/data/verdictMapCompanies";

/** Measure an env(safe-area-inset-*) value in px — iframes can't read env()
 *  themselves, so the host passes its insets to the map via the URL. */
function measureSafeInset(edge: "top" | "bottom"): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    `position:fixed;${edge}:0;width:0;visibility:hidden;` +
    `height:env(safe-area-inset-${edge}, 0px);`;
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return Math.round(px);
}

// Room the map's bottom sheet needs to clear the app's floating nav pill
// (56px pill + 22px offset + breathing room).
const NAV_CLEARANCE = 88;

/**
 * Global supply chain tracking — the interactive sourcing globe, full screen.
 *
 * The map itself is the standalone build in public/sourcing-map.html
 * (D3 orthographic globe + bottom sheet). On load it announces
 * `goodscan-map-ready`; we then inject every verdict-affecting company from
 * the app's datasets via `goodscan-companies`, and keep its theme in sync
 * with the app through `goodscan-theme` messages. The bottom nav floats
 * above the map (z 9999 vs 60), and the map lays out around it via the
 * inset-top / inset-bottom params.
 */
export default function SupplyChain() {
  const { resolvedTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Theme + insets at mount decide the iframe URL; later theme switches go
  // via postMessage so the globe doesn't reload mid-session.
  const [src] = useState(() => {
    const theme = resolvedTheme === "dark" ? "dark" : "light";
    const insetTop = measureSafeInset("top");
    const insetBottom = measureSafeInset("bottom") + NAV_CLEARANCE;
    return `/sourcing-map.html?theme=${theme}&inset-top=${insetTop}&inset-bottom=${insetBottom}`;
  });

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
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: DS.bg }}>
      <iframe
        ref={iframeRef}
        src={src}
        title="Global supply chain map"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          border: "none", display: "block", background: DS.bg,
        }}
      />
    </div>
  );
}
