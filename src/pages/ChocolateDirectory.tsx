import { useEffect } from "react";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";

export default function ChocolateDirectory() {
  useEffect(() => {
    document.title = "Chocolate Directory — GoodScan";
    return () => { document.title = "GoodScan"; };
  }, []);

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      <main style={{
        maxWidth: 640, margin: "0 auto", width: "100%",
        padding: `max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 16px calc(env(safe-area-inset-bottom, 0px) + 130px)`,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "0 4px", marginBottom: 48 }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 4px",
            }}>
              Ethics scan
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>
              Chocolate Directory
            </h1>
          </div>
        </div>

        {/* Coming soon */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", gap: 16, padding: "48px 24px",
          background: DS.card, borderRadius: DS.radius.lg,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: DS.goodBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>
            🍫
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", color: DS.ink }}>
              Coming Soon
            </p>
            <p style={{ fontSize: 14, color: DS.muted, margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
              We're building a full ethical chocolate brand directory. Check back soon.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
