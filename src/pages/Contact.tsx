import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";
import { getAnonId } from "@/utils/scanLogger";

const EMAIL = "contact@goodscan.shop";

/**
 * One place to reach a human.
 *
 * The address was already in the app, but only scattered through Privacy,
 * Terms, About and a retailer disclaimer — reachable if you were already
 * reading the small print, which is the opposite of who needs it. The footer's
 * "Report a problem" now lands here.
 *
 * The mailto links carry a prefilled subject so we can route on arrival, and
 * the deletion section shows the device ID inline: it is the only handle that
 * exists on a user's data, and telling someone to "include your device ID"
 * without showing it is an instruction they cannot follow.
 */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 15, fontWeight: 600, color: DS.ink, marginBottom: 8 }}>{title}</h2>
    <div style={{ fontSize: 14, color: DS.ink, opacity: 0.85, lineHeight: 1.5 }}>{children}</div>
  </div>
);

const MailButton = ({ subject, label }: { subject: string; label: string }) => (
  <a
    href={`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`}
    style={{
      display: "inline-block", marginTop: 10,
      background: DS.card, border: `1px solid ${DS.hair}`, borderRadius: DS.radius.md,
      padding: "10px 14px", fontSize: 13, fontWeight: 700,
      color: DS.ink, textDecoration: "none",
    }}
  >
    {label}
  </a>
);

export default function Contact() {
  const [anonId, setAnonId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Contact — GoodScan";
    setAnonId(getAnonId());
    return () => { document.title = "GoodScan"; };
  }, []);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(anonId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, permissions). The id is shown on
      // screen either way, so this is a convenience failing, not the feature.
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink, display: "flex", flexDirection: "column" }}>
      <main style={{
        flex: 1, maxWidth: 640, margin: "0 auto", width: "100%",
        padding: "0 20px 130px",
        paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))",
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <BackButton />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: DS.ink, letterSpacing: -0.5, marginBottom: 4 }}>
            Report a problem
          </h1>
          <p style={{ fontSize: 14, color: DS.muted }}>
            Every message reaches a person. Pick whichever fits.
          </p>
        </div>

        <div style={{ background: DS.card, borderRadius: 18, padding: "24px 20px" }}>

          <Section title="We got a product wrong">
            <p style={{ margin: 0 }}>
              Wrong brand, wrong product, a verdict that doesn't match the label, or a
              score that looks indefensible. Tell us what you scanned and what you
              expected — a barcode or a photo helps most.
            </p>
            <MailButton subject="Wrong product or verdict" label={`Email ${EMAIL}`} />
          </Section>

          <Section title="You represent a brand we've flagged">
            <p style={{ margin: 0, marginBottom: 8 }}>
              We publish labour and sourcing findings against named companies, and we
              publish the source behind each one. If you believe a flag is wrong, out of
              date, or misattributed, write to us and say which flag and why.
            </p>
            <p style={{ margin: 0 }}>
              We will review it against the cited source and reply. If the source doesn't
              support the claim, the flag comes down — that is the rule, and it applies
              regardless of who is asking. How flags are sourced and what a flag does and
              does not claim is set out in our{" "}
              <Link to="/methodology" style={{ color: DS.ink, fontWeight: 600 }}>methodology</Link>.
            </p>
            <MailButton subject="Flag dispute — brand representative" label="Dispute a flag" />
          </Section>

          <Section title="You have a source we're missing">
            <p style={{ margin: 0 }}>
              If you have a published report we should be citing, the structured form
              captures the details we need to assess it properly.
            </p>
            <Link
              to="/submit-flag"
              style={{
                display: "inline-block", marginTop: 10,
                background: DS.card, border: `1px solid ${DS.hair}`, borderRadius: DS.radius.md,
                padding: "10px 14px", fontSize: 13, fontWeight: 700,
                color: DS.ink, textDecoration: "none",
              }}
            >
              Submit a source
            </Link>
          </Section>

          <Section title="Something in the app is broken">
            <p style={{ margin: 0 }}>
              Crashes, a screen that won't load, the camera not opening. Telling us your
              device and what you were doing turns a vague report into a fixable one.
            </p>
            <MailButton subject="Bug report" label="Report a bug" />
          </Section>

          <Section title="Delete the data we hold on you">
            <p style={{ margin: 0, marginBottom: 10 }}>
              There are no accounts here, so the only handle on your data is the random
              device ID below. Send it to us and we'll erase every record attached to it.
            </p>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              background: DS.bg, border: `1px solid ${DS.hair}`, borderRadius: DS.radius.md,
              padding: "10px 12px",
            }}>
              <code style={{ fontSize: 12, color: DS.ink, wordBreak: "break-all", flex: 1, minWidth: 0 }}>
                {anonId || "—"}
              </code>
              <button
                onClick={copyId}
                style={{
                  background: "transparent", border: `1px solid ${DS.hair}`, borderRadius: 8,
                  padding: "6px 10px", fontSize: 12, fontWeight: 700, color: DS.ink,
                  cursor: "pointer", fontFamily: DS.font, flexShrink: 0,
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 12, color: DS.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
              This ID is the only way we can identify your records — which is also why we
              can't hand them to anyone who doesn't have it.
            </p>
            <MailButton subject="Data deletion request" label="Request deletion" />
          </Section>

          <Section title="Anything else">
            <p style={{ margin: 0 }}>
              <a href={`mailto:${EMAIL}`} style={{ color: DS.ink, fontWeight: 600, textDecoration: "none" }}>
                {EMAIL}
              </a>
            </p>
          </Section>

        </div>
      </main>
    </div>
  );
}
