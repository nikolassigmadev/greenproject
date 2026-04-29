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

const BLUE = "#2979FF";
const BG   = "#F5F7FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";
const RED = "#ef4444";

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

  const inputStyle = {
    width: "100%", boxSizing: "border-box" as const,
    background: BG,
    border: `1px solid ${BORDER}`,
    color: TEXT,
    fontSize: "0.85rem",
    padding: "10px 14px",
    borderRadius: 10,
    outline: "none",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderBottom: "none",
        width: "100%",
        maxWidth: 560,
        maxHeight: "90dvh",
        overflowY: "auto",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px 14px",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: TEXT_MUTED, marginBottom: 2 }}>Report an issue</p>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT }}>{brandName}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: TEXT_MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {status === "success" ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <CheckCircle style={{ width: 40, height: 40, color: "#10b981", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, marginBottom: 8 }}>Report received</p>
            <p style={{ fontSize: "0.82rem", color: TEXT_MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              We aim to review all submissions within 14 days. Thank you for helping keep this data accurate.
            </p>
            <button
              onClick={onClose}
              style={{
                background: BLUE, color: "#fff", border: "none",
                padding: "10px 28px", borderRadius: 12,
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "20px" }}>

            {/* Issue type */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: TEXT_MUTED, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Issue type
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(ISSUE_LABELS) as [IssueType, string][]).map(([val, label]) => (
                  <label key={val} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10,
                    border: `1px solid ${issueType === val ? BLUE : BORDER}`,
                    background: issueType === val ? "#EBF2FF" : BG,
                    cursor: "pointer",
                  }}>
                    <input
                      type="radio"
                      name="issueType"
                      value={val}
                      checked={issueType === val}
                      onChange={() => setIssueType(val)}
                      style={{ accentColor: BLUE, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.82rem", color: issueType === val ? BLUE : TEXT, fontWeight: issueType === val ? 600 : 400 }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Description <span style={{ color: RED }}>*</span>
                </p>
                <span style={{ fontSize: "0.72rem", color: descLength > 2000 ? RED : descLength >= 50 ? "#10b981" : TEXT_MUTED }}>
                  {descLength} / 2000
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail. Include what is incorrect and what the correct information should be. Minimum 50 characters."
                rows={5}
                style={{
                  ...inputStyle,
                  border: `1px solid ${descLength > 0 && !descValid ? RED : BORDER}`,
                  resize: "vertical",
                }}
              />
              {descLength > 0 && descLength < 50 && (
                <p style={{ fontSize: "0.72rem", color: RED, marginTop: 4 }}>
                  Minimum 50 characters ({50 - descLength} more needed)
                </p>
              )}
            </div>

            {/* Source URL */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Source URL (optional)
              </p>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Your email (optional)
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="so we can follow up"
                style={inputStyle}
              />
            </div>

            {status === "error" && (
              <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, border: `1px solid ${RED}`, marginBottom: 16, background: "#FFF0F0" }}>
                <AlertCircle size={14} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: "0.78rem", color: RED, lineHeight: 1.6 }}>{errorMsg}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, fontSize: "0.85rem", fontWeight: 600, color: TEXT_MUTED,
                  background: BG, border: `1px solid ${BORDER}`, padding: "12px", borderRadius: 12, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!descValid || status === "submitting"}
                style={{
                  flex: 2, fontSize: "0.85rem", fontWeight: 700,
                  background: descValid ? BLUE : "#C3D6FF",
                  color: descValid ? "#fff" : "#9DB8E8",
                  border: "none", padding: "12px", borderRadius: 12,
                  cursor: descValid ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {status === "submitting" ? "Sending…" : (
                  <>
                    <Send size={14} />
                    Submit report
                  </>
                )}
              </button>
            </div>

            <p style={{ fontSize: "0.7rem", color: TEXT_MUTED, marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
              We review all reports within 14 days.{" "}
              <a href="/methodology" style={{ color: BLUE, textDecoration: "underline" }}>
                Our methodology
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
