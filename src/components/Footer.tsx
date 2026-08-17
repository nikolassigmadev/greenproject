// (test edit — comment only, safe to delete)
import { Link } from "react-router-dom";
import { Scale, ChevronRight } from "lucide-react";
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

// "How we decide" is not repeated here — the button above already goes to
// /methodology, and listing it twice is the same duplication that got the
// home page's separate Policies list removed. These are the deep links that
// the button can't be.
const TRUST_LINKS = [
  { to: "/methodology#sourcing-bar", label: "The sourcing bar" },
  { to: "/methodology#source-tiers", label: "Source tiers" },
  { to: "/methodology#database-status", label: "Database status" },
  // → /contact, not /submit-flag. The structured flag form is for people who
  // already have a published source in hand; "report a problem" is the door
  // everyone else needs, including a brand's lawyer disputing a flag.
  { to: "/contact", label: "Report a problem" },
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
        {/* One prominent way in, above the fine print.
            The link columns below are deliberately quiet, which is right for
            legal boilerplate and wrong for the page that explains how a verdict
            is reached — as muted grey text it read as fine print and got
            skipped. This is the same destination the "How we decide" link
            points to; it just stops that being the app's best-kept secret. */}
        <Link
          to="/methodology"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            background: DS.card,
            border: `1px solid ${DS.hair}`,
            borderRadius: DS.radius.md,
            padding: "14px 16px",
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          <span style={{
            width: 34, height: 34, borderRadius: 10, background: DS.bg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Scale style={{ width: 16, height: 16, color: DS.ink }} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: DS.ink }}>
              How we decide
            </span>
            <span style={{ display: "block", fontSize: 12, color: DS.muted, marginTop: 2, lineHeight: 1.4 }}>
              Sourcing bar, source tiers, what a flag actually claims
            </span>
          </span>
          <ChevronRight style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
        </Link>

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
