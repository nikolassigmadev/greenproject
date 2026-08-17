import { Link } from "react-router-dom";
import { Logo, Wordmark } from "@/components/Logo";
import { DS } from "@/styles/design-tokens";

/**
 * The footer carries the pages that make the app's claims checkable —
 * methodology, the sourcing bar, source tiers, database status — plus the legal
 * pages.
 *
 * Deliberately NOT a copy of BottomNav. Home/Scan/Basket already have a
 * permanent thumb-reachable home on mobile; repeating them here wasted the one
 * place where "how do you know that?" can live. An app that asks people to
 * trust its verdicts should keep the answer one tap away from every screen,
 * not buried in an About page.
 *
 * Renders on mobile too (it used to be `hidden md:block`, i.e. invisible to
 * almost every real user, since this ships as a phone PWA). Host pages already
 * reserve bottom padding for the fixed BottomNav, so it sits above it rather
 * than underneath.
 */

const TRUST_LINKS = [
  { to: "/methodology", label: "How we decide" },
  { to: "/methodology#sourcing-bar", label: "The sourcing bar" },
  { to: "/methodology#source-tiers", label: "Source tiers" },
  { to: "/methodology#database-status", label: "Database status" },
  { to: "/submit-flag", label: "Report a problem" },
];

const LEGAL_LINKS = [
  { to: "/about", label: "About" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms-of-service", label: "Terms of Service" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
];

function LinkColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title} style={{ minWidth: 140 }}>
      <p style={{
        fontSize: 11, fontWeight: 800, color: DS.muted,
        letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px",
      }}>
        {title}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              style={{ fontSize: 13, color: DS.ink, opacity: 0.75, textDecoration: "none", lineHeight: 1.4 }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: `1px solid ${DS.hair}`,
        background: DS.bg,
        padding: "28px 0 8px",
        marginTop: 40,
        fontFamily: DS.font,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 4px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginBottom: 24 }}>
          <LinkColumn title="How this works" links={TRUST_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
          borderTop: `1px solid ${DS.hair}`, paddingTop: 16,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={20} />
            <Wordmark fontSize={15} />
          </span>
          <p style={{ fontSize: 12, color: DS.muted, opacity: 0.7, margin: 0 }}>
            © {currentYear} GoodScan
          </p>
        </div>

        {/* The one line that matters most, so it isn't only in the methodology
            page nobody opens: we report what our sources say, and absence of a
            flag is absence of evidence — not evidence of good practice. */}
        <p style={{
          fontSize: 11, color: DS.muted, opacity: 0.75,
          lineHeight: 1.5, margin: "12px 0 0", maxWidth: 560,
        }}>
          Flags describe published findings about a brand or a commodity, not proof of
          wrongdoing by a company. No flag means we found no qualifying source — not
          that a product is clean.
        </p>
      </div>
    </footer>
  );
}
