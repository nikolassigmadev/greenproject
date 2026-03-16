import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { loadScanHistory, clearScanHistory, getHistoryStats, type ScanHistoryEntry } from "@/utils/userPreferences";
import { Trash2, BarChart3, TrendingUp, Clock, ShoppingBag, ExternalLink } from "lucide-react";

export default function Dashboard() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setHistory(loadScanHistory());
    const handler = () => setHistory(loadScanHistory());
    window.addEventListener('scanHistoryUpdated', handler);
    return () => window.removeEventListener('scanHistoryUpdated', handler);
  }, []);

  const stats = getHistoryStats(history);

  const handleClear = () => {
    clearScanHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ backgroundColor: "hsl(40 33% 95%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1rem" }}>
          {/* Page Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "0.5rem" }}>
                📊 My Dashboard
              </h1>
              <p style={{ color: "hsl(150 10% 45%)" }}>
                Track your scanning history and see how your choices trend over time.
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 1rem", borderRadius: "0.5rem",
                  border: "1px solid hsl(0 60% 80%)", backgroundColor: "hsl(0 50% 97%)",
                  color: "hsl(0 70% 50%)", cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>

          {/* Clear confirmation */}
          {showClearConfirm && (
            <div style={{
              backgroundColor: "hsl(0 50% 97%)", border: "1px solid hsl(0 60% 80%)",
              borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem",
            }}>
              <p style={{ color: "hsl(0 70% 40%)", fontWeight: "500" }}>Delete all scan history? This can't be undone.</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={handleClear} style={{
                  padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none",
                  backgroundColor: "hsl(0 70% 50%)", color: "white", cursor: "pointer", fontWeight: "600",
                }}>Yes, Clear</button>
                <button onClick={() => setShowClearConfirm(false)} style={{
                  padding: "0.5rem 1rem", borderRadius: "0.5rem",
                  border: "1px solid hsl(40 20% 85%)", backgroundColor: "hsl(40 30% 98%)",
                  color: "hsl(150 10% 45%)", cursor: "pointer",
                }}>Cancel</button>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            /* Empty State */
            <div style={{
              backgroundColor: "hsl(40 30% 98%)", borderRadius: "0.75rem", padding: "3rem",
              textAlign: "center", border: "1px solid hsl(40 20% 85%)",
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "0.5rem" }}>
                No Scans Yet
              </h2>
              <p style={{ color: "hsl(150 10% 45%)", marginBottom: "1.5rem" }}>
                Start scanning products to build your history and track trends.
              </p>
              <Link to="/scan" style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.5rem", borderRadius: "0.5rem",
                backgroundColor: "hsl(152 45% 30%)", color: "white",
                textDecoration: "none", fontWeight: "600",
              }}>
                <ShoppingBag size={18} /> Start Scanning
              </Link>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {[
                  { label: "Total Scans", value: stats.total, emoji: "📦", color: "hsl(152 45% 30%)" },
                  { label: "Good Choices", value: stats.good, emoji: "✅", color: "hsl(142 71% 45%)" },
                  { label: "Moderate", value: stats.moderate, emoji: "🤔", color: "hsl(45 93% 47%)" },
                  { label: "Caution", value: stats.caution, emoji: "⚠️", color: "hsl(25 80% 50%)" },
                  { label: "Avoid", value: stats.avoid, emoji: "🚫", color: "hsl(0 70% 50%)" },
                  { label: "Labor Concerns", value: stats.withLaborConcerns, emoji: "👷", color: "hsl(0 60% 45%)" },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    backgroundColor: "hsl(40 30% 98%)", borderRadius: "0.75rem",
                    padding: "1.25rem", textAlign: "center",
                    border: "1px solid hsl(40 20% 85%)",
                  }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{stat.emoji}</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(150 10% 45%)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Weekly Trend */}
              <div style={{
                backgroundColor: "hsl(40 30% 98%)", borderRadius: "0.75rem",
                padding: "1.5rem", marginBottom: "2rem", border: "1px solid hsl(40 20% 85%)",
              }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp size={20} style={{ color: "hsl(152 45% 30%)" }} />
                  Weekly Trend
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                  {stats.weeks.map((week) => (
                    <div key={week.week} style={{ textAlign: "center" }}>
                      <div style={{
                        height: "80px", display: "flex", flexDirection: "column",
                        justifyContent: "flex-end", alignItems: "center", marginBottom: "0.5rem",
                      }}>
                        {week.total > 0 ? (
                          <div style={{
                            width: "100%", maxWidth: "60px",
                            height: `${Math.max(20, week.percentage)}%`,
                            backgroundColor: week.percentage >= 60 ? "hsl(152 45% 30%)" : week.percentage >= 30 ? "hsl(45 93% 47%)" : "hsl(0 70% 55%)",
                            borderRadius: "0.375rem 0.375rem 0 0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: "bold", fontSize: "0.75rem",
                            minHeight: "20px",
                            transition: "height 0.3s ease",
                          }}>
                            {week.percentage}%
                          </div>
                        ) : (
                          <div style={{
                            width: "100%", maxWidth: "60px", height: "20px",
                            backgroundColor: "hsl(40 20% 90%)", borderRadius: "0.375rem 0.375rem 0 0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "hsl(150 10% 55%)", fontSize: "0.7rem",
                          }}>—</div>
                        )}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "hsl(150 10% 45%)", fontWeight: "500" }}>{week.week}</div>
                      <div style={{ fontSize: "0.65rem", color: "hsl(150 10% 55%)" }}>{week.total} scans</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.75rem", color: "hsl(150 10% 55%)", marginTop: "0.75rem", textAlign: "center", fontStyle: "italic" }}>
                  % of scans rated Good or Moderate
                </p>
              </div>

              {/* Average Eco Score */}
              {stats.avgEcoScore > 0 && (
                <div style={{
                  backgroundColor: "hsl(40 30% 98%)", borderRadius: "0.75rem",
                  padding: "1.5rem", marginBottom: "2rem", border: "1px solid hsl(40 20% 85%)",
                  display: "flex", alignItems: "center", gap: "1.5rem",
                }}>
                  <div style={{
                    width: "4.5rem", height: "4.5rem", borderRadius: "50%",
                    backgroundColor: stats.avgEcoScore >= 50 ? "hsl(152 45% 30%)" : stats.avgEcoScore >= 30 ? "hsl(45 93% 47%)" : "hsl(0 70% 55%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "bold", fontSize: "1.5rem", flexShrink: 0,
                  }}>
                    {Math.round(stats.avgEcoScore)}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "0.25rem" }}>
                      Average Eco-Score
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "hsl(150 10% 45%)" }}>
                      {stats.avgEcoScore >= 60 ? "Great job! Your choices are environmentally conscious." :
                       stats.avgEcoScore >= 40 ? "Decent choices overall, room for improvement." :
                       "Consider looking for more eco-friendly alternatives."}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Scans */}
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={20} style={{ color: "hsl(152 45% 30%)" }} />
                  Recent Scans
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {history.slice(0, 20).map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/product-off/${entry.barcode}`}
                      style={{
                        backgroundColor: "hsl(40 30% 98%)", borderRadius: "0.75rem",
                        padding: "1rem", border: "1px solid hsl(40 20% 85%)",
                        display: "flex", alignItems: "center", gap: "1rem",
                        textDecoration: "none", transition: "box-shadow 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt="" style={{
                          width: "50px", height: "50px", borderRadius: "0.5rem",
                          objectFit: "cover", flexShrink: 0,
                        }} />
                      ) : (
                        <div style={{
                          width: "50px", height: "50px", borderRadius: "0.5rem",
                          backgroundColor: "hsl(40 25% 93%)", display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
                          flexShrink: 0,
                        }}>📦</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.25rem" }}>{entry.verdict.emoji}</span>
                          <span style={{
                            fontWeight: "600", color: "hsl(150 20% 15%)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {entry.productName || "Unknown Product"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                          {entry.brand && (
                            <span style={{ fontSize: "0.8rem", color: "hsl(150 10% 45%)" }}>{entry.brand}</span>
                          )}
                          <span style={{ fontSize: "0.75rem", color: "hsl(150 10% 55%)" }}>
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        padding: "0.3rem 0.6rem", borderRadius: "0.375rem",
                        fontSize: "0.7rem", fontWeight: "600",
                        backgroundColor: `${entry.verdict.color}15`,
                        color: entry.verdict.color, whiteSpace: "nowrap",
                      }}>
                        {entry.verdict.label.split(" - ")[0]}
                      </div>
                      <ExternalLink size={14} style={{ color: "hsl(150 10% 55%)", flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
                {history.length > 20 && (
                  <p style={{ textAlign: "center", color: "hsl(150 10% 55%)", fontSize: "0.85rem", marginTop: "1rem" }}>
                    Showing 20 of {history.length} scans
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
