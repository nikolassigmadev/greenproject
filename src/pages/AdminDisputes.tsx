import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { isAdminAuthenticated } from "@/utils/adminAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Inbox, ArrowLeft } from "lucide-react";

interface DisputeRecord {
  id: string;
  flagId: string | null;
  brandName: string;
  issueType: string;
  description: string;
  sourceUrl: string | null;
  email: string | null;
  submittedAt: string;
  status: "open" | "resolved" | "rejected";
}

const ISSUE_LABELS: Record<string, string> = {
  incorrect_flag:  "Incorrect flag",
  outdated_source: "Outdated source",
  missing_context: "Missing context",
  brand_response:  "Brand response",
  other:           "Other",
};

const AdminDisputes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login", { replace: true, state: { from: location } });
    }
  }, [location, navigate]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("es_disputes") ?? "[]") as DisputeRecord[];
      setDisputes(stored.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
    } catch {
      setDisputes([]);
    }
  }, []);

  if (!isAdminAuthenticated()) return null;

  const disputeEmail = import.meta.env.VITE_DISPUTE_EMAIL as string | undefined;
  const disputeEndpoint = import.meta.env.VITE_DISPUTE_ENDPOINT as string | undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">

        {/* Back */}
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Dispute Queue</h1>
          <p className="text-muted-foreground text-sm">
            User-submitted reports about brand flags. Review within 14 days per the dispute SLA.
          </p>
        </div>

        {/* Backend status notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 mb-8">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">No backend wired yet</p>
            <p className="text-amber-700 dark:text-amber-300">
              Submissions are stored in browser localStorage and shown below.
              {disputeEndpoint
                ? ` Submissions are also POSTed to: ${disputeEndpoint}`
                : disputeEmail
                ? ` A mailto link opens to: ${disputeEmail} (users without a backend route)`
                : " Set VITE_DISPUTE_ENDPOINT or VITE_DISPUTE_EMAIL in your .env to enable email/API routing."}
            </p>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No disputes submitted yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              When users tap "Report an issue" on a brand flag, submissions appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{disputes.length} submission{disputes.length !== 1 ? "s" : ""}</p>
            {disputes.map((d) => (
              <div key={d.id} className="border rounded-lg p-5 space-y-3 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{d.brandName}</p>
                    {d.flagId && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">flag: {d.flagId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline">{ISSUE_LABELS[d.issueType] ?? d.issueType}</Badge>
                    <Badge variant={d.status === "open" ? "destructive" : d.status === "resolved" ? "default" : "secondary"}>
                      {d.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>

                {d.sourceUrl && (
                  <a
                    href={d.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline break-all"
                  >
                    {d.sourceUrl}
                  </a>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <span>{d.email ?? "No email provided"}</span>
                  <span>{new Date(d.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminDisputes;
