// Generic error reporting utility
// Replace with Sentry, LogRocket, or any error tracking service as needed.

export function reportLovableError(
  error: unknown,
  context: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error("[Error]", error, context);
  }

  // TODO: integrate error tracking (e.g. Sentry)
  // Sentry.captureException(error, { extra: context });
}
