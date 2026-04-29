import { useState } from "react";
import { X, Send, AlertCircle, CheckCircle } from "lucide-react";

type IssueType =
  | "incorrect_flag"
  | "outdated_source"
  | "missing_context"
  | "brand_response"
  | "other";

const ISSUE_LABELS: Record<IssueType, string> = {
  incorrect_flag:  "This flag is factually incorrect",
  outdated_source: "A source is outdated or the link is dead",
  missing_context: "Important context is missing",
  brand_response:  "Official brand response / remediation evidence",
  other:           "Other",
};

interface ReportIssueProps {
  brandName: string;
  flagId?: string;
  onClose: () => void;
}

const M = "'JetBrains Mono', monospace";
const G = "#00c853";
const GR = "#84898E";
const B = "rgba(255,255,255,0.08)";
const RED = "#ff4136";

export function ReportIssue({ brandName, flagId, onClose }: ReportIssueProps) {
  const [issueType, setIssueType] = useState<IssueType>("incorrect_flag");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const descLength = description.trim().length;
  const descValid = descLength >= 50 && descLength <= 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descValid) return;

    setStatus("submitting");

    const payload = {
      flagId:      flagId ?? null,
      brandName,
      issueType,
      description: description.trim(),
      sourceUrl:   sourceUrl.trim() || null,
      email:       email.trim() || null,
      submittedAt: new Date().toISOString(),
    };

    // Persist to localStorage so admin disputes view can read it without a backend
    try {
      const existing = JSON.parse(localStorage.getItem("es_disputes") ?? "[]") as unknown[];
      existing.push({ ...payload, id: crypto.randomUUID(), status: "open" });
      localStorage.setItem("es_disputes", JSON.stringify(existing));
    } catch {
      // non-fatal — localStorage may be unavailable
    }

    const endpoint = import.meta.env.VITE_DISPUTE_ENDPOINT as string | undefined;
    const disputeEmail = import.meta.env.VITE_DISPUTE_EMAIL as string | undefined;

    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStatus("success");
      } catch (err) {
        setErrorMsg("Could not reach dispute endpoint. Your report has been saved locally.");
        setStatus("error");
      }
    } else {
      // Mailto fallback
      const subject = encodeURIComponent(`Brand flag dispute: ${brandName}`);
      const body = encodeURIComponent(
        `Brand: ${brandName}\nIssue type: ${ISSUE_LABELS[issueType]}\n\n${description.trim()}` +
        (sourceUrl ? `\n\nSource URL: ${sourceUrl}` : "") +
        (email ? `\n\nReporter email: ${email}` : "")
      );
      const mailto = `mailto:${disputeEmail ?? "disputes@ethicalshopper.app"}?subject=${subject}&body=${body}`;
      window.location.href = mailto;
      setStatus("success");
    }
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div style={{
        background: "#0a0a0a",
        border: `1px solid ${B}`,
        borderBottom: "none",
        width: "100%",
        maxWidth: 560,
        maxHeight: "90dvh",
        overflowY: "auto",
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 14px",
          borderBottom: `1px solid ${B}`,
        }}>
          <div>
            <p style={{ fontFamily: M, fontSize: "0.44rem", color: G, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 4 }}>
              // REPORT AN ISSUE
            </p>
            <p style={{ fontFamily: M, fontSize: "0.72rem", color: "#fff", letterSpacing: "0.03em" }}>
              {brandName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: GR, padding: 4 }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {status === "success" ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <CheckCircle style={{ width: 36, height: 36, color: G, margin: "0 auto 16px" }} />
            <p style={{ fontFamily: M, fontSize: "0.72rem", color: "#fff", marginBottom: 8 }}>
              Report received
            </p>
            <p style={{ fontFamily: M, fontSize: "0.6rem", color: GR, lineHeight: 1.7, marginBottom: 20 }}>
              We aim to review all submissions within 14 days. Thank you for helping keep this data accurate.
            </p>
            <button
              onClick={onClose}
              style={{
                fontFamily: M, fontSize: "0.6rem", color: G, letterSpacing: "0.12em",
                textTransform: "uppercase", background: "none", border: `1px solid ${G}`,
                padding: "10px 20px", cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>

            {/* Issue type */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontFamily: M, fontSize: "0.46rem", color: GR, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>
                Issue type
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(Object.entries(ISSUE_LABELS) as [IssueType, string][]).map(([val, label]) => (
                  <label key={val} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    border: `1px solid ${issueType === val ? G : "rgba(255,255,255,0.08)"}`,
                    background: issueType === val ? "rgba(0,200,83,0.05)" : "transparent",
                    cursor: "pointer",
                  }}>
                    <input
                      type="radio"
                      name="issueType"
                      value={val}
                      checked={issueType === val}
                      onChange={() => setIssueType(val)}
                      style={{ accentColor: G, flexShrink: 0 }}
                    />
                    <span style={{ fontFamily: M, fontSize: "0.6rem", color: issueType === val ? "#fff" : GR }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <p style={{ fontFamily: M, fontSize: "0.46rem", color: GR, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Description <span style={{ color: RED }}>*</span>
                </p>
                <span style={{ fontFamily: M, fontSize: "0.44rem", color: descLength > 2000 ? RED : descLength >= 50 ? G : GR }}>
                  {descLength} / 2000
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail. Include what is incorrect and what the correct information should be. Minimum 50 characters."
                rows={5}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${descLength > 0 && !descValid ? RED : "rgba(255,255,255,0.12)"}`,
                  color: "#fff",
                  fontFamily: M,
                  fontSize: "0.62rem",
                  lineHeight: 1.7,
                  padding: "12px 14px",
                  resize: "vertical",
                  outline: "none",
                }}
              />
              {descLength > 0 && descLength < 50 && (
                <p style={{ fontFamily: M, fontSize: "0.44rem", color: RED, marginTop: 4 }}>
                  Minimum 50 characters ({50 - descLength} more needed)
                </p>
              )}
            </div>

            {/* Source URL */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontFamily: M, fontSize: "0.46rem", color: GR, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Source URL (optional)
              </p>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontFamily: M,
                  fontSize: "0.62rem",
                  padding: "10px 14px",
                  outline: "none",
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: M, fontSize: "0.46rem", color: GR, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Your email (optional)
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="so we can follow up"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontFamily: M,
                  fontSize: "0.62rem",
                  padding: "10px 14px",
                  outline: "none",
                }}
              />
            </div>

            {status === "error" && (
              <div style={{ display: "flex", gap: 8, padding: "10px 12px", border: `1px solid ${RED}`, marginBottom: 16, background: "rgba(255,65,54,0.06)" }}>
                <AlertCircle size={14} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontFamily: M, fontSize: "0.56rem", color: RED, lineHeight: 1.6 }}>{errorMsg}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, fontFamily: M, fontSize: "0.6rem", color: GR, letterSpacing: "0.1em",
                  textTransform: "uppercase", background: "none",
                  border: "1px solid rgba(255,255,255,0.1)", padding: "12px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!descValid || status === "submitting"}
                style={{
                  flex: 2, fontFamily: M, fontSize: "0.6rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: descValid ? G : "rgba(0,200,83,0.15)",
                  color: descValid ? "#000" : "rgba(0,200,83,0.4)",
                  border: "none", padding: "12px",
                  cursor: descValid ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {status === "submitting" ? "Sending..." : (
                  <>
                    <Send size={13} />
                    Submit report
                  </>
                )}
              </button>
            </div>

            <p style={{ fontFamily: M, fontSize: "0.44rem", color: "rgba(132,137,142,0.4)", marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
              We review all reports within 14 days.{" "}
              <a href="/methodology" style={{ color: "rgba(132,137,142,0.6)", textDecoration: "underline" }}>
                Our methodology
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
