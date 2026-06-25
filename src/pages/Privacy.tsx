import { BackButton } from "@/components/BackButton";
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
          <div style={{ marginBottom: 16 }}>
            <BackButton to="/about" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: DS.ink, letterSpacing: -0.5, marginBottom: 4 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: DS.muted }}>Last updated: June 2026</p>
        </div>

        <div style={{ background: DS.card, borderRadius: 18, padding: "24px 20px" }}>
          <Section title="Overview">
            GoodScan ("the app") is committed to your privacy. This policy explains what information is collected when you use the app and how it is used.
          </Section>

          <Section title="Camera & Photo Library">
            The app requests access to your camera and photo library solely to capture or select images of product barcodes and food labels. These images are sent to our secure backend server for analysis using OpenAI's vision API to extract product information (name, brand, ingredients, certifications). The photos are not used to train AI models.
            <p style={{ marginTop: 8, marginBottom: 0 }}>
              A downscaled copy of each photo you scan is retained on our backend as part of your anonymous scan record (see "Scan Records" below), so we can review and improve product recognition. Because a scan photo can incidentally capture faces, hands, or your surroundings, only point the camera at the product. If you'd rather no photos be kept, turn off scan logging (see "Scan Records").
            </p>
          </Section>

          <Section title="Third-Party Services">
            <p style={{ marginBottom: 8 }}>The app uses the following third-party services:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}><strong>OpenAI</strong> — Images you capture are sent to OpenAI's API for product recognition. OpenAI's privacy policy applies to this processing.</li>
              <li style={{ marginBottom: 6 }}><strong>Open Food Facts</strong> — Product nutritional and environmental data is retrieved from the Open Food Facts database (openfoodfacts.org), a free and open food database.</li>
            </ul>
          </Section>

          <Section title="Scan Records">
            <p style={{ marginBottom: 8 }}>
              To understand which products people scan and improve our recommendations, we keep an anonymous record of each scan on our backend. A scan record may include:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, marginBottom: 8 }}>
              <li style={{ marginBottom: 6 }}>The product identified (name, brand, barcode) and the verdict we showed you</li>
              <li style={{ marginBottom: 6 }}>A downscaled copy of the photo you scanned</li>
              <li style={{ marginBottom: 6 }}>Whether you chose to buy or skip the product</li>
              <li style={{ marginBottom: 6 }}>Your saved ethical priorities and your chosen region (country/city), if set</li>
              <li style={{ marginBottom: 6 }}>A random device identifier — generated on your device, not linked to your identity</li>
            </ul>
            <p style={{ margin: 0 }}>
              These records are not tied to your name, email, or account (we have none of these). If you opt out of scan logging, we stop creating scan records entirely — including retaining any photos.
            </p>
          </Section>

          <Section title="Data We Do Not Collect">
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>We do not require you to create an account</li>
              <li style={{ marginBottom: 6 }}>We do not ask for your name or email address</li>
              <li style={{ marginBottom: 6 }}>We do not track your location automatically — any region we use is one you set yourself in the app</li>
              <li style={{ marginBottom: 6 }}>We do not use third-party analytics or advertising SDKs</li>
            </ul>
          </Section>

          <Section title="Local Storage">
            Your ethical priority preferences (e.g. weighting for labour rights, environment, nutrition) live on your device. An anonymous snapshot of these weights is attached to each scan record, as described under "Scan Records", so we can understand how priorities relate to the products people scan. They are not otherwise shared.
          </Section>

          <Section title="Children">
            This app is not directed at children under 13. We do not knowingly collect any information from children.
          </Section>

          <Section title="Contact">
            If you have any questions about this privacy policy, please contact us at{" "}
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
