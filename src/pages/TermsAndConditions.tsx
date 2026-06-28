import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, color: DS.ink, marginBottom: 8 }}>{title}</h2>
    <div style={{ fontSize: 14, color: DS.ink, opacity: 0.85, lineHeight: 1.5 }}>{children}</div>
  </div>
);

export default function TermsAndConditions() {
  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink, display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", padding: "0 20px 110px", paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <BackButton to="/about" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: DS.ink, letterSpacing: -0.5, marginBottom: 4 }}>Terms &amp; Conditions</h1>
          <p style={{ fontSize: 14, color: DS.muted }}>Last updated: June 2026</p>
        </div>

        <div style={{ background: DS.card, borderRadius: 18, padding: "24px 20px" }}>
          <Section title="Agreement">
            These Terms &amp; Conditions govern your use of GoodScan. They work alongside our{" "}
            <a href="/terms-of-service" style={{ color: DS.ink, textDecoration: "none", fontWeight: 600 }}>Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" style={{ color: DS.ink, textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a>.
            By continuing to use the app, you confirm that you accept all three.
          </Section>

          <Section title="Eligibility">
            You must be at least 13 years old to use GoodScan. The app is not directed at children under 13, and we do not knowingly collect information from them. By using the app you confirm you meet this requirement.
          </Section>

          <Section title="Your Responsibilities">
            <p style={{ marginBottom: 8 }}>When you use GoodScan, you agree to:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Use the app lawfully and in good faith</li>
              <li style={{ marginBottom: 6 }}>Point your camera only at the product you intend to scan, to avoid capturing people or surroundings</li>
              <li style={{ marginBottom: 6 }}>Treat scores and flags as starting points for your own judgement, not final verdicts</li>
              <li style={{ marginBottom: 6 }}>Not rely on the app where independent verification is important to you</li>
            </ul>
          </Section>

          <Section title="Accuracy &amp; Availability">
            We work to keep information accurate but cannot guarantee it. Data may be incomplete, outdated, or wrong, and the service may be unavailable or interrupted at times. We provide the app on an "as available" basis without warranties of any kind.
          </Section>

          <Section title="Data &amp; Privacy">
            Your use of the app is also subject to our{" "}
            <a href="/privacy" style={{ color: DS.ink, textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a>,
            which explains what is collected and how it is handled. We do not require an account, name, or email to use GoodScan.
          </Section>

          <Section title="Limitation of Liability">
            To the fullest extent permitted by law, we are not responsible for any loss, damage, or decision resulting from your use of, or reliance on, the app. You use GoodScan at your own risk.
          </Section>

          <Section title="Changes">
            We may revise these Terms &amp; Conditions at any time. Continued use after changes take effect means you accept the updated terms. The "last updated" date above shows the latest revision.
          </Section>

          <Section title="Contact">
            Questions about these terms? Contact us at{" "}
            <a href="mailto:contact@goodscan.shop" style={{ color: DS.ink, textDecoration: "none", fontWeight: 600 }}>
              contact@goodscan.shop
            </a>
            .
          </Section>
        </div>
      </main>
    </div>
  );
}
