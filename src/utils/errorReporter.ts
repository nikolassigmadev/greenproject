// Fire-and-forget crash reporting to POST /api/client-errors, so production
// breakage shows up in the admin log instead of relying on users to email.
// Deduped per session and hard-capped so a render loop can't spam the server
// (which rate-limits per IP as the backstop).

import { getBackendUrl } from "@/config/backend";

const reported = new Set<string>();
let sentCount = 0;
const MAX_REPORTS_PER_SESSION = 5;

export function reportClientError(input: {
  message: string;
  stack?: string;
  source: "boundary" | "window" | "promise";
}): void {
  try {
    if (!import.meta.env.PROD) return;
    const key = `${input.source}:${input.message}`;
    if (reported.has(key) || sentCount >= MAX_REPORTS_PER_SESSION) return;
    reported.add(key);
    sentCount++;
    fetch(`${getBackendUrl()}/api/client-errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.message.slice(0, 500),
        stack: input.stack?.slice(0, 2000),
        source: input.source,
        url: window.location.pathname,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Telemetry must never take the app down with it.
  }
}

export function installGlobalErrorReporting(): void {
  window.addEventListener("error", (e) => {
    reportClientError({
      message: e.message || "Unknown error",
      stack: e.error instanceof Error ? e.error.stack : undefined,
      source: "window",
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason: unknown = e.reason;
    reportClientError({
      message: reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection"),
      stack: reason instanceof Error ? reason.stack : undefined,
      source: "promise",
    });
  });
}
