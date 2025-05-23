// Metric Exporter for IE11
// Implements metric export using XHR and image beacon fallbacks

import { MetricData, MetricExportConfig } from "../types";
import {
  safeStringify,
  createError,
  getHighResolutionTime,
  detectIE11Features,
} from "../utils/ie11-utils";

export interface MetricExporter {
  export(metrics: MetricData[]): Promise<void>;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

export function createMetricExporter(
  config: MetricExportConfig
): MetricExporter {
  var endpoint = config.endpoint || "";
  var headers = config.headers || {};
  var timeout = config.timeout || 10000;
  var retryAttempts = config.retryAttempts || 3;
  var useXHR = config.useXHR !== false; // Default to true
  var useImageBeacon = config.useImageBeacon !== false; // Default to true
  var isShutdown = false;
  var features = detectIE11Features();

  // Queue for failed exports to retry
  var retryQueue: Array<{ data: MetricData[]; attempt: number }> = [];
  var isProcessingRetries = false;

  function validateConfig(): void {
    if (!endpoint) {
      throw createError("MISSING_ENDPOINT", "Export endpoint is required");
    }

    if (!features.hasXHR && !useImageBeacon) {
      throw createError(
        "NO_EXPORT_METHOD",
        "Neither XHR nor image beacon is available"
      );
    }
  }

  function createRequestHeaders(): { [key: string]: string } {
    var defaultHeaders: { [key: string]: string } = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Merge with user headers
    for (var key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key)) {
        defaultHeaders[key] = headers[key];
      }
    }

    return defaultHeaders;
  }

  function cleanup(timeoutId?: any): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  function exportViaXHR(data: MetricData[]): Promise<void> {
    return new Promise(function (resolve, reject) {
      if (!features.hasXHR) {
        reject(
          createError("XHR_NOT_AVAILABLE", "XMLHttpRequest is not available")
        );
        return;
      }

      var xhr = new XMLHttpRequest();
      var payload = safeStringify(data);
      var timeoutId: any;

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          cleanup(timeoutId);

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              createError(
                "HTTP_ERROR",
                "HTTP " + xhr.status + ": " + xhr.statusText,
                {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  response: xhr.responseText,
                }
              )
            );
          }
        }
      };

      xhr.onerror = function () {
        cleanup(timeoutId);
        reject(createError("NETWORK_ERROR", "Network error occurred"));
      };

      xhr.ontimeout = function () {
        cleanup(timeoutId);
        reject(createError("TIMEOUT_ERROR", "Request timed out"));
      };

      try {
        xhr.open("POST", endpoint, true);
        xhr.timeout = timeout;

        var requestHeaders = createRequestHeaders();
        for (var header in requestHeaders) {
          if (Object.prototype.hasOwnProperty.call(requestHeaders, header)) {
            xhr.setRequestHeader(header, requestHeaders[header]);
          }
        }

        // Set timeout manually for IE11 compatibility
        timeoutId = setTimeout(function () {
          xhr.abort();
          reject(createError("TIMEOUT_ERROR", "Request timed out manually"));
        }, timeout);

        xhr.send(payload);
      } catch (error) {
        cleanup(timeoutId);
        reject(
          createError("XHR_SEND_ERROR", "Failed to send XHR request", {
            error: error,
          })
        );
      }
    });
  }

  function exportViaImageBeacon(data: MetricData[]): Promise<void> {
    return new Promise(function (resolve, reject) {
      try {
        var payload = safeStringify(data);

        // Encode data as base64 for URL transmission
        var encodedData = btoa(payload);
        var fullUrl = endpoint + "?data=" + encodeURIComponent(encodedData);

        // Check URL length limit for IE11
        if (fullUrl.length > 2048) {
          reject(
            createError(
              "URL_TOO_LONG",
              "Encoded data exceeds URL length limit for image beacon"
            )
          );
          return;
        }

        var img = new Image();
        var timeoutId: any;

        var cleanupImage = function () {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          img.onload = null;
          img.onerror = null;
        };

        img.onload = function () {
          cleanupImage();
          resolve();
        };

        img.onerror = function () {
          cleanupImage();
          reject(
            createError("IMAGE_BEACON_ERROR", "Image beacon failed to load")
          );
        };

        // Set timeout for image beacon
        timeoutId = setTimeout(function () {
          cleanupImage();
          reject(createError("IMAGE_BEACON_TIMEOUT", "Image beacon timed out"));
        }, timeout);

        img.src = fullUrl;
      } catch (error) {
        reject(
          createError(
            "IMAGE_BEACON_ENCODE_ERROR",
            "Failed to encode data for image beacon",
            { error: error }
          )
        );
      }
    });
  }

  function exportWithRetry(
    data: MetricData[],
    attempt?: number
  ): Promise<void> {
    attempt = attempt || 1;

    // Try XHR first, then fall back to image beacon
    var exportPromise: Promise<void>;

    if (useXHR && features.hasXHR) {
      exportPromise = exportViaXHR(data);
    } else if (useImageBeacon) {
      exportPromise = exportViaImageBeacon(data);
    } else {
      return Promise.reject(
        createError("NO_EXPORT_METHOD", "No export method available")
      );
    }

    return exportPromise.catch(function (error) {
      if (attempt < retryAttempts) {
        // Add exponential backoff delay
        var delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            exportWithRetry(data, attempt + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        });
      } else {
        // Add to retry queue for later processing
        if (!isShutdown) {
          retryQueue.push({ data: data, attempt: 0 });
        }
        throw error;
      }
    });
  }

  function processRetryQueue(): Promise<void> {
    if (isProcessingRetries || retryQueue.length === 0) {
      return Promise.resolve();
    }

    isProcessingRetries = true;
    var promises: Promise<void>[] = [];
    var itemsToProcess = retryQueue.splice(0, 5); // Process 5 items at a time

    for (var i = 0; i < itemsToProcess.length; i++) {
      var item = itemsToProcess[i];
      promises.push(exportWithRetry(item.data, item.attempt + 1));
    }

    return Promise.all(promises)
      .then(function () {
        isProcessingRetries = false;

        // Process more items if they exist
        if (retryQueue.length > 0) {
          return processRetryQueue();
        }
      })
      .catch(function () {
        isProcessingRetries = false;
        // Continue processing even if some items fail
        if (retryQueue.length > 0) {
          return processRetryQueue();
        }
      });
  }

  function exportMetrics(metrics: MetricData[]): Promise<void> {
    if (isShutdown) {
      return Promise.reject(
        createError("EXPORTER_SHUTDOWN", "Exporter has been shutdown")
      );
    }

    if (!metrics || metrics.length === 0) {
      return Promise.resolve();
    }

    // Validate and filter metrics
    var validMetrics = [];
    for (var i = 0; i < metrics.length; i++) {
      if (metrics[i] && metrics[i].metrics && metrics[i].metrics.length > 0) {
        validMetrics.push(metrics[i]);
      }
    }

    if (validMetrics.length === 0) {
      return Promise.resolve();
    }

    return exportWithRetry(validMetrics);
  }

  function forceFlush(): Promise<void> {
    return processRetryQueue();
  }

  function shutdown(): Promise<void> {
    isShutdown = true;

    // Try to flush remaining items in retry queue
    return processRetryQueue()
      .then(function () {
        retryQueue = [];
      })
      .catch(function () {
        retryQueue = [];
      });
  }

  // Validate configuration on creation
  validateConfig();

  return {
    export: exportMetrics,
    forceFlush: forceFlush,
    shutdown: shutdown,
  };
}

// Factory function with common configurations
export function createConsoleExporter(): MetricExporter {
  return {
    export: function (metrics: MetricData[]): Promise<void> {
      if (typeof console !== "undefined" && console.log) {
        console.log("Metrics Export:", safeStringify(metrics));
      }
      return Promise.resolve();
    },
    forceFlush: function (): Promise<void> {
      return Promise.resolve();
    },
    shutdown: function (): Promise<void> {
      return Promise.resolve();
    },
  };
}

export function createOTLPExporter(
  endpoint: string,
  headers?: { [key: string]: string }
): MetricExporter {
  return createMetricExporter({
    endpoint: endpoint,
    headers: headers,
    timeout: 15000,
    retryAttempts: 3,
    useXHR: true,
    useImageBeacon: false,
  });
}
