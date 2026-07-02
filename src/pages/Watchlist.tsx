import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye, Trash2, ExternalLink, AlertTriangle, CheckCircle2, Bell, BellOff, Megaphone,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";
import {
  loadWatchlist,
  removeFromWatchlist,
  addToWatchlist,
  WATCHLIST_EVENT,
} from "@/utils/watchlist";
import { getVerifiedFlagForBrand } from "@/services/brandFlags";
import type { BrandFlagV2 } from "@/types/brandFlag";
import { findLaborAllegations } from "@/utils/laborCheck";
import { getBrandTimeline, markEventsSeen, type BrandEvent } from "@/utils/brandEvents";
import {
  isPushSupported, getLocalPushStatus, enablePushNotifications,
  disablePushNotifications, PUSH_EVENT, type PushStatus,
} from "@/utils/pushNotifications";

function FlagRow({ flag }: { flag: BrandFlagV2 }) {
  const top = flag.sources[0];
  return (
    <div style={{
      background: DS.warnBg, borderRadius: 12, padding: "10px 12px",
      marginTop: 8, fontSize: 12.5, color: DS.ink, lineHeight: 1.4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <AlertTriangle style={{ width: 12, height: 12, color: DS.warn, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{flag.severity}</span>
        <span style={{ color: DS.muted }}>·</span>
        <span style={{ textTransform: "capitalize", color: DS.muted }}>
          {flag.category.replace(/_/g, " ")}
        </span>
      </div>
      <p style={{ margin: 0 }}>{flag.summary}</p>
      {top && (
        <a
          href={top.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            color: DS.muted, fontSize: 11, fontWeight: 600,
            marginTop: 6, textDecoration: "none",
          }}
        >
          <ExternalLink style={{ width: 10, height: 10 }} />
          {top.publisher}
        </a>
      )}
    </div>
  );
}

// ── Alerts toggle — local notifications when a watched brand gets an update ──

function AlertsCard() {
  const [status, setStatus] = useState<PushStatus>(() => getLocalPushStatus());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = () => setStatus(getLocalPushStatus());
    window.addEventListener(PUSH_EVENT, handler);
    return () => window.removeEventListener(PUSH_EVENT, handler);
  }, []);

  if (!isPushSupported()) return null;

  const subscribed = status === "subscribed";
  const denied = status === "denied";

  const toggle = async () => {
    if (busy || denied) return;
    setBusy(true);
    try {
      if (subscribed) await disablePushNotifications();
      else await enablePushNotifications();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      background: DS.card, borderRadius: 16, padding: "13px 16px", marginBottom: 16,
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      {subscribed
        ? <Bell style={{ width: 17, height: 17, color: DS.good, flexShrink: 0 }} />
        : <BellOff style={{ width: 17, height: 17, color: DS.muted, flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: DS.ink }}>
          {subscribed ? "Alerts on" : "Brand alerts"}
        </div>
        <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.4 }}>
          {denied
            ? "Notifications are blocked in your browser settings."
            : subscribed
              ? "We'll notify you when a brand you watch gets a new flag or boycott listing."
              : "Get notified when a watched brand gets a new flag or boycott listing."}
        </div>
      </div>
      {!denied && (
        <button
          onClick={toggle}
          disabled={busy}
          style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: "none",
            background: subscribed ? DS.bg : DS.ink,
            color: subscribed ? DS.muted : DS.card,
            fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer",
            fontFamily: DS.font,
          }}
        >
          {subscribed ? "Turn off" : "Enable"}
        </button>
      )}
    </div>
  );
}

// ── Activity timeline — what's happened to the brands you watch ─────────────

function severityTone(severity?: BrandEvent["severity"]): string {
  if (severity === "critical" || severity === "high") return DS.bad;
  return DS.warn;
}

function EventRow({ event, divider }: { event: BrandEvent; divider: boolean }) {
  const tone = event.type === "boycott" ? DS.warn : severityTone(event.severity);
  const Icon = event.type === "boycott" ? Megaphone : AlertTriangle;
  const dateLabel = event.date
    ? new Date(event.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "Ongoing";

  return (
    <div style={{
      display: "flex", gap: 11, padding: "13px 16px",
      borderTop: divider ? `1px solid ${DS.hair}` : "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0, marginTop: 1,
        background: `color-mix(in srgb, ${tone} 14%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 13, height: 13, color: tone }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: DS.ink }}>{event.brand}</span>
          <span style={{ fontSize: 12, color: DS.muted }}>· {event.title}</span>
          {event.isNew && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.06em",
              color: DS.card, background: DS.bad, borderRadius: 6, padding: "2px 6px",
            }}>
              NEW
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: DS.ink, opacity: 0.85, margin: "4px 0 0", lineHeight: 1.45 }}>
          {event.detail}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <span style={{ fontSize: 10.5, color: DS.muted }}>{dateLabel}</span>
          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                color: DS.muted, fontSize: 10.5, fontWeight: 600, textDecoration: "none",
              }}
            >
              <ExternalLink style={{ width: 9, height: 9 }} />
              {event.publisher ?? "Source"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ watchlist }: { watchlist: string[] }) {
  // Recompute when the watchlist changes; capture the NEW state at read time so
  // badges stay visible for this visit even after we mark them seen below.
  const events = useMemo(() => getBrandTimeline(watchlist), [watchlist]);

  // Viewing the timeline clears the NEW badges for next time.
  useEffect(() => {
    const unseen = events.filter((e) => e.isNew);
    if (unseen.length > 0) markEventsSeen(unseen);
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div style={{ marginTop: 22 }}>
      <p style={{
        fontSize: 11, fontWeight: 800, color: DS.muted,
        letterSpacing: "0.08em", textTransform: "uppercase",
        margin: "0 2px 8px",
      }}>
        Activity
      </p>
      <div style={{
        background: DS.card, borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}>
        {events.map((event, i) => (
          <EventRow key={event.id} event={event} divider={i > 0} />
        ))}
      </div>
    </div>
  );
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => loadWatchlist());
  const [newBrand, setNewBrand] = useState("");

  useEffect(() => {
    const handler = () => setWatchlist(loadWatchlist());
    window.addEventListener(WATCHLIST_EVENT, handler);
    return () => window.removeEventListener(WATCHLIST_EVENT, handler);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrand.trim();
    if (!name) return;
    
    // Look up parent company
    const laborRecord = findLaborAllegations(name, null);
    const formattedName = laborRecord 
      ? `${laborRecord.parentCompany} (${name})`
      : name;
    
    addToWatchlist(formattedName);
    setNewBrand("");
  };

  return (
    <div style={{
      background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink,
    }}>
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 96px" }}>
        <header style={{
          display: "flex", alignItems: "center", gap: 16,
          paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))",
          paddingBottom: 18,
        }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Eye style={{ width: 20, height: 20, color: DS.bad, strokeWidth: 2.2 }} />
              Watchlist
            </h1>
            <p style={{ fontSize: 12.5, color: DS.muted, margin: "4px 0 0" }}>
              Brands you're tracking
            </p>
          </div>
        </header>

        <AlertsCard />

        <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="Add a brand (e.g. Nestlé)"
            style={{
              flex: 1, height: 44, padding: "0 14px", borderRadius: 12,
              border: `1px solid ${DS.hair}`, background: DS.card, color: DS.ink,
              fontSize: 14, outline: "none", fontFamily: DS.font,
            }}
          />
          <button
            type="submit"
            disabled={!newBrand.trim()}
            style={{
              height: 44, padding: "0 18px", borderRadius: 12, border: "none",
              background: newBrand.trim() ? DS.ink : DS.hair,
              color: newBrand.trim() ? DS.card : DS.muted,
              fontSize: 13, fontWeight: 700,
              cursor: newBrand.trim() ? "pointer" : "not-allowed",
              fontFamily: DS.font,
            }}
          >
            Add
          </button>
        </form>

        {watchlist.length === 0 ? (
          <div style={{
            background: DS.card, borderRadius: 18, padding: "40px 24px", textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: DS.bg,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              <Eye style={{ width: 24, height: 24, color: DS.muted }} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>No brands yet</h2>
            <p style={{ fontSize: 13, color: DS.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
              Add brands you want to track. We'll show a banner whenever you scan a product from them.
            </p>
            <Link to="/database" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 12,
              background: DS.ink, color: DS.card, textDecoration: "none",
              fontSize: 13, fontWeight: 700,
            }}>
              Browse the database
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {watchlist.map((brand) => {
              const flag = getVerifiedFlagForBrand(brand);
              return (
                <div
                  key={brand}
                  style={{
                    background: DS.card, borderRadius: 16, padding: "14px 16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink }}>
                        {brand}
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6, marginTop: 2,
                        fontSize: 11.5, color: flag ? DS.warn : DS.good,
                      }}>
                        {flag ? (
                          <>
                            <AlertTriangle style={{ width: 11, height: 11 }} />
                            <span>{flag.sources.length} source{flag.sources.length === 1 ? "" : "s"} verified</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 style={{ width: 11, height: 11 }} />
                            <span>No verified flags in our database</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWatchlist(brand)}
                      aria-label={`Remove ${brand}`}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: "none",
                        background: DS.bg, color: DS.muted, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Trash2 style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                  {flag && <FlagRow flag={flag} />}
                </div>
              );
            })}
          </div>
        )}

        <ActivityTimeline watchlist={watchlist} />
      </main>
    </div>
  );
}
