// OpenTelemetry IE11 Trace Entry Point
// Tracing-only functionality for IE11

// Import conditional polyfills
import "../polyfills/conditional-core-js";

// Core functionality
export * from "../core";

// Version and feature detection
export const version = "1.0.0";
export const isIE11 = !!(
  typeof window !== "undefined" &&
  (window as any).MSInputMethodContext &&
  (document as any).documentMode
);

// Trace-specific features
export const traceFeatures = {
  hasPerformanceAPI:
    typeof performance !== "undefined" && typeof performance.now === "function",
  hasXHR: typeof XMLHttpRequest !== "undefined",
  isIE11,
};

// Default export for UMD compatibility
const OpenTelemetryIE11Trace = {
  version,
  isIE11,
  traceFeatures,
};

export default OpenTelemetryIE11Trace;
