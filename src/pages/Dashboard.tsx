import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  loadScanHistory,
  clearScanHistory,
  getHistoryStats,
  getImpactStats,
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

const ecoBadge: Record<string, { bg: string; text: string; label: string }> = {
  a: { bg: "bg-emerald-500", text: "text-white", label: "A" },
  b: { bg: "bg-lime-500", text: "text-white", label: "B" },
  c: { bg: "bg-amber-500", text: "text-white", label: "C" },
  d: { bg: "bg-orange-500", text: "text-white", label: "D" },
  e: { bg: "bg-red-500", text: "text-white", label: "E" },
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
          <stop offset="0%" stopColor="hsl(152 48% 30%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(152 48% 30%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke="hsl(152 48% 30%)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest dot */}
      <circle
        cx={toX(scores.length - 1)}
        cy={toY(scores[scores.length - 1])}
        r="3"
        fill="hsl(152 48% 30%)"
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

  const handleClear = () => {
    clearScanHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const statCards = [
    { label: "Total Scans", value: stats.total, color: "hsl(152 48% 30%)", bg: "hsl(152 42% 96%)" },
    { label: "Good Choices", value: stats.good, color: "hsl(142 55% 38%)", bg: "hsl(142 45% 96%)" },
    { label: "Moderate", value: stats.moderate, color: "hsl(38 88% 44%)", bg: "hsl(38 70% 96%)" },
    { label: "Avoid", value: stats.avoid, color: "hsl(0 68% 48%)", bg: "hsl(0 50% 97%)" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">
        {/* Hero header */}
        <div
          className="px-5 pt-10 pb-12 text-center relative"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-display font-extrabold tracking-tight mb-1.5" style={{ color: "#ffffff" }}>
              My Dashboard
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
              Track your scans and see how your choices evolve
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-aurora absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="px-5 -mt-5 relative z-10">
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
                    className="btn-aurora px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="btn-aurora px-4 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-soft hover:shadow-card hover:bg-primary/90 transition-all"
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

                {/* ── Personal Impact Stats ── */}
                {impact.totalThisMonth > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        Your Impact This Month
                      </h2>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">
                        {impact.totalThisMonth} scan{impact.totalThisMonth !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* CO2 avoided */}
                      <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-0.5">🌿</div>
                        <div className="text-lg font-display font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums leading-none">
                          {impact.co2AvoidedKg > 0 ? `${impact.co2AvoidedKg}` : "—"}
                          {impact.co2AvoidedKg > 0 && (
                            <span className="text-[10px] font-normal ml-0.5">kg</span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 leading-tight">
                          CO₂ avoided
                        </div>
                      </div>

                      {/* Fair Trade */}
                      <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-0.5">🤝</div>
                        <div className="text-lg font-display font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums leading-none">
                          {impact.fairTradeCount}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 leading-tight">
                          Fair Trade scanned
                        </div>
                      </div>

                      {/* Labor violations */}
                      <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3 text-center">
                        <div className="text-2xl mb-0.5">🚩</div>
                        <div className="text-lg font-display font-extrabold text-orange-600 dark:text-orange-400 tabular-nums leading-none">
                          {impact.laborFlaggedCount}
                        </div>
                        <div className="text-[10px] text-orange-600 dark:text-orange-400 font-medium mt-0.5 leading-tight">
                          Labor violations
                        </div>
                      </div>
                    </div>

                    {/* Motivational message */}
                    {impact.co2AvoidedKg > 0 && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-3 text-center leading-relaxed">
                        {impact.co2AvoidedKg >= 5
                          ? `Impressive! You've avoided ${impact.co2AvoidedKg} kg CO₂ — that's like skipping a 30 km car trip. 🚗`
                          : impact.co2AvoidedKg >= 1
                          ? `You've avoided ${impact.co2AvoidedKg} kg CO₂ this month — keep it up!`
                          : `Every scan helps. You're making greener choices!`}
                      </p>
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
                              ? "hsl(152 48% 30%)"
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
                    <TrendingUp className="w-4 h-4 text-primary" />
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
                                    ? "hsl(152 48% 32%)"
                                    : week.percentage >= 30
                                    ? "hsl(38 88% 44%)"
                                    : "hsl(0 68% 52%)",
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

                {/* Recent scans — richer list */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
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
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", badge.bg, badge.text)}>
                                  Eco {badge.label}
                                </span>
                              )}
                              {/* Nutri score badge */}
                              {entry.scores.nutriScore && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500 text-white">
                                  Nutri {entry.scores.nutriScore.toUpperCase()}
                                </span>
                              )}
                              {/* Labor flag */}
                              {entry.scores.laborAllegations > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
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

      <Footer />
      <BottomNav />
    </div>
  );
}
