import { Component, type ReactNode } from "react";
import { DS } from "@/styles/design-tokens";
import { reportClientError } from "@/utils/errorReporter";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  recovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, recovering: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, recovering: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    reportClientError({
      message: error.message,
      stack: error.stack ?? info.componentStack ?? undefined,
      source: "boundary",
    });
  }

  // A crash like "Can't find variable: …" almost always means the device is
  // running a stale, cached build whose JS no longer matches the deployed app.
  // A plain reload just re-serves that same broken bundle from cache, trapping
  // the user on this screen. So before reloading we purge the cached app shell
  // (Cache Storage + service worker) to force a fresh fetch of the current code.
  handleReload = async () => {
    this.setState({ recovering: true });
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // Best effort — reload regardless so the user is never stuck here.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: DS.bg,
          fontFamily: DS.font,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: DS.badBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: DS.ink,
              marginBottom: 8,
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 15,
              color: DS.ink2,
              lineHeight: 1.5,
              marginBottom: 24,
            }}
          >
            An unexpected error occurred. Try refreshing the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: 12,
                color: DS.bad,
                background: DS.badBg,
                padding: 12,
                borderRadius: DS.radius.sm,
                textAlign: "left",
                overflow: "auto",
                maxHeight: 120,
                marginBottom: 24,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            disabled={this.state.recovering}
            style={{
              padding: "12px 28px",
              borderRadius: DS.radius.sm,
              background: DS.ink,
              color: DS.card,
              border: "none",
              fontSize: 15,
              fontWeight: 600,
              cursor: this.state.recovering ? "default" : "pointer",
              opacity: this.state.recovering ? 0.6 : 1,
            }}
          >
            {this.state.recovering ? "Reloading…" : "Reload page"}
          </button>
        </div>
      </div>
    );
  }
}
