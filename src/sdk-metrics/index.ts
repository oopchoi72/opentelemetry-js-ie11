// OpenTelemetry Metrics SDK for IE11
// Main entry point for all metrics functionality

// Import conditional polyfills first
import "../polyfills/conditional-core-js";

// Core types
export * from "./types";

// Utility functions
export * from "./utils/ie11-utils";

// Metric instruments
export { createCounter, Counter } from "./instruments/counter";
export { createGauge, Gauge } from "./instruments/gauge";
export { createHistogram, Histogram } from "./instruments/histogram";

// Aggregation engine
export {
  createSumAggregator,
  createGaugeAggregator,
  createHistogramAggregator,
  calculatePercentile,
  calculateAverage,
  calculateMinMax,
  calculateStandardDeviation,
  createTemporalAggregator,
} from "./aggregators/aggregation-engine";

// Export functionality
export {
  createMetricExporter,
  createConsoleExporter,
  createOTLPExporter,
  MetricExporter,
} from "./export/metric-exporter";

// Metric reader and provider
export { createMeterProvider, MeterProvider } from "./meter-provider";
export {
  createPeriodicMetricReader,
  PeriodicMetricReader,
} from "./readers/periodic-metric-reader";

// Version information
export const SDK_VERSION = "1.0.0";
export const IE11_COMPATIBLE = true;

// Feature detection
export const features = {
  hasPerformanceAPI:
    typeof performance !== "undefined" && typeof performance.now === "function",
  hasXHR: typeof XMLHttpRequest !== "undefined",
  hasLocalStorage: (function () {
    try {
      return typeof localStorage !== "undefined" && localStorage !== null;
    } catch (e) {
      return false;
    }
  })(),
  hasJSON: typeof JSON !== "undefined" && typeof JSON.stringify === "function",
  isIE11: !!(
    typeof window !== "undefined" &&
    (window as any).MSInputMethodContext &&
    (document as any).documentMode
  ),
};

// Default export for UMD compatibility
const OpenTelemetryMetricsIE11 = {
  SDK_VERSION,
  IE11_COMPATIBLE,
  features,
  // Instruments
  createCounter,
  createGauge,
  createHistogram,
  // Aggregators
  createSumAggregator,
  createGaugeAggregator,
  createHistogramAggregator,
  // Exporters
  createMetricExporter,
  createConsoleExporter,
  createOTLPExporter,
  // Providers
  createMeterProvider,
  createPeriodicMetricReader,
};

export default OpenTelemetryMetricsIE11;
