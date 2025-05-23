// Periodic Metric Reader for IE11
// Collects and exports metrics at regular intervals

import { MetricReader, MetricData, MetricExporter } from "../types";
import { getHighResolutionTime } from "../utils/ie11-utils";

export interface PeriodicMetricReaderConfig {
  exportIntervalMillis?: number;
  exportTimeoutMillis?: number;
  exporter: MetricExporter;
}

export interface PeriodicMetricReader extends MetricReader {
  forceFlush(): Promise<void>;
  shutdown(): Promise<void>;
}

export function createPeriodicMetricReader(
  config: PeriodicMetricReaderConfig
): PeriodicMetricReader {
  var exporter = config.exporter;
  var exportInterval = config.exportIntervalMillis || 60000; // 60 seconds default
  var exportTimeout = config.exportTimeoutMillis || 30000; // 30 seconds default
  var isRunning = false;
  var isShutdown = false;
  var intervalId: any = null;
  var collectCallback: (() => MetricData[]) | null = null;

  function setCollectCallback(callback: () => MetricData[]): void {
    collectCallback = callback;
  }

  function collect(): MetricData[] {
    if (collectCallback) {
      return collectCallback();
    }
    return [];
  }

  function exportMetrics(): Promise<void> {
    if (isShutdown) {
      return Promise.resolve();
    }

    var metrics = collect();
    if (metrics.length === 0) {
      return Promise.resolve();
    }

    var exportPromise = exporter.export(metrics);

    // Add timeout handling for IE11
    var timeoutPromise = new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject(new Error("Export timeout"));
      }, exportTimeout);
    });

    return Promise.race([exportPromise, timeoutPromise]).catch(function (
      error
    ) {
      // Log export errors but don't stop the reader
      if (typeof console !== "undefined" && console.error) {
        console.error("Metric export failed:", error);
      }
      return Promise.resolve();
    });
  }

  function start(): void {
    if (isRunning || isShutdown) {
      return;
    }

    isRunning = true;

    // Use setTimeout for IE11 compatibility instead of setInterval
    function scheduleExport() {
      if (!isRunning || isShutdown) {
        return;
      }

      intervalId = setTimeout(function () {
        exportMetrics().finally(function () {
          scheduleExport(); // Schedule next export
        });
      }, exportInterval);
    }

    scheduleExport();
  }

  function stop(): void {
    isRunning = false;
    if (intervalId) {
      clearTimeout(intervalId);
      intervalId = null;
    }
  }

  function forceFlush(): Promise<void> {
    if (isShutdown) {
      return Promise.reject(new Error("MetricReader has been shutdown"));
    }

    var exportPromise = exportMetrics();
    var exporterFlushPromise = exporter.forceFlush();

    return Promise.all([exportPromise, exporterFlushPromise]).then(function () {
      // Return void
    });
  }

  function shutdown(): Promise<void> {
    if (isShutdown) {
      return Promise.resolve();
    }

    isShutdown = true;
    stop();

    // Final flush before shutdown
    var finalFlush = exportMetrics();
    var exporterShutdown = exporter.shutdown();

    return Promise.all([finalFlush, exporterShutdown]).then(function () {
      collectCallback = null;
    });
  }

  return {
    collect: collect,
    forceFlush: forceFlush,
    shutdown: shutdown,
    setCollectCallback: setCollectCallback,
    start: start,
    stop: stop,
  };
}

// Factory function with default configuration
export function PeriodicMetricReader(
  config: PeriodicMetricReaderConfig
): PeriodicMetricReader {
  return createPeriodicMetricReader(config);
}
