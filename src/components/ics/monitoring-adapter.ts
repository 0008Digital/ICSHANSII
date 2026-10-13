/** Provider-neutral boundary. A null adapter means diagnostics are not collected. */
export type SafeDiagnostic = {
  category: "frontend-runtime" | "api-request" | "authentication" | "database" | "payment" | "background-job" | "chat-delivery";
  route: string;
  occurredAt: string;
  release: string;
  digest?: string;
};
export interface MonitoringAdapter {
  capture(event: SafeDiagnostic): Promise<void>;
}
export function createMonitoringBoundary(adapter: MonitoringAdapter | null) {
  return {
    configured: adapter !== null,
    async capture(event: SafeDiagnostic) {
      if (!adapter) return false;
      await adapter.capture(event);
      return true;
    },
  };
}
export const monitoring = createMonitoringBoundary(null);
