// IE11-compatible XMLHttpRequest Transport for OpenTelemetry

import { ReadableSpan } from "../../sdk-trace-base";

// Transport configuration
export interface XMLHttpRequestTransportConfig {
  url: string;
  headers?: { [key: string]: string };
  timeout?: number;
  contentType?: string;
  withCredentials?: boolean;
}

// Transport response
export interface TransportResponse {
  success: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: Error;
}

// IE11-compatible XMLHttpRequest transport
export var XMLHttpRequestTransport = function (
  config: XMLHttpRequestTransportConfig
): any {
  var transport = this;
  var _config = config;
  var _defaultHeaders = {
    "Content-Type": _config.contentType || "application/json",
  };

  // Merge default headers with custom headers
  var _headers = {};
  for (var key in _defaultHeaders) {
    if (Object.prototype.hasOwnProperty.call(_defaultHeaders, key)) {
      _headers[key] = _defaultHeaders[key];
    }
  }
  if (_config.headers) {
    for (var key in _config.headers) {
      if (Object.prototype.hasOwnProperty.call(_config.headers, key)) {
        _headers[key] = _config.headers[key];
      }
    }
  }

  // Send data using XMLHttpRequest
  transport.send = function (data: any): Promise<TransportResponse> {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();

      // Configure request
      try {
        xhr.open("POST", _config.url, true);
      } catch (error) {
        reject({
          success: false,
          status: 0,
          statusText: "Failed to open connection",
          error: error,
        });
        return;
      }

      // Set headers
      for (var headerName in _headers) {
        if (Object.prototype.hasOwnProperty.call(_headers, headerName)) {
          try {
            xhr.setRequestHeader(headerName, _headers[headerName]);
          } catch (error) {
            // Log header setting errors but continue
            if (typeof console !== "undefined" && console.warn) {
              console.warn(
                "Failed to set header " + headerName + ":",
                error.message
              );
            }
          }
        }
      }

      // Configure credentials
      if (_config.withCredentials) {
        xhr.withCredentials = true;
      }

      // Set timeout
      if (_config.timeout) {
        xhr.timeout = _config.timeout;
      }

      // Handle successful response
      xhr.onload = function () {
        var response: TransportResponse = {
          success: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
        };

        if (response.success) {
          try {
            response.data = xhr.responseText
              ? JSON.parse(xhr.responseText)
              : {};
          } catch (error) {
            response.data = xhr.responseText;
          }
        } else {
          response.error = new Error(
            "HTTP " + xhr.status + ": " + xhr.statusText
          );
        }

        resolve(response);
      };

      // Handle network errors
      xhr.onerror = function () {
        resolve({
          success: false,
          status: xhr.status || 0,
          statusText: "Network Error",
          error: new Error("Network request failed"),
        });
      };

      // Handle timeouts
      xhr.ontimeout = function () {
        resolve({
          success: false,
          status: 0,
          statusText: "Timeout",
          error: new Error("Request timed out"),
        });
      };

      // Handle aborts
      xhr.onabort = function () {
        resolve({
          success: false,
          status: 0,
          statusText: "Aborted",
          error: new Error("Request was aborted"),
        });
      };

      // Send the data
      try {
        var payload = typeof data === "string" ? data : JSON.stringify(data);
        xhr.send(payload);
      } catch (error) {
        reject({
          success: false,
          status: 0,
          statusText: "Send Failed",
          error: error,
        });
      }
    });
  };

  // Send spans as formatted payload
  transport.sendSpans = function (
    spans: ReadableSpan[]
  ): Promise<TransportResponse> {
    var payload = {
      spans: spans.map(function (span) {
        return {
          traceId: span.spanContext.traceId,
          spanId: span.spanContext.spanId,
          parentSpanId: span.parentSpanId,
          name: span.name,
          kind: span.kind,
          startTime: span.startTime,
          endTime: span.endTime,
          duration: span.duration,
          status: span.status,
          attributes: span.attributes,
          events: span.events,
          links: span.links,
          resource: span.resource,
        };
      }),
      timestamp: Date.now(),
    };

    return transport.send(payload);
  };

  // Batch send with retry logic
  transport.sendBatch = function (
    batches: ReadableSpan[][],
    retryAttempts?: number
  ): Promise<TransportResponse[]> {
    var maxRetries = retryAttempts || 3;
    var results: Promise<TransportResponse>[] = [];

    for (var i = 0; i < batches.length; i++) {
      var batch = batches[i];
      results.push(
        (function (currentBatch) {
          return transport.sendSpansWithRetry(currentBatch, maxRetries);
        })(batch)
      );
    }

    return Promise.all(results);
  };

  // Send with retry logic
  transport.sendSpansWithRetry = function (
    spans: ReadableSpan[],
    maxRetries: number
  ): Promise<TransportResponse> {
    var attempt = 0;

    function tryRequest(): Promise<TransportResponse> {
      return transport.sendSpans(spans).then(
        function (response) {
          if (response.success || attempt >= maxRetries) {
            return response;
          } else {
            attempt++;
            var delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            return new Promise(function (resolve) {
              setTimeout(function () {
                resolve(tryRequest());
              }, delay);
            });
          }
        },
        function (error) {
          if (attempt >= maxRetries) {
            return Promise.reject(error);
          } else {
            attempt++;
            var delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            return new Promise(function (resolve) {
              setTimeout(function () {
                resolve(tryRequest());
              }, delay);
            });
          }
        }
      );
    }

    return tryRequest();
  };

  return transport;
};

XMLHttpRequestTransport.prototype = {
  constructor: XMLHttpRequestTransport,
};

export { XMLHttpRequestTransport };
