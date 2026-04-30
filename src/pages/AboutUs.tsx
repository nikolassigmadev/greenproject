import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { Leaf, Shield, Globe, Heart } from "lucide-react";

const BLUE = "#2979FF";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const GREEN = "#00C853";

export default function AboutUs() {
  return (
    <div style={{ minHeight: "100dvh", background: "#F5F7FA", display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", padding: "32px 20px 100px" }}>
        {/* Logo + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Leaf style={{ width: 32, height: 32, color: "#388E3C" }} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: TEXT, marginBottom: 6 }}>Scan2Source</h1>
          <p style={{ fontSize: "0.9rem", color: TEXT_MUTED, maxWidth: 300, lineHeight: 1.6 }}>
            Making ethical shopping simple — scan a product and instantly understand its impact.
          </p>
        </div>

        {/* Mission */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT, marginBottom: 10 }}>Our Mission</h2>
          <p style={{ fontSize: "0.875rem", color: TEXT_MUTED, lineHeight: 1.7, margin: 0 }}>
            We believe consumers deserve to know the story behind the products they buy. Scan2Source aggregates data on labour rights, environmental impact, animal welfare, and nutrition so you can shop with confidence.
          </p>
        </div>

        {/* Pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { icon: Shield, label: "Labour Rights", color: "#E53935", bg: "#FFF0F0" },
            { icon: Leaf, label: "Environment", color: "#388E3C", bg: "#E8F5E9" },
            { icon: Heart, label: "Animal Welfare", color: "#7B1FA2", bg: "#F9F0FF" },
            { icon: Globe, label: "Transparency", color: BLUE, bg: "#E3EDFF" },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 18, height: 18, color }} />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: TEXT }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Data attribution */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT, marginBottom: 10 }}>Data Sources</h2>
          <p style={{ fontSize: "0.875rem", color: TEXT_MUTED, lineHeight: 1.7, margin: 0 }}>
            Nutritional and environmental product data is sourced from{" "}
            <span style={{ fontWeight: 600, color: TEXT }}>Open Food Facts</span>{" "}
            (openfoodfacts.org), a free, open, and collaborative food database licensed under CC BY-SA 4.0. Labour and sourcing flags are researched and reviewed by our team against published reports and certifications.
          </p>
        </div>

        {/* Contact + legal links */}
        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, padding: "20px" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT, marginBottom: 10 }}>Contact & Legal</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="mailto:geovanis@proton.me" style={{ fontSize: "0.875rem", color: BLUE, textDecoration: "none", fontWeight: 600 }}>
              geovanis@proton.me
            </a>
            <Link to="/privacy" style={{ fontSize: "0.875rem", color: BLUE, textDecoration: "none", fontWeight: 600 }}>
              Privacy Policy →
            </Link>
            <Link to="/methodology" style={{ fontSize: "0.875rem", color: BLUE, textDecoration: "none", fontWeight: 600 }}>
              Methodology →
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
