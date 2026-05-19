import { BottomNav } from "@/components/BottomNav";
import { AboutChatWidget } from "@/components/AboutChatWidget";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { DS } from "@/styles/design-tokens";

export default function AboutUs() {
  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      <main style={{ padding: "0 20px", paddingBottom: 110 }}>
        <div style={{ paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>

          {/* Title */}
          <div style={{ padding: "8px 0 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 800, letterSpacing: -0.6 }}>
              <img src="/logo.png" alt="GoodScan" style={{ width: 40, height: 40, borderRadius: 10 }} />
              GoodScan
            </div>
            <div style={{ fontSize: 16, color: DS.muted, marginTop: 6, lineHeight: 1.4 }}>
              Making ethical shopping simple — scan a product and instantly understand its impact.
            </div>
          </div>

          {/* Mission card */}
          <div style={{ background: DS.card, borderRadius: 18, padding: 20, marginBottom: 22, boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>Our mission</h2>
            <p style={{ fontSize: 15, color: DS.ink, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              We believe you deserve to know the story behind the products you buy. We bring together data on labour, environment, animal welfare, and nutrition — so you can shop with confidence.
            </p>
          </div>

          {/* Values grid */}
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: DS.muted, margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>What we look at</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              { t: "Labour", d: "Fair pay & safe working conditions", glyph: "👤" },
              { t: "Environment", d: "Carbon, packaging, ecosystems", glyph: "🌿" },
              { t: "Animal welfare", d: "Standards & alternatives", glyph: "◐" },
              { t: "Transparency", d: "Public reports & audits", glyph: "◇" },
            ].map((v) => (
              <div key={v.t} style={{ background: DS.card, borderRadius: DS.radius.sm, padding: 14, minHeight: 110, boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, background: DS.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, marginBottom: 10,
                }}>
                  <span style={{ filter: "grayscale(0.2)" }}>{v.glyph}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{v.t}</div>
                <div style={{ fontSize: 13, color: DS.muted, marginTop: 3, lineHeight: 1.35 }}>{v.d}</div>
              </div>
            ))}
          </div>

          {/* Data source */}
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: DS.muted, margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>Where the data comes from</h2>
          <div style={{ background: DS.card, borderRadius: DS.radius.sm, padding: 16, marginBottom: 22, boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 14, color: DS.ink, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              Nutrition and environment data come from <span style={{ fontWeight: 600 }}>Open Food Facts</span> — a free, open database. Labour and sourcing details are reviewed by our team against published reports.
            </p>
          </div>

          {/* Contact */}
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: DS.muted, margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>Contact</h2>
          <div style={{ background: DS.card, borderRadius: DS.radius.sm, overflow: "hidden", marginBottom: 30, boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
            {[
              { label: "Email", value: "geovanis@proton.me", href: "mailto:geovanis@proton.me" },
              { label: "Privacy policy", value: "View", to: "/privacy" },
              { label: "Methodology", value: "View", to: "/methodology" },
            ].map((item, i) => {
              const inner = (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px",
                  borderTop: i ? `1px solid ${DS.hair}` : "none",
                }}>
                  <span style={{ fontSize: 15 }}>{item.label}</span>
                  <span style={{ fontSize: 14, color: DS.muted, display: "flex", alignItems: "center", gap: 6 }}>
                    {item.value}
                    <ChevronRight style={{ width: 14, height: 14, color: DS.muted }} />
                  </span>
                </div>
              );
              if (item.to) {
                return <Link key={i} to={item.to} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>;
              }
              return <a key={i} href={item.href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</a>;
            })}
          </div>

          {/* Disclaimer */}
          <div style={{
            background: DS.card, borderRadius: DS.radius.sm, padding: 16, marginBottom: 22,
            boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <h2 style={{
              fontSize: 13, fontWeight: 600, color: DS.muted, margin: "0 0 10px",
              textTransform: "uppercase", letterSpacing: 0.5,
            }}>Disclaimer</h2>
            <p style={{ fontSize: 13, color: DS.muted, margin: 0, lineHeight: 1.55 }}>
              GoodScan is provided for <strong style={{ color: DS.ink }}>informational purposes only</strong> and does not constitute legal, financial, dietary, or professional advice. Scores, ratings, and flags are derived from publicly available data sources and may be incomplete, outdated, or inaccurate. We make no guarantees regarding the accuracy or completeness of any information displayed. A product's absence from our database does not imply it is free of ethical or environmental concerns. Users should independently verify any claims before making purchasing decisions. GoodScan is not affiliated with, endorsed by, or sponsored by any brand or company mentioned within the app. If you believe any information is incorrect, please contact us via the email above.
            </p>
          </div>

          <div style={{ textAlign: "center", fontSize: 12, color: DS.muted, paddingBottom: 4 }}>
            v1.0 · Made with care
          </div>
        </div>
      </main>
      <AboutChatWidget />
      <BottomNav />
    </div>
  );
}
