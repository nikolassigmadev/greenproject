import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, color: DS.ink, marginBottom: 8 }}>{title}</h2>
    <div style={{ fontSize: 14, color: DS.ink, opacity: 0.85, lineHeight: 1.5 }}>{children}</div>
  </div>
);

export default function TermsOfService({ embedded = false }: { embedded?: boolean } = {}) {
  return (
    <div style={{ minHeight: embedded ? "auto" : "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink, display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", padding: embedded ? "16px 20px 40px" : "0 20px 110px", paddingTop: embedded ? 16 : "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          {!embedded && (
            <div style={{ marginBottom: 16 }}>
              <BackButton to="/about" />
            </div>
          )}
          <h1 style={{ fontSize: 28, fontWeight: 700, color: DS.ink, letterSpacing: -0.5, marginBottom: 4 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: DS.muted }}>Last updated: June 2026</p>
        </div>

        <div style={{ background: DS.card, borderRadius: 18, padding: "24px 20px" }}>
          <Section title="Acceptance of These Terms">
            By using GoodScan ("the app"), you agree to these Terms of Service. If you do not agree, please do not use the app. These terms apply to everyone who accesses or uses GoodScan.
          </Section>

          <Section title="What GoodScan Provides">
            GoodScan is a free tool that helps you understand the ethical and environmental profile of consumer products. You can scan barcodes or labels, search for products, and view scores, flags, and suggested alternatives. The app is provided "as is" and may change, pause, or be discontinued at any time.
          </Section>

          <Section title="Informational Use Only">
            <p style={{ marginBottom: 8 }}>
              All scores, ratings, flags, and recommendations are provided for general informational purposes only and do not constitute legal, financial, dietary, medical, or professional advice.
            </p>
            <p style={{ margin: 0 }}>
              Information is derived from publicly available data sources and automated analysis, and may be incomplete, outdated, or inaccurate. A product's absence from our database does not imply it is free of ethical or environmental concerns. Always independently verify claims before making purchasing decisions.
            </p>
          </Section>

          <Section title="Acceptable Use">
            <p style={{ marginBottom: 8 }}>You agree not to:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Use the app for any unlawful purpose or in violation of these terms</li>
              <li style={{ marginBottom: 6 }}>Attempt to disrupt, overload, reverse-engineer, or gain unauthorized access to our systems</li>
              <li style={{ marginBottom: 6 }}>Scrape, harvest, or resell data from the app at scale without permission</li>
              <li style={{ marginBottom: 6 }}>Misrepresent the app's output as definitive fact about any brand or product</li>
            </ul>
          </Section>

          <Section title="No Affiliation">
            GoodScan is not affiliated with, endorsed by, or sponsored by any brand or company mentioned within the app. All trademarks and product names belong to their respective owners and are used for identification only.
          </Section>

          <Section title="Intellectual Property">
            The GoodScan name, logo, design, and original content are owned by us. Underlying product data may be sourced from third parties (such as Open Food Facts) under their own licenses. You may use the app for personal, non-commercial purposes.
          </Section>

          <Section title="Limitation of Liability">
            To the fullest extent permitted by law, GoodScan and its operators are not liable for any loss or damage arising from your use of, or reliance on, the app or its information. You use the app at your own discretion and risk.
          </Section>

          <Section title="Changes to These Terms">
            We may update these terms from time to time. Continued use of the app after changes take effect constitutes acceptance of the revised terms. The "last updated" date above reflects the most recent revision.
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
