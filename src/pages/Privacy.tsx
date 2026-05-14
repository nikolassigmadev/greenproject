import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DS } from "@/styles/design-tokens";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, color: DS.ink, marginBottom: 8 }}>{title}</h2>
    <div style={{ fontSize: 14, color: DS.ink, opacity: 0.85, lineHeight: 1.5 }}>{children}</div>
  </div>
);

export default function Privacy() {
  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink, display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", padding: "0 20px 110px", paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link
            to="/about"
            style={{
              fontSize: 14,
              color: DS.muted,
              textDecoration: "none",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              marginBottom: 16,
            }}
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Back
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: DS.ink, letterSpacing: -0.5, marginBottom: 4 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: DS.muted }}>Last updated: April 2026</p>
        </div>

        <div style={{ background: DS.card, borderRadius: 18, padding: "24px 20px" }}>
          <Section title="Overview">
            GoodScan ("the app") is committed to your privacy. This policy explains what information is collected when you use the app and how it is used.
          </Section>

          <Section title="Camera & Photo Library">
            The app requests access to your camera and photo library solely to capture or select images of product barcodes and food labels. These images are sent to our secure backend server for analysis using OpenAI's vision API to extract product information (name, brand, ingredients, certifications). Images are not stored on our servers after analysis is complete and are not used to train AI models.
          </Section>

          <Section title="Third-Party Services">
            <p style={{ marginBottom: 8 }}>The app uses the following third-party services:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}><strong>OpenAI</strong> — Images you capture are sent to OpenAI's API for product recognition. OpenAI's privacy policy applies to this processing.</li>
              <li style={{ marginBottom: 6 }}><strong>Open Food Facts</strong> — Product nutritional and environmental data is retrieved from the Open Food Facts database (openfoodfacts.org), a free and open food database.</li>
            </ul>
          </Section>

          <Section title="Data We Do Not Collect">
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>We do not require you to create an account</li>
              <li style={{ marginBottom: 6 }}>We do not collect your name, email address, or any personal identifiers</li>
              <li style={{ marginBottom: 6 }}>We do not track your location</li>
              <li style={{ marginBottom: 6 }}>We do not use third-party analytics or advertising SDKs</li>
            </ul>
          </Section>

          <Section title="Local Storage">
            Your ethical priority preferences (e.g. weighting for labour rights, environment, nutrition) are stored locally on your device only and are never transmitted to any server.
          </Section>

          <Section title="Children">
            This app is not directed at children under 13. We do not knowingly collect any information from children.
          </Section>

          <Section title="Contact">
            If you have any questions about this privacy policy, please contact us at{" "}
            <a href="mailto:geovanis@proton.me" style={{ color: DS.ink, textDecoration: "none", fontWeight: 600 }}>
              geovanis@proton.me
            </a>
            .
          </Section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
