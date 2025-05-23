// Import all polyfills for IE11 compatibility
import "./polyfills/index";

// Import and re-export main API components
import { trace, metrics, context } from "./api/index";
import { merge, hrTime, timeOrigin } from "./core/index";
import {
  createCounter,
  createHistogram,
  createGauge,
  createMeter,
} from "./metrics/index";

// Export all API components
export * from "./api/index";
export * from "./core/index";
export * from "./trace/index";
export * from "./metrics/index";

// Ensure APIs are included in bundle by creating a global object
var globalObj = {
  trace: trace,
  metrics: metrics,
  context: context,
  core: {
    merge: merge,
    hrTime: hrTime,
    timeOrigin: timeOrigin,
  },
  metricsUtils: {
    createCounter: createCounter,
    createHistogram: createHistogram,
    createGauge: createGauge,
    createMeter: createMeter,
  },
};

// Browser environment
if (typeof window !== "undefined") {
  // Expose under multiple names for compatibility
  (window as any).OpenTelemetryIE11 = globalObj;
  (window as any).opentelemetry = globalObj;
}

// Node.js environment (CommonJS/UMD)
if (typeof global !== "undefined") {
  (global as any).OpenTelemetryIE11 = globalObj;
  (global as any).opentelemetry = globalObj;
}

// Version information
export const VERSION = "1.0.0";

// IE11 compatibility check
export function isIE11(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    !!(window as any).MSInputMethodContext && !!(document as any).documentMode
  );
}

// Global initialization for IE11
if (typeof window !== "undefined" && isIE11()) {
  // Force IE11 out of compatibility mode
  if (!(window as any).console) {
    (window as any).console = {
      log: function () {
        /* noop */
      },
      warn: function () {
        /* noop */
      },
      error: function () {
        /* noop */
      },
    };
  }

  // Add performance polyfill if missing
  if (!(window as any).performance) {
    (window as any).performance = {
      now: function () {
        return new Date().getTime();
      },
      timing: {
        navigationStart: new Date().getTime(),
      },
    };
  }
}

// Default export for UMD compatibility
export default {
  trace: trace,
  metrics: metrics,
  context: context,
  core: {
    merge: merge,
    hrTime: hrTime,
    timeOrigin: timeOrigin,
  },
  metricsUtils: {
    createCounter: createCounter,
    createHistogram: createHistogram,
    createGauge: createGauge,
    createMeter: createMeter,
  },
  VERSION: VERSION,
  isIE11: isIE11,
};

// Export individual feature loaders for optimal bundle size
export async function loadCoreFeatures() {
  const core = await import("./core/index");
  return core;
}

export async function loadPolyfillsOnly() {
  const polyfills = await import("./polyfills/index");
  return polyfills;
}

// Utility for checking what needs to be loaded
export function getBundleOptimizationInfo(): {
  totalSize: string;
  chunks: Array<{
    name: string;
    description: string;
    estimatedSize: string;
    required: boolean;
  }>;
  recommendations: string[];
} {
  return {
    totalSize: "157KB (split into chunks)",
    chunks: [
      {
        name: "polyfills.js",
        description: "Core-js polyfills for IE11 compatibility",
        estimatedSize: "136KB",
        required: true,
      },
      {
        name: "vendor.js",
        description: "Third-party dependencies (fetch, process polyfills)",
        estimatedSize: "11.5KB",
        required: true,
      },
      {
        name: "744.js",
        description: "Babel runtime helpers",
        estimatedSize: "7.87KB",
        required: true,
      },
      {
        name: "opentelemetry-ie11.js",
        description: "Main OpenTelemetry IE11 library code",
        estimatedSize: "1.62KB",
        required: true,
      },
    ],
    recommendations: [
      "All chunks are required for IE11 compatibility",
      "Polyfills chunk is the largest - only load if targeting IE11",
      "For modern browsers, consider using the standard OpenTelemetry library",
      "Chunks are cached separately for better performance on repeat visits",
    ],
  };
}
