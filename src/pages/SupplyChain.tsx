import { Globe } from "lucide-react";
import { DS } from "@/styles/design-tokens";

export default function SupplyChain() {
  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      <main style={{ padding: "0 20px", paddingBottom: 110 }}>
        <div style={{ paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>

          {/* Title */}
          <div style={{ padding: "8px 0 22px" }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.6, margin: 0 }}>
              Global supply chain tracking
            </h1>
            <div style={{ fontSize: 16, color: DS.muted, marginTop: 6, lineHeight: 1.4 }}>
              Trace where products come from — from raw materials to your shelf.
            </div>
          </div>

          {/* Coming soon card */}
          <div style={{
            background: DS.card,
            borderRadius: 18,
            padding: "40px 24px",
            textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32, background: DS.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
            }}>
              <Globe style={{ width: 32, height: 32, color: DS.muted }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Coming soon</h2>
            <p style={{ fontSize: 15, color: DS.muted, margin: 0, lineHeight: 1.5 }}>
              Global supply chain tracking is on its way. Check back soon.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
