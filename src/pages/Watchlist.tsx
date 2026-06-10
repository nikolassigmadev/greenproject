import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, Trash2, ExternalLink, AlertTriangle, CheckCircle2, Bell, BellOff } from "lucide-react";
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
import {
  enablePushNotifications, disablePushNotifications,
  getLocalPushStatus, showLocalDemoNotification, PUSH_EVENT, type PushStatus,
} from "@/utils/pushNotifications";
import { toast } from "sonner";

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

export default function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<string[]>(() => loadWatchlist());
  const [newBrand, setNewBrand] = useState("");
  const [pushStatus, setPushStatus] = useState<PushStatus>(() => getLocalPushStatus());
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    const handler = () => setWatchlist(loadWatchlist());
    window.addEventListener(WATCHLIST_EVENT, handler);
    return () => window.removeEventListener(WATCHLIST_EVENT, handler);
  }, []);

  useEffect(() => {
    const handler = () => setPushStatus(getLocalPushStatus());
    window.addEventListener(PUSH_EVENT, handler);
    return () => window.removeEventListener(PUSH_EVENT, handler);
  }, []);

  const handlePushToggle = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushStatus === "subscribed") {
        await disablePushNotifications();
        toast.success("Notifications off");
      } else {
        const res = await enablePushNotifications();
        if (res.ok) toast.success("You'll get a heads-up about your watched brands");
        else if (res.reason === "denied") toast.error("Permission denied — enable notifications in your browser");
        else if (res.reason === "unsupported") toast.error("Your browser doesn't support push notifications");
        else toast.error("Couldn't enable notifications");
      }
    } finally {
      setPushBusy(false);
    }
  };

  const handleDemoPing = async () => {
    if (watchlist.length === 0) {
      toast.error("Add a brand first");
      return;
    }
    const brand = watchlist[0];
    const ok = await showLocalDemoNotification(
      `${brand} update`,
      `Heads-up: there's new verified information on ${brand}. Tap to review.`,
    );
    if (!ok) toast.error("Enable notifications first");
  };

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
          display: "flex", alignItems: "center", gap: 8,
          paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))",
          paddingBottom: 16,
        }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 36, height: 36, borderRadius: 999, border: "none",
              background: DS.card, color: DS.ink, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Eye style={{ width: 20, height: 20, color: DS.bad, strokeWidth: 2.2 }} />
              Watchlist
            </h1>
            <p style={{ fontSize: 12.5, color: DS.muted, margin: "2px 0 0" }}>
              Brands you want a heads-up on
            </p>
          </div>
        </header>

        <PushOptInRow
          status={pushStatus}
          busy={pushBusy}
          onToggle={handlePushToggle}
          onDemo={handleDemoPing}
        />

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
      </main>
    </div>
  );
}

function PushOptInRow({
  status, busy, onToggle, onDemo,
}: {
  status: PushStatus;
  busy: boolean;
  onToggle: () => void;
  onDemo: () => void;
}) {
  if (status === "unsupported") return null;

  const subscribed = status === "subscribed";
  const denied = status === "denied";

  return (
    <div style={{
      background: subscribed ? DS.goodBg : DS.card,
      borderRadius: 14, padding: "12px 14px", marginBottom: 14,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: subscribed ? "none" : "0 2px 6px rgba(0,0,0,0.05)",
      border: subscribed ? `1px solid ${DS.good}33` : `1px solid ${DS.hair}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: subscribed ? DS.good : DS.bg,
        color: subscribed ? DS.card : DS.muted,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {subscribed ? <Bell style={{ width: 18, height: 18 }} /> : <BellOff style={{ width: 18, height: 18 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: DS.ink, lineHeight: 1.25 }}>
          {subscribed ? "Watchlist alerts on" : "Get a heads-up"}
        </div>
        <div style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.35, marginTop: 2 }}>
          {denied
            ? "Notifications blocked in your browser. Enable them in site settings."
            : subscribed
            ? "We'll push you when one of your watched brands has a new verified flag."
            : "Push notifications when a watched brand gets a new verified flag."}
        </div>
      </div>
      {!denied && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {subscribed && (
            <button
              onClick={onDemo}
              style={{
                height: 34, padding: "0 12px", borderRadius: 10, border: `1px solid ${DS.hair}`,
                background: DS.card, color: DS.ink, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: DS.font,
              }}
            >
              Test
            </button>
          )}
          <button
            onClick={onToggle}
            disabled={busy}
            style={{
              height: 34, padding: "0 14px", borderRadius: 10,
              background: subscribed ? DS.card : DS.ink,
              color: subscribed ? DS.ink : DS.card,
              fontSize: 12, fontWeight: 800, cursor: busy ? "wait" : "pointer",
              fontFamily: DS.font,
              border: subscribed ? `1px solid ${DS.hair}` : "none",
            }}
          >
            {subscribed ? "Off" : "Enable"}
          </button>
        </div>
      )}
    </div>
  );
}
