import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  Flag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { DS } from "@/styles/design-tokens";
import { getBackendUrl } from "@/config/backend";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "forced_labour", label: "Forced labour" },
  { value: "child_labour", label: "Child labour" },
  { value: "wage_theft", label: "Wage theft" },
  { value: "unsafe_conditions", label: "Unsafe conditions" },
  { value: "union_busting", label: "Union busting" },
  { value: "discrimination", label: "Discrimination" },
  { value: "supply_chain_opacity", label: "Supply chain opacity" },
  { value: "animal_welfare", label: "Animal welfare" },
  { value: "environmental_harm", label: "Environmental harm" },
  { value: "boycott_listed", label: "Boycott listed" },
];

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: DS.bad },
  { value: "high", label: "High", color: "#EA580C" },
  { value: "medium", label: "Medium", color: DS.warn },
  { value: "low", label: "Low", color: DS.muted },
];

const TIER_HELP: Record<Tier, string> = {
  tier1: "Government, court, or regulatory finding",
  tier2: "Independent NGO or academic research",
  tier3: "News report or investigative journalism",
};

const MAX_SOURCES = 5;
const SUMMARY_MIN = 10;
const SUMMARY_MAX = 300;
const BRAND_MIN = 2;
const BRAND_MAX = 80;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tier = "tier1" | "tier2" | "tier3";
type Severity = "critical" | "high" | "medium" | "low";

interface SourceDraft {
  url: string;
  title: string;
  publisher: string;
  tier: Tier;
}

interface FormErrors {
  brandName?: string;
  category?: string;
  severity?: string;
  summary?: string;
  email?: string;
  sources?: Array<{
    url?: string;
    title?: string;
    publisher?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptySource(): SourceDraft {
  return { url: "", title: "", publisher: "", tier: "tier2" };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function meetsSourcingBar(sources: SourceDraft[]): boolean {
  const filled = sources.filter(
    (s) => s.url.trim() && s.title.trim() && s.publisher.trim(),
  );

  const tier1 = filled.filter((s) => s.tier === "tier1");
  if (tier1.length >= 1) return true;

  const tier2 = filled.filter((s) => s.tier === "tier2");
  const tier3 = filled.filter((s) => s.tier === "tier3");

  const uniqueTier2Publishers = new Set(
    tier2.map((s) => s.publisher.trim().toLowerCase()),
  );
  if (uniqueTier2Publishers.size >= 2) return true;

  if (tier2.length >= 1 && tier3.length >= 2) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SubmitFlag() {
  const navigate = useNavigate();

  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [summary, setSummary] = useState("");
  const [sources, setSources] = useState<SourceDraft[]>([emptySource()]);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string | number } | null>(null);

  const summaryCount = summary.length;
  const summaryOverMax = summaryCount > SUMMARY_MAX;

  const sourcingBarMet = useMemo(() => meetsSourcingBar(sources), [sources]);

  // ----- Source list handlers -----------------------------------------------

  const updateSource = (index: number, patch: Partial<SourceDraft>) => {
    setSources((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  const addSource = () => {
    if (sources.length >= MAX_SOURCES) return;
    setSources((prev) => [...prev, emptySource()]);
  };

  const removeSource = (index: number) => {
    if (sources.length <= 1) return;
    setSources((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      if (!prev.sources) return prev;
      const next = [...prev.sources];
      next.splice(index, 1);
      return { ...prev, sources: next };
    });
  };

  // ----- Validation ---------------------------------------------------------

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    const trimmedBrand = brandName.trim();
    if (!trimmedBrand) {
      next.brandName = "Brand name is required.";
    } else if (trimmedBrand.length < BRAND_MIN) {
      next.brandName = `Brand name must be at least ${BRAND_MIN} characters.`;
    } else if (trimmedBrand.length > BRAND_MAX) {
      next.brandName = `Brand name must be at most ${BRAND_MAX} characters.`;
    }

    if (!category) next.category = "Pick a category.";
    if (!severity) next.severity = "Pick a severity.";

    const trimmedSummary = summary.trim();
    if (trimmedSummary.length < SUMMARY_MIN) {
      next.summary = `Summary must be at least ${SUMMARY_MIN} characters.`;
    } else if (trimmedSummary.length > SUMMARY_MAX) {
      next.summary = `Summary must be at most ${SUMMARY_MAX} characters.`;
    }

    if (email.trim()) {
      const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!looksLikeEmail) next.email = "Enter a valid email address.";
    }

    const sourceErrors: Array<{
      url?: string;
      title?: string;
      publisher?: string;
    }> = [];
    let hasSourceError = false;
    sources.forEach((s, i) => {
      const row: { url?: string; title?: string; publisher?: string } = {};
      const url = s.url.trim();
      if (!url) {
        row.url = "URL is required.";
        hasSourceError = true;
      } else if (!isValidHttpUrl(url)) {
        row.url = "Use a full http(s) URL.";
        hasSourceError = true;
      }
      if (!s.title.trim()) {
        row.title = "Title is required.";
        hasSourceError = true;
      }
      if (!s.publisher.trim()) {
        row.publisher = "Publisher is required.";
        hasSourceError = true;
      }
      sourceErrors[i] = row;
    });
    if (hasSourceError) next.sources = sourceErrors;

    return next;
  };

  // ----- Submit -------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Silent honeypot trip — pretend success but don't actually send.
    if (honeypot.trim().length > 0) {
      setSuccess({ id: "—" });
      return;
    }

    const next = validate();
    setErrors(next);
    const hasErrors =
      Object.keys(next).filter((k) => k !== "sources").length > 0 ||
      (next.sources?.some((row) => Object.keys(row).length > 0) ?? false);
    if (hasErrors) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);

    const payload = {
      brandName: brandName.trim(),
      category,
      severity,
      summary: summary.trim(),
      sources: sources.map((s) => ({
        url: s.url.trim(),
        title: s.title.trim(),
        publisher: s.publisher.trim(),
        tier: s.tier,
      })),
      submitterEmail: email.trim() || null,
      company_website: honeypot, // honeypot, always empty for humans
    };

    try {
      const res = await fetch(`${getBackendUrl()}/api/community-flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        toast.error("Too many submissions. Please come back in an hour.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        let message = "Submission failed. Please try again.";
        try {
          const body = await res.json();
          if (body?.error && typeof body.error === "string") message = body.error;
        } catch {
          /* ignore */
        }
        toast.error(message);
        setSubmitting(false);
        return;
      }

      let id: string | number = "—";
      try {
        const body = await res.json();
        if (body?.id != null) id = body.id;
      } catch {
        /* ignore */
      }

      setSuccess({ id });
      setSubmitting(false);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setBrandName("");
    setCategory("");
    setSeverity("");
    setSummary("");
    setSources([emptySource()]);
    setEmail("");
    setHoneypot("");
    setErrors({});
    setSuccess(null);
  };

  // ----- Success view -------------------------------------------------------

  if (success) {
    return (
      <div
        style={{
          background: DS.bg,
          minHeight: "100dvh",
          fontFamily: DS.font,
          color: DS.ink,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <main
          style={{
            flex: 1,
            maxWidth: 560,
            margin: "0 auto",
            width: "100%",
            padding: "0 20px 96px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: DS.card,
              borderRadius: 20,
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              width: "100%",
              marginTop: 24,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: DS.goodBg,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <CheckCircle2
                style={{ width: 32, height: 32, color: DS.good }}
              />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: "0 0 10px",
                letterSpacing: -0.4,
              }}
            >
              Thanks — submission #{String(success.id)} is in our queue.
            </h1>
            <p
              style={{
                fontSize: 13.5,
                color: DS.muted,
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              Our team reviews against the same tier-1/2/3 sourcing bar that
              powers verified flags. You'll see it on the brand page if it
              clears.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                onClick={resetForm}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: DS.ink,
                  color: DS.card,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: DS.font,
                }}
              >
                Submit another
              </button>
              <Link
                to="/"
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: `1px solid ${DS.hair}`,
                  background: DS.card,
                  color: DS.ink,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: DS.font,
                }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ----- Form view ----------------------------------------------------------

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: DS.ink,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  };

  const helperStyle: React.CSSProperties = {
    fontSize: 11.5,
    color: DS.muted,
    marginTop: 4,
    lineHeight: 1.5,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11.5,
    color: DS.bad,
    marginTop: 4,
    lineHeight: 1.5,
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    border: `1px solid ${DS.hair}`,
    background: DS.card,
    color: DS.ink,
    fontSize: 14,
    outline: "none",
    fontFamily: DS.font,
    boxSizing: "border-box",
  };

  const fieldGroup: React.CSSProperties = { marginBottom: 22 };

  return (
    <div
      style={{
        background: DS.bg,
        minHeight: "100dvh",
        fontFamily: DS.font,
        color: DS.ink,
      }}
    >
      <main
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "0 20px 96px",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingTop:
              "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))",
            paddingBottom: 16,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "none",
              background: DS.card,
              color: DS.ink,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: 0,
                letterSpacing: -0.4,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Flag
                style={{ width: 20, height: 20, color: DS.bad }}
              />
              Flag a brand
            </h1>
            <p
              style={{
                fontSize: 12.5,
                color: DS.muted,
                margin: "2px 0 0",
              }}
            >
              Submit a brand + sources. We moderate against our sourcing bar.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot — hidden off-screen */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px" }}
          >
            <label>
              Company website
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>

          {/* Brand name */}
          <div style={fieldGroup}>
            <label htmlFor="brandName" style={labelStyle}>
              Brand name
            </label>
            <input
              id="brandName"
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Nestlé"
              maxLength={BRAND_MAX + 10}
              style={{
                ...inputBase,
                borderColor: errors.brandName ? DS.bad : DS.hair,
              }}
            />
            {errors.brandName ? (
              <p style={errorStyle}>{errors.brandName}</p>
            ) : (
              <p style={helperStyle}>
                The exact name shoppers will see on a package.
              </p>
            )}
          </div>

          {/* Category */}
          <div style={fieldGroup}>
            <label htmlFor="category" style={labelStyle}>
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                ...inputBase,
                appearance: "none",
                WebkitAppearance: "none",
                paddingRight: 36,
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                backgroundSize: "12px 12px",
                borderColor: errors.category ? DS.bad : DS.hair,
                color: category ? DS.ink : DS.muted,
              }}
            >
              <option value="">Pick a category…</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p style={errorStyle}>{errors.category}</p>
            )}
          </div>

          {/* Severity */}
          <div style={fieldGroup}>
            <span style={labelStyle}>Severity</span>
            <div
              role="radiogroup"
              aria-label="Severity"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
              }}
            >
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severity === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${active ? DS.ink : DS.hair}`,
                      background: active ? DS.card : DS.card,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      color: DS.ink,
                      boxShadow: active
                        ? "0 0 0 1px rgba(0,0,0,0.04)"
                        : "none",
                    }}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={opt.value}
                      checked={active}
                      onChange={() => setSeverity(opt.value)}
                      style={{ accentColor: opt.color, margin: 0 }}
                    />
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: opt.color,
                        flexShrink: 0,
                      }}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
            {errors.severity && (
              <p style={errorStyle}>{errors.severity}</p>
            )}
          </div>

          {/* Summary */}
          <div style={fieldGroup}>
            <label htmlFor="summary" style={labelStyle}>
              Summary
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One factual sentence: what is the finding?"
              rows={3}
              style={{
                ...inputBase,
                height: "auto",
                minHeight: 88,
                padding: "12px 14px",
                resize: "vertical",
                lineHeight: 1.5,
                borderColor: errors.summary ? DS.bad : DS.hair,
                fontFamily: DS.font,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
                gap: 8,
              }}
            >
              {errors.summary ? (
                <p style={{ ...errorStyle, margin: 0 }}>{errors.summary}</p>
              ) : (
                <p style={{ ...helperStyle, margin: 0 }}>
                  Stick to facts. Sources do the heavy lifting below.
                </p>
              )}
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: summaryOverMax
                    ? DS.bad
                    : summaryCount < SUMMARY_MIN
                      ? DS.muted
                      : DS.good,
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {summaryCount}/{SUMMARY_MAX}
              </span>
            </div>
          </div>

          {/* Sources */}
          <div style={fieldGroup}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ ...labelStyle, marginBottom: 0 }}>
                Sources ({sources.length}/{MAX_SOURCES})
              </span>
              <span style={{ fontSize: 11, color: DS.muted }}>
                1 to 5 entries
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {sources.map((src, i) => {
                const rowErr = errors.sources?.[i] ?? {};
                return (
                  <div
                    key={i}
                    style={{
                      background: DS.card,
                      borderRadius: 14,
                      padding: 14,
                      border: `1px solid ${DS.hair}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: DS.muted,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Source {i + 1}
                      </span>
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => removeSource(i)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            color: DS.muted,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                          Remove
                        </button>
                      )}
                    </div>

                    {/* URL */}
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: DS.muted,
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        URL
                      </label>
                      <div style={{ position: "relative" }}>
                        <ExternalLink
                          style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 13,
                            height: 13,
                            color: DS.muted,
                            pointerEvents: "none",
                          }}
                        />
                        <input
                          type="url"
                          value={src.url}
                          onChange={(e) =>
                            updateSource(i, { url: e.target.value })
                          }
                          placeholder="https://example.gov/report"
                          style={{
                            ...inputBase,
                            height: 40,
                            paddingLeft: 34,
                            fontSize: 13,
                            borderColor: rowErr.url ? DS.bad : DS.hair,
                          }}
                        />
                      </div>
                      {rowErr.url && (
                        <p style={errorStyle}>{rowErr.url}</p>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: DS.muted,
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        value={src.title}
                        onChange={(e) =>
                          updateSource(i, { title: e.target.value })
                        }
                        placeholder="Article or report headline"
                        style={{
                          ...inputBase,
                          height: 40,
                          fontSize: 13,
                          borderColor: rowErr.title ? DS.bad : DS.hair,
                        }}
                      />
                      {rowErr.title && (
                        <p style={errorStyle}>{rowErr.title}</p>
                      )}
                    </div>

                    {/* Publisher */}
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: DS.muted,
                          marginBottom: 4,
                          display: "block",
                        }}
                      >
                        Publisher
                      </label>
                      <input
                        type="text"
                        value={src.publisher}
                        onChange={(e) =>
                          updateSource(i, { publisher: e.target.value })
                        }
                        placeholder="e.g. US Department of Labor"
                        style={{
                          ...inputBase,
                          height: 40,
                          fontSize: 13,
                          borderColor: rowErr.publisher ? DS.bad : DS.hair,
                        }}
                      />
                      {rowErr.publisher && (
                        <p style={errorStyle}>{rowErr.publisher}</p>
                      )}
                    </div>

                    {/* Tier */}
                    <div>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: DS.muted,
                          marginBottom: 6,
                          display: "block",
                        }}
                      >
                        Tier
                      </label>
                      <div
                        role="radiogroup"
                        aria-label={`Source ${i + 1} tier`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 6,
                        }}
                      >
                        {(["tier1", "tier2", "tier3"] as Tier[]).map(
                          (tier) => {
                            const active = src.tier === tier;
                            const label =
                              tier === "tier1"
                                ? "Tier 1"
                                : tier === "tier2"
                                  ? "Tier 2"
                                  : "Tier 3";
                            return (
                              <button
                                key={tier}
                                type="button"
                                onClick={() =>
                                  updateSource(i, { tier })
                                }
                                aria-pressed={active}
                                style={{
                                  height: 36,
                                  borderRadius: 10,
                                  border: `1px solid ${active ? DS.ink : DS.hair}`,
                                  background: active ? DS.ink : DS.card,
                                  color: active ? DS.card : DS.ink,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  fontFamily: DS.font,
                                }}
                              >
                                {label}
                              </button>
                            );
                          },
                        )}
                      </div>
                      <p style={helperStyle}>{TIER_HELP[src.tier]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {sources.length < MAX_SOURCES && (
              <button
                type="button"
                onClick={addSource}
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: 40,
                  borderRadius: 12,
                  border: `1px dashed ${DS.hair}`,
                  background: "transparent",
                  color: DS.ink,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: DS.font,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add another source
              </button>
            )}
          </div>

          {/* Sourcing bar preview */}
          <div
            style={{
              ...fieldGroup,
              background: sourcingBarMet ? DS.goodBg : DS.warnBg,
              border: `1px solid ${sourcingBarMet ? DS.good : DS.warn}`,
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: sourcingBarMet ? DS.goodBg : DS.warnBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {sourcingBarMet ? (
                <CheckCircle2
                  style={{ width: 16, height: 16, color: DS.good }}
                />
              ) : (
                <AlertTriangle
                  style={{ width: 16, height: 16, color: DS.warn }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: sourcingBarMet ? DS.good : DS.warn,
                  margin: 0,
                  letterSpacing: 0.2,
                }}
              >
                {sourcingBarMet
                  ? "Meets sourcing bar"
                  : "Does not meet sourcing bar"}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: DS.ink,
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                }}
              >
                {sourcingBarMet
                  ? "Eligible for verified status after our team review."
                  : "Will land in pending review — add a stronger source to qualify."}
              </p>
            </div>
          </div>

          {/* Email */}
          <div style={fieldGroup}>
            <label htmlFor="email" style={labelStyle}>
              Your email <span style={{ color: DS.muted, fontWeight: 500 }}>(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                ...inputBase,
                borderColor: errors.email ? DS.bad : DS.hair,
              }}
            />
            {errors.email ? (
              <p style={errorStyle}>{errors.email}</p>
            ) : (
              <p style={helperStyle}>
                We'll only contact you if we need to clarify a source.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 14,
              border: "none",
              background: submitting ? DS.hair : DS.ink,
              color: submitting ? DS.muted : DS.card,
              fontSize: 15,
              fontWeight: 800,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: DS.font,
              letterSpacing: 0.2,
              marginTop: 8,
            }}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>

          <p
            style={{
              fontSize: 11.5,
              color: DS.muted,
              textAlign: "center",
              marginTop: 14,
              lineHeight: 1.6,
            }}
          >
            Submissions are moderated. We may follow up via email if a source
            needs clarification.
          </p>
        </form>
      </main>
    </div>
  );
}
