// OpenTelemetry IE11 Core Entry Point
// Minimal functionality for basic tracing

// Import conditional polyfills
import "../polyfills/conditional-core-js";

// Core utility functions
export * from "./utils";

// Core types and interfaces
export * from "../sdk-trace-base/types";

// Utility functions from sdk-trace-base
export { objectAssign, arrayFind, arrayIncludes } from "../sdk-trace-base/util";

// Version and feature detection
export const version = "1.0.0";
export const isIE11 = !!(
  typeof window !== "undefined" &&
  (window as any).MSInputMethodContext &&
  (document as any).documentMode
);

// Feature detection utilities
export const features = {
  hasPerformanceAPI:
    typeof performance !== "undefined" && typeof performance.now === "function",
  hasXHR: typeof XMLHttpRequest !== "undefined",
  hasLocalStorage: (() => {
    try {
      return typeof localStorage !== "undefined" && localStorage !== null;
    } catch (e) {
      return false;
    }
  })(),
  isIE11,
};

// Default export for UMD compatibility
const OpenTelemetryIE11Core = {
  version,
  isIE11,
  features,
};

export default OpenTelemetryIE11Core;
