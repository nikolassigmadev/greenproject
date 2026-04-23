import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  loadScanHistory,
  clearScanHistory,
  getHistoryStats,
  getImpactStats,
  getCarbonStats,
  type ScanHistoryEntry,
} from "@/utils/userPreferences";
import {
  Trash2,
  TrendingUp,
  Clock,
  ShoppingBag,
  ExternalLink,
  BarChart3,
  AlertTriangle,
  Leaf,
  Users,
  Zap,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatDate = (ts: number) => {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

const ecoBadge: Record<string, { color: string; label: string }> = {
  a: { color: "#00c853", label: "A" },
  b: { color: "#00c853", label: "B" },
  c: { color: "#ffc700", label: "C" },
  d: { color: "#ffc700", label: "D" },
  e: { color: "#ff4136", label: "E" },
};

// SVG sparkline of eco scores over time (last N scans)
function EcoSparkline({ history }: { history: ScanHistoryEntry[] }) {
  const points = history
    .filter((h) => h.scores.ecoScore != null)
    .slice(0, 20)
    .reverse();

  if (points.length < 2) return null;

  const W = 180;
  const H = 40;
  const scores = points.map((p) => p.scores.ecoScore as number);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const toX = (i: number) => (i / (points.length - 1)) * W;
  const toY = (v: number) => H - ((v - min) / range) * (H - 6) - 3;

  const pathD = scores
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(" ");

  // Filled area under curve
  const areaD =
    pathD +
    ` L ${toX(scores.length - 1).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c853" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00c853" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke="#00c853"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest dot */}
      <circle
        cx={toX(scores.length - 1)}
        cy={toY(scores[scores.length - 1])}
        r="3"
        fill="#00c853"
      />
    </svg>
  );
}

export default function Dashboard() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setHistory(loadScanHistory());
    const handler = () => setHistory(loadScanHistory());
    window.addEventListener("scanHistoryUpdated", handler);
    return () => window.removeEventListener("scanHistoryUpdated", handler);
  }, []);

  const stats = getHistoryStats(history);
  const impact = getImpactStats(history);
  const carbon = getCarbonStats(history);

  const handleClear = () => {
    clearScanHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const statCards = [
    { label: "Total Scans", value: stats.total, color: "#00c853", bg: "hsl(152 42% 96%)" },
    { label: "Good Choices", value: stats.good, color: "hsl(142 55% 38%)", bg: "hsl(142 45% 96%)" },
    { label: "Moderate", value: stats.moderate, color: "hsl(38 88% 44%)", bg: "hsl(38 70% 96%)" },
    { label: "Avoid", value: stats.avoid, color: "hsl(0 68% 48%)", bg: "hsl(0 50% 97%)" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Clean header */}
      <div className="px-5 pb-4" style={{ paddingTop: "max(3.5rem, calc(env(safe-area-inset-top) + 3rem))" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">Overview</p>
            <h1 className="text-[1.75rem] font-display font-extrabold text-foreground leading-tight">My History</h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground bg-card border border-border/60 active:scale-[0.97] transition-transform"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      <main className="pb-nav">
        <div className="px-5">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Clear confirmation */}
            {showClearConfirm && (
              <div className="bg-destructive/8 border border-destructive/25 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Delete all scan history? This can't be undone.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold active:scale-[0.97] transition-transform"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium active:scale-[0.97] transition-transform"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {history.length === 0 ? (
              /* Empty state */
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-display font-bold text-foreground mb-2">No Scans Yet</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Start scanning products to build your history and track ethical trends.
                </p>
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: "hsl(220 14% 12%)", color: "white" }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Start Scanning
                </Link>
              </div>
            ) : (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {statCards.map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-card rounded-2xl border border-border/60 shadow-soft p-4 text-center"
                    >
                      <div
                        className="text-2xl font-display font-extrabold mb-0.5 tabular-nums"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Personal Impact Stats */}
                {impact.totalThisMonth > 0 && (
                  <div style={{ background: "#000", border: "1px solid rgba(0,200,83,0.25)", borderLeft: "3px solid #00c853", padding: "16px" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ width: 28, height: 28, background: "rgba(0,200,83,0.12)", border: "1px solid rgba(0,200,83,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Zap style={{ width: 14, height: 14, color: "#00c853" }} />
                      </div>
                      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", fontWeight: 700, color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                        Your Impact This Month
                      </h2>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", color: "#84898E", letterSpacing: "0.1em", marginLeft: "auto" }}>
                        {impact.totalThisMonth} scan{impact.totalThisMonth !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* CO2 avoided */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "12px 8px", textAlign: "center" }}>
                        <div className="text-2xl mb-0.5">🌿</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 900, color: "#00c853", lineHeight: 1 }}>
                          {impact.co2AvoidedKg > 0 ? `${impact.co2AvoidedKg}` : "—"}
                          {impact.co2AvoidedKg > 0 && (
                            <span style={{ fontSize: "0.45rem", fontWeight: 400, marginLeft: 2 }}>kg</span>
                          )}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", marginTop: 4, letterSpacing: "0.06em" }}>
                          CO₂ avoided
                        </div>
                      </div>

                      {/* Fair Trade */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "12px 8px", textAlign: "center" }}>
                        <div className="text-2xl mb-0.5">🤝</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 900, color: "#00c853", lineHeight: 1 }}>
                          {impact.fairTradeCount}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", marginTop: 4, letterSpacing: "0.06em" }}>
                          Fair Trade scanned
                        </div>
                      </div>

                      {/* Labor violations */}
                      <div style={{ background: "rgba(255,65,54,0.05)", border: "1px solid rgba(255,65,54,0.2)", padding: "12px 8px", textAlign: "center" }}>
                        <div className="text-2xl mb-0.5">🚩</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 900, color: "#ff4136", lineHeight: 1 }}>
                          {impact.laborFlaggedCount}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#ff4136", marginTop: 4, letterSpacing: "0.06em", opacity: 0.7 }}>
                          Labor violations
                        </div>
                      </div>
                    </div>

                    {/* Motivational message */}
                    {impact.co2AvoidedKg > 0 && (
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", color: "#84898E", marginTop: 12, textAlign: "center", lineHeight: 1.7, letterSpacing: "0.04em" }}>
                        {impact.co2AvoidedKg >= 5
                          ? `Impressive! You've avoided ${impact.co2AvoidedKg} kg CO₂ — that's like skipping a 30 km car trip.`
                          : impact.co2AvoidedKg >= 1
                          ? `You've avoided ${impact.co2AvoidedKg} kg CO₂ this month — keep it up!`
                          : `Every scan helps. You're making greener choices!`}
                      </p>
                    )}
                  </div>
                )}

                {/* Carbon Impact Calculator */}
                {carbon.scoredCount > 0 && (
                  <div style={{ background: "#000", border: "1px solid rgba(0,200,83,0.25)", borderLeft: "3px solid #40aaff", padding: "16px" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div style={{ width: 28, height: 28, background: "rgba(64,170,255,0.1)", border: "1px solid rgba(64,170,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Leaf style={{ width: 14, height: 14, color: "#40aaff" }} />
                      </div>
                      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", fontWeight: 700, color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase" }}>Carbon Impact</h2>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", color: "#84898E", letterSpacing: "0.1em", marginLeft: "auto" }}>{carbon.scoredCount} scored scans</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", color: "#84898E", letterSpacing: "0.08em" }}>Your CO₂</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.44rem", fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>
                          {carbon.pctReduced > 0
                            ? `${carbon.pctReduced}% below average`
                            : `${Math.abs(carbon.pctReduced)}% above average`}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="transition-all duration-700"
                          style={{
                            height: "100%",
                            width: `${Math.min(100, Math.max(4, 100 - carbon.pctReduced))}%`,
                            background: carbon.pctReduced >= 20 ? "#00c853" : carbon.pctReduced >= 0 ? "#ffc700" : "#ff4136",
                            boxShadow: carbon.pctReduced >= 20 ? "0 0 8px rgba(0,200,83,0.5)" : carbon.pctReduced >= 0 ? "0 0 8px rgba(255,199,0,0.5)" : "0 0 8px rgba(255,65,54,0.5)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.38rem", color: "rgba(132,137,142,0.5)", letterSpacing: "0.08em" }}>0 kg</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.38rem", color: "rgba(132,137,142,0.5)", letterSpacing: "0.08em" }}>Avg consumer</span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div style={{ background: "rgba(0,200,83,0.05)", border: "1px solid rgba(0,200,83,0.15)", padding: "12px 8px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 900, color: "#00c853", lineHeight: 1 }}>
                          {carbon.co2SavedKg}<span style={{ fontSize: "0.45rem", fontWeight: 400, marginLeft: 2 }}>kg</span>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", marginTop: 4, letterSpacing: "0.06em" }}>CO₂ saved</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "12px 8px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                          {carbon.totalUserCO2}<span style={{ fontSize: "0.45rem", fontWeight: 400, marginLeft: 2 }}>kg</span>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", marginTop: 4, letterSpacing: "0.06em" }}>your total</div>
                      </div>
                      <div style={{ background: "rgba(64,170,255,0.05)", border: "1px solid rgba(64,170,255,0.15)", padding: "12px 8px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 900, color: "#40aaff", lineHeight: 1 }}>
                          {carbon.projectedSavedKgPerYear}<span style={{ fontSize: "0.45rem", fontWeight: 400, marginLeft: 2 }}>kg/yr</span>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", marginTop: 4, letterSpacing: "0.06em" }}>projected saving</div>
                      </div>
                    </div>

                    {/* Badges */}
                    {carbon.co2SavedKg > 0 && (
                      <div>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                          Badges earned
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {carbon.co2SavedKg >= 0.1 && (
                            <div className="inline-flex items-center gap-1.5" style={{ padding: "3px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", fontWeight: 700, background: "rgba(0,200,83,0.1)", color: "#00c853", border: "1px solid rgba(0,200,83,0.3)", letterSpacing: "0.08em" }}>
                              <Award style={{ width: 10, height: 10 }} />
                              CO₂ SAVER
                            </div>
                          )}
                          {carbon.co2SavedKg >= 5 && (
                            <div className="inline-flex items-center gap-1.5" style={{ padding: "3px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", fontWeight: 700, background: "rgba(64,170,255,0.1)", color: "#40aaff", border: "1px solid rgba(64,170,255,0.3)", letterSpacing: "0.08em" }}>
                              <Award style={{ width: 10, height: 10 }} />
                              CARBON REDUCER
                            </div>
                          )}
                          {carbon.co2SavedKg >= 20 && (
                            <div className="inline-flex items-center gap-1.5" style={{ padding: "3px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", fontWeight: 700, background: "rgba(204,136,255,0.1)", color: "#cc88ff", border: "1px solid rgba(204,136,255,0.3)", letterSpacing: "0.08em" }}>
                              <Award style={{ width: 10, height: 10 }} />
                              GREEN CHAMPION
                            </div>
                          )}
                          {carbon.co2SavedKg < 0.1 && (
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.4rem", color: "#84898E", letterSpacing: "0.06em" }}>
                              Scan more eco-friendly products to unlock badges
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Average Eco Score + sparkline */}
                {stats.avgEcoScore > 0 && (
                  <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-extrabold text-white flex-shrink-0"
                        style={{
                          backgroundColor:
                            stats.avgEcoScore >= 50
                              ? "#00c853"
                              : stats.avgEcoScore >= 30
                              ? "hsl(38 88% 44%)"
                              : "hsl(0 68% 50%)",
                        }}
                      >
                        {Math.round(stats.avgEcoScore)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground mb-0.5">Average Eco-Score</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {stats.avgEcoScore >= 60
                            ? "Great job! Your choices are environmentally conscious."
                            : stats.avgEcoScore >= 40
                            ? "Decent choices overall, room for improvement."
                            : "Consider looking for more eco-friendly alternatives."}
                        </p>
                        {/* Sparkline */}
                        <EcoSparkline history={history} />
                        <p className="text-[9px] text-muted-foreground/50 mt-1">
                          Eco-score trend · last {Math.min(history.filter(h => h.scores.ecoScore != null).length, 20)} scans
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weekly trend */}
                <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" style={{ color: "#00c853" }} />
                    <h2 className="text-sm font-bold text-foreground">Weekly Trend</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {stats.weeks.map((week) => (
                      <div key={week.week} className="text-center">
                        <div className="h-16 flex flex-col justify-end items-center mb-1.5">
                          {week.total > 0 ? (
                            <div
                              className="w-full max-w-[44px] rounded-t-md flex items-center justify-center text-white font-bold text-[10px] min-h-[18px]"
                              style={{
                                height: `${Math.max(22, week.percentage)}%`,
                                backgroundColor:
                                  week.percentage >= 60
                                    ? "#00c853"
                                    : week.percentage >= 30
                                    ? "#ffc700"
                                    : "#ff4136",
                              }}
                            >
                              {week.percentage}%
                            </div>
                          ) : (
                            <div className="w-full max-w-[44px] h-[18px] rounded-t-md bg-muted flex items-center justify-center">
                              <span className="text-[9px] text-muted-foreground">—</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground">{week.week}</div>
                        <div className="text-[9px] text-muted-foreground/60">{week.total} scans</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
                    % of scans rated Good or Moderate
                  </p>
                </div>

                {/* Recent scans */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" style={{ color: "#00c853" }} />
                    <h2 className="text-sm font-bold text-foreground">Recent Scans</h2>
                  </div>
                  <div className="space-y-2">
                    {history.slice(0, 20).map((entry) => {
                      const ecoG = entry.scores.ecoGrade?.toLowerCase();
                      const badge = ecoG ? ecoBadge[ecoG] : null;

                      return (
                        <Link
                          key={entry.id}
                          to={`/product-off/${entry.barcode}`}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card",
                            "hover:shadow-soft hover:border-border transition-all duration-200"
                          )}
                        >
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xl">
                              📦
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base leading-none">{entry.verdict.emoji}</span>
                              <span className="text-sm font-semibold text-foreground truncate">
                                {entry.productName || "Unknown Product"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {entry.brand && (
                                <span className="text-xs text-muted-foreground truncate">{entry.brand}</span>
                              )}
                              {/* Eco grade badge */}
                              {badge && (
                                <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "2px 5px", background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}55` }}>
                                  Eco {badge.label}
                                </span>
                              )}
                              {/* Nutri score badge */}
                              {entry.scores.nutriScore && (
                                <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "2px 5px", background: "rgba(64,170,255,0.15)", color: "#40aaff", border: "1px solid rgba(64,170,255,0.35)" }}>
                                  Nutri {entry.scores.nutriScore.toUpperCase()}
                                </span>
                              )}
                              {/* Labor flag */}
                              {entry.scores.laborAllegations > 0 && (
                                <span className="inline-flex items-center gap-0.5" style={{ fontSize: "0.5rem", fontWeight: 700, padding: "2px 5px", background: "rgba(255,65,54,0.12)", color: "#ff4136", border: "1px solid rgba(255,65,54,0.35)" }}>
                                  <Users className="w-2.5 h-2.5" />
                                  Labor
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground/60 flex-shrink-0 ml-auto">
                                {formatDate(entry.timestamp)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <div
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                              style={{
                                backgroundColor: `${entry.verdict.color}14`,
                                color: entry.verdict.color,
                              }}
                            >
                              {entry.verdict.label.split(" - ")[0]}
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  {history.length > 20 && (
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      Showing 20 of {history.length} scans
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
