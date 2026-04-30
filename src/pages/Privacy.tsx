import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";

const BLUE = "#2979FF";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, marginBottom: 8 }}>{title}</h2>
    <div style={{ fontSize: "0.875rem", color: TEXT_MUTED, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function Privacy() {
  return (
    <div style={{ minHeight: "100dvh", background: "#F5F7FA", display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", padding: "24px 20px 100px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/about" style={{ fontSize: "0.8rem", color: BLUE, textDecoration: "none", fontWeight: 600, display: "inline-block", marginBottom: 16 }}>
            ← Back
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: TEXT, marginBottom: 4 }}>Privacy Policy</h1>
          <p style={{ fontSize: "0.8rem", color: TEXT_MUTED }}>Last updated: April 2026</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, padding: "24px 20px" }}>
          <Section title="Overview">
            Scan2Source ("the app") is committed to your privacy. This policy explains what information is collected when you use the app and how it is used.
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
            <a href="mailto:geovanis@proton.me" style={{ color: BLUE, textDecoration: "none", fontWeight: 600 }}>
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
