import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Camera, ArrowRight, Leaf, Users, Heart, Apple,
  Settings, BarChart3, Search, Sparkles, Shield, Globe,
  ChevronRight, ScanLine, TrendingUp, Eye,
} from "lucide-react";

const Index = () => {
  return (
    <div style={{ backgroundColor: "#f4f6f3", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1 }}>

        {/* Hero — green gradient top like the banking app */}
        <section style={{
          background: "linear-gradient(165deg, hsl(152 45% 28%) 0%, hsl(152 50% 38%) 60%, hsl(160 45% 45%) 100%)",
          padding: "2.5rem 1.25rem 4rem",
          borderRadius: "0 0 2rem 2rem",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{
            position: "absolute", top: "-40px", right: "-30px",
            width: "160px", height: "160px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.06)",
          }} />
          <div style={{
            position: "absolute", bottom: "20px", left: "-20px",
            width: "100px", height: "100px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.04)",
          }} />

          <div style={{ maxWidth: "26rem", margin: "0 auto", position: "relative", zIndex: 1 }}>
            {/* App icon */}
            <div style={{
              width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
              backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <Leaf size={24} color="white" />
            </div>

            <h1 style={{
              fontSize: "1.75rem", fontWeight: "800", color: "white",
              lineHeight: 1.2, marginBottom: "0.6rem", textAlign: "center",
              letterSpacing: "-0.02em",
            }}>
              Know the True Cost
            </h1>
            <p style={{
              fontSize: "0.85rem", color: "rgba(255,255,255,0.75)",
              lineHeight: 1.5, textAlign: "center", marginBottom: "1.5rem",
              maxWidth: "20rem", margin: "0 auto 1.5rem",
            }}>
              Scan products to reveal environmental impact, labor practices & ethical alternatives
            </p>

            {/* Two action buttons side by side */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Link to="/scan" style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.75rem 1.5rem", borderRadius: "0.875rem",
                backgroundColor: "white", color: "hsl(152 45% 28%)",
                textDecoration: "none", fontWeight: "700", fontSize: "0.85rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}>
                <Camera size={16} /> Scan Now
              </Link>
              <Link to="/preferences" style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.75rem 1.5rem", borderRadius: "0.875rem",
                backgroundColor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem",
                backdropFilter: "blur(10px)",
              }}>
                <Settings size={16} /> Priorities
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Stats Row — overlapping cards */}
        <section style={{ padding: "0 1.25rem", marginTop: "-1.5rem", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "26rem", margin: "0 auto" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem",
            }}>
              {[
                { label: "Scan", value: "🔍", sub: "Products", to: "/scan" },
                { label: "Get Insights", value: "💡", sub: "Verdicts", to: "/scan" },
                { label: "Choose Better", value: "🌱", sub: "Alternatives", to: "/products" },
              ].map((item) => (
                <Link key={item.label} to={item.to} style={{
                  backgroundColor: "white", borderRadius: "1rem",
                  padding: "1rem 0.5rem", textAlign: "center",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  textDecoration: "none",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{item.value}</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "hsl(150 20% 15%)" }}>{item.label}</div>
                  <div style={{ fontSize: "0.6rem", color: "hsl(150 10% 50%)", marginTop: "0.1rem" }}>{item.sub}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works — white card sections */}
        <section style={{ padding: "1.75rem 1.25rem 0" }}>
          <div style={{ maxWidth: "26rem", margin: "0 auto" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "1rem",
            }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "hsl(150 20% 15%)" }}>
                How It Works
              </h2>
              <Link to="/scan" style={{
                fontSize: "0.75rem", fontWeight: "600", color: "hsl(152 45% 35%)",
                textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem",
              }}>
                Try it <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* Step 1 */}
              <div style={{
                backgroundColor: "white", borderRadius: "1.125rem",
                padding: "1.1rem 1.25rem",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
                display: "flex", gap: "1rem", alignItems: "flex-start",
              }}>
                <div style={{
                  width: "2.75rem", height: "2.75rem", borderRadius: "0.875rem",
                  background: "linear-gradient(135deg, hsl(152 45% 30%), hsl(152 50% 40%))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Camera size={18} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span style={{
                      fontSize: "0.55rem", fontWeight: "700", color: "hsl(152 45% 35%)",
                      backgroundColor: "hsl(152 40% 95%)", padding: "0.1rem 0.4rem",
                      borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>Step 1</span>
                  </div>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: "700", color: "hsl(150 20% 15%)", marginBottom: "0.2rem" }}>
                    Scan a Product
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "hsl(150 10% 45%)", lineHeight: 1.5 }}>
                    Photo, barcode, or search by name — AI reads labels instantly
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                backgroundColor: "white", borderRadius: "1.125rem",
                padding: "1.1rem 1.25rem",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "2.75rem", height: "2.75rem", borderRadius: "0.875rem",
                    background: "linear-gradient(135deg, hsl(45 93% 40%), hsl(40 90% 50%))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Settings size={18} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                      <span style={{
                        fontSize: "0.55rem", fontWeight: "700", color: "hsl(45 80% 35%)",
                        backgroundColor: "hsl(45 60% 94%)", padding: "0.1rem 0.4rem",
                        borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>Step 2</span>
                    </div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "700", color: "hsl(150 20% 15%)", marginBottom: "0.2rem" }}>
                      Set Your Priorities
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(150 10% 45%)", lineHeight: 1.5 }}>
                      Tell us what matters most and we personalize every result
                    </p>
                  </div>
                </div>
                {/* Priority pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.75rem", paddingLeft: "3.75rem" }}>
                  {[
                    { label: "Labor Rights", icon: <Users size={10} />, color: "hsl(0 70% 50%)" },
                    { label: "Environment", icon: <Leaf size={10} />, color: "hsl(152 45% 35%)" },
                    { label: "Animal", icon: <Heart size={10} />, color: "hsl(280 60% 50%)" },
                    { label: "Nutrition", icon: <Apple size={10} />, color: "hsl(45 93% 40%)" },
                  ].map((t) => (
                    <span key={t.label} style={{
                      display: "inline-flex", alignItems: "center", gap: "0.2rem",
                      padding: "0.2rem 0.5rem", borderRadius: "999px",
                      fontSize: "0.6rem", fontWeight: "600",
                      backgroundColor: `${t.color}10`, color: t.color,
                    }}>
                      {t.icon} {t.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 3 */}
              <div style={{
                backgroundColor: "white", borderRadius: "1.125rem",
                padding: "1.1rem 1.25rem",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
                display: "flex", gap: "1rem", alignItems: "flex-start",
              }}>
                <div style={{
                  width: "2.75rem", height: "2.75rem", borderRadius: "0.875rem",
                  background: "linear-gradient(135deg, hsl(280 60% 50%), hsl(280 55% 60%))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Eye size={18} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span style={{
                      fontSize: "0.55rem", fontWeight: "700", color: "hsl(280 50% 45%)",
                      backgroundColor: "hsl(280 40% 95%)", padding: "0.1rem 0.4rem",
                      borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>Step 3</span>
                  </div>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: "700", color: "hsl(150 20% 15%)", marginBottom: "0.2rem" }}>
                    Get Verdicts & Alternatives
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "hsl(150 10% 45%)", lineHeight: 1.5 }}>
                    Eco-scores, labor flags, carbon data, and greener swaps — weighted to your values
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{
                backgroundColor: "white", borderRadius: "1.125rem",
                padding: "1.1rem 1.25rem",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "2.75rem", height: "2.75rem", borderRadius: "0.875rem",
                    background: "linear-gradient(135deg, hsl(220 70% 50%), hsl(220 65% 60%))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <BarChart3 size={18} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                      <span style={{
                        fontSize: "0.55rem", fontWeight: "700", color: "hsl(220 60% 45%)",
                        backgroundColor: "hsl(220 50% 95%)", padding: "0.1rem 0.4rem",
                        borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>Step 4</span>
                    </div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: "700", color: "hsl(150 20% 15%)", marginBottom: "0.2rem" }}>
                      Track Your Impact
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(150 10% 45%)", lineHeight: 1.5 }}>
                      Scanning history, weekly trends & how your habits improve
                    </p>
                  </div>
                </div>
                {/* Mini chart */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", paddingLeft: "3.75rem", alignItems: "flex-end" }}>
                  {[
                    { h: "1.6rem", color: "hsl(152 45% 35%)" },
                    { h: "1.1rem", color: "hsl(152 45% 45%)" },
                    { h: "2rem", color: "hsl(152 45% 30%)" },
                    { h: "0.8rem", color: "hsl(45 90% 50%)" },
                    { h: "1.4rem", color: "hsl(152 45% 40%)" },
                    { h: "1.8rem", color: "hsl(152 45% 32%)" },
                    { h: "0.6rem", color: "hsl(0 65% 55%)" },
                  ].map((bar, i) => (
                    <div key={i} style={{
                      flex: 1, height: bar.h, backgroundColor: bar.color,
                      borderRadius: "0.25rem 0.25rem 0 0",
                      opacity: 0.85,
                    }} />
                  ))}
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  paddingLeft: "3.75rem", marginTop: "0.3rem",
                }}>
                  <span style={{ fontSize: "0.55rem", color: "hsl(150 10% 60%)" }}>Mon</span>
                  <span style={{ fontSize: "0.55rem", color: "hsl(150 10% 60%)" }}>Sun</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Analyze — horizontal scroll cards */}
        <section style={{ padding: "1.75rem 0 1.75rem 1.25rem" }}>
          <div style={{ maxWidth: "26rem", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "hsl(150 20% 15%)", marginBottom: "1rem" }}>
              What We Analyze
            </h2>
          </div>
          <div style={{
            display: "flex", gap: "0.6rem",
            overflowX: "auto", paddingBottom: "0.5rem",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            maxWidth: "26rem", margin: "0 auto",
            paddingRight: "1.25rem",
          }}>
            {[
              { icon: <Globe size={20} />, title: "Origin", desc: "Supply chain tracing", color: "hsl(220 70% 50%)", bg: "hsl(220 60% 96%)" },
              { icon: <Shield size={20} />, title: "Labor", desc: "Forced & child labor", color: "hsl(0 70% 50%)", bg: "hsl(0 50% 97%)" },
              { icon: <Leaf size={20} />, title: "Carbon", desc: "CO₂ lifecycle data", color: "hsl(152 45% 32%)", bg: "hsl(152 40% 96%)" },
              { icon: <TrendingUp size={20} />, title: "Alternatives", desc: "Greener options", color: "hsl(280 55% 50%)", bg: "hsl(280 40% 96%)" },
              { icon: <Search size={20} />, title: "AI OCR", desc: "Label scanning", color: "hsl(45 80% 38%)", bg: "hsl(45 60% 95%)" },
              { icon: <Heart size={20} />, title: "Animal", desc: "Cruelty-free check", color: "hsl(340 65% 50%)", bg: "hsl(340 50% 96%)" },
            ].map((f) => (
              <div key={f.title} style={{
                minWidth: "8rem", backgroundColor: "white",
                borderRadius: "1rem", padding: "1rem",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.04)",
                scrollSnapAlign: "start", flexShrink: 0,
              }}>
                <div style={{
                  width: "2.25rem", height: "2.25rem", borderRadius: "0.625rem",
                  backgroundColor: f.bg, display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "0.6rem", color: f.color,
                }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: "700", fontSize: "0.8rem", color: "hsl(150 20% 15%)", marginBottom: "0.15rem" }}>
                  {f.title}
                </div>
                <div style={{ fontSize: "0.65rem", color: "hsl(150 10% 50%)", lineHeight: 1.4 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{
          padding: "2rem 1.25rem 2.5rem",
          background: "linear-gradient(165deg, hsl(152 45% 28%) 0%, hsl(152 50% 36%) 100%)",
          borderRadius: "1.5rem 1.5rem 0 0",
          textAlign: "center",
          marginTop: "0.5rem",
        }}>
          <div style={{ maxWidth: "26rem", margin: "0 auto" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌱</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "white", marginBottom: "0.5rem" }}>
              Ready to Shop Consciously?
            </h2>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Set your priorities, scan your first product, and start building better shopping habits today.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/scan" style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.8rem 1.75rem", borderRadius: "0.875rem",
                backgroundColor: "white", color: "hsl(152 45% 28%)",
                textDecoration: "none", fontWeight: "700", fontSize: "0.9rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}>
                <Camera size={16} /> Start Scanning
              </Link>
              <Link to="/preferences" style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.8rem 1.5rem", borderRadius: "0.875rem",
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "white", textDecoration: "none", fontWeight: "600", fontSize: "0.85rem",
              }}>
                <Settings size={14} /> Priorities <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Index;
