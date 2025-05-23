// OpenTelemetry IE11 Web Entry Point
// Web-specific functionality for IE11

// Import conditional polyfills
import "../polyfills/conditional-core-js";

// Core functionality (currently implemented)
// export * from "../core";

// DOM Event Instrumentation
export * from "./dom-event-instrumentation";

// Performance Optimization
export * from "../performance";

// Browser Detection and Conditional Loading
export * from "../browser";

// Version and feature detection
export const version = "1.0.0";
export const isIE11 = !!(
  typeof window !== "undefined" &&
  (window as any).MSInputMethodContext &&
  (document as any).documentMode
);

// Web-specific features
export const webFeatures = {
  hasDOM: typeof document !== "undefined",
  hasWindow: typeof window !== "undefined",
  hasXHR: typeof XMLHttpRequest !== "undefined",
  hasFetch: typeof fetch !== "undefined",
  hasPerformanceAPI:
    typeof performance !== "undefined" && performance.now !== undefined,
  hasIntersectionObserver: typeof IntersectionObserver !== "undefined",
  hasMutationObserver: typeof MutationObserver !== "undefined",
  hasWebWorkers: typeof Worker !== "undefined",
  hasServiceWorkers:
    typeof navigator !== "undefined" && "serviceWorker" in navigator,
};

// Default export for UMD compatibility
const OpenTelemetryIE11Web = {
  version,
  isIE11,
  webFeatures,
};

export default OpenTelemetryIE11Web;
