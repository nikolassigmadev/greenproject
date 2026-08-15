// Preferences card for anonymous scan logging.
//
// The opt-out key has been honoured by logScan() for a long time, but nothing
// in the app ever exposed it — which makes it a setting only someone reading
// the source could find. A privacy control nobody can reach isn't a privacy
// control.
//
// The disclosure list below is written from the actual ScanLogInput fields. If
// a new field is added to what gets sent, it belongs here too — a list that
// drifts from the payload is worse than no list, because it reads as a promise.

import { useEffect, useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import {
  getAnonId, isScanLoggingOptedOut, setScanLoggingOptedOut, SCAN_LOGGING_EVENT,
} from "@/utils/scanLogger";
import { toast } from "sonner";

/** Exactly what leaves the device on a scan, in plain language. */
const LOGGED = [
  "The product: barcode, name, brand, eco-score",
  "The verdict we showed you, and the verdict you'd have seen with neutral settings",
  "Whether you tapped Buy or Skip",
  "Your priority sliders, as numbers",
  "The region you set in Settings — never your GPS or IP location",
  "A random ID for this device, so we can count people instead of scans",
  "Whether we had a cleaner alternative to offer, whether you saw it, and whether you tapped it",
  "How long you spent on the product page",
  "For camera scans: the photo you took, and what the AI read from it",
];

const NOT_LOGGED = [
  "Your name, email, or any account — there isn't one",
  "Your IP address or GPS position",
  "Anything at all if you turn this off",
];

function Row({ text, kind }: { text: string; kind: "logged" | "not" }) {
  return (
    <li style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0, marginTop: 6, width: 5, height: 5, borderRadius: 999,
          background: kind === "logged" ? DS.muted : DS.good,
        }}
      />
      <span style={{ fontSize: 12, color: DS.muted, lineHeight: 1.5 }}>{text}</span>
    </li>
  );
}

export function ScanLoggingCard() {
  const [optedOut, setOptedOut] = useState(() => isScanLoggingOptedOut());
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const anonId = getAnonId();

  useEffect(() => {
    const sync = () => setOptedOut(isScanLoggingOptedOut());
    window.addEventListener(SCAN_LOGGING_EVENT, sync);
    return () => window.removeEventListener(SCAN_LOGGING_EVENT, sync);
  }, []);

  const toggle = () => {
    const next = !optedOut;
    setScanLoggingOptedOut(next);
    setOptedOut(next);
    toast.success(
      next ? "Scan logging off — nothing more will be sent" : "Thanks — anonymous scan data is on",
    );
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(anonId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the ID and copy it manually");
    }
  };

  return (
    <div
      style={{
        background: DS.card, borderRadius: 18, padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 2 }}>
            Anonymous scan data
          </div>
          <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5 }}>
            {optedOut
              ? "Off. Nothing about your scans leaves this device."
              : "On. Helps us find where shoppers want an ethical option and can't get one."}
          </div>
        </div>

        {/* Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={!optedOut}
          aria-label="Share anonymous scan data"
          onClick={toggle}
          style={{
            flexShrink: 0, width: 48, height: 28, borderRadius: 999, border: "none",
            cursor: "pointer", padding: 3, marginTop: 2,
            background: optedOut ? DS.hair : DS.good,
            transition: "background 0.18s ease",
          }}
        >
          <span
            style={{
              display: "block", width: 22, height: 22, borderRadius: 999, background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              transform: optedOut ? "translateX(0)" : "translateX(20px)",
              transition: "transform 0.18s ease",
            }}
          />
        </button>
      </div>

      {/* Disclosure — collapsed by default, but one tap away and specific. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5,
          background: "none", border: "none", padding: 0, cursor: "pointer",
          fontFamily: DS.font, fontSize: 12, fontWeight: 700, color: DS.ink,
        }}
      >
        What exactly gets sent?
        <ChevronDown
          style={{
            width: 13, height: 13,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.18s ease",
          }}
        />
      </button>

      {open && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${DS.hair}`, paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Sent with each scan
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
            {LOGGED.map((t) => <Row key={t} text={t} kind="logged" />)}
          </ul>

          <p style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Never sent
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
            {NOT_LOGGED.map((t) => <Row key={t} text={t} kind="not" />)}
          </ul>

          {/* The anon id is the only handle a user has on their own rows, so
              it has to be visible for an erasure request to be answerable. */}
          <p style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Your device ID
          </p>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: DS.bg, borderRadius: 11, padding: "9px 11px",
            }}
          >
            <code
              style={{
                flex: 1, minWidth: 0, fontSize: 11, color: DS.ink,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {anonId}
            </code>
            <button
              type="button"
              onClick={copyId}
              aria-label="Copy your device ID"
              style={{
                flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
                background: "transparent", border: `1px solid ${DS.hair}`, borderRadius: 8,
                padding: "5px 9px", cursor: "pointer", fontFamily: DS.font,
                fontSize: 11, fontWeight: 700, color: copied ? DS.good : DS.muted,
              }}
            >
              {copied
                ? <><Check style={{ width: 11, height: 11 }} strokeWidth={3} /> Copied</>
                : <><Copy style={{ width: 11, height: 11 }} /> Copy</>}
            </button>
          </div>
          <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.5, margin: "8px 0 0" }}>
            Turning the switch off stops anything further being sent, but doesn't remove what's
            already recorded. To have that deleted, send us this ID and we'll erase every row
            attached to it.
          </p>
        </div>
      )}
    </div>
  );
}
