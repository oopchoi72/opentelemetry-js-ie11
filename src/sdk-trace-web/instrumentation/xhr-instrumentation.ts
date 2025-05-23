// IE11-compatible XMLHttpRequest Instrumentation for OpenTelemetry

import { Span, SpanKind } from "../../sdk-trace-base";

// XHR instrumentation configuration
export interface XMLHttpRequestInstrumentationConfig {
  enabled?: boolean;
  propagateTraceHeaderCorsUrls?: string[] | RegExp[];
  requestHook?: (span: Span, xhr: XMLHttpRequest) => void;
  responseHook?: (span: Span, xhr: XMLHttpRequest) => void;
  ignoreUrls?: string[] | RegExp[];
}

// XHR timing data
export interface XHRTimingData {
  requestStart: number;
  responseStart?: number;
  responseEnd?: number;
  loadStart?: number;
  loadEnd?: number;
}

// IE11-compatible XMLHttpRequest instrumentation
export var XMLHttpRequestInstrumentation = function (
  config?: XMLHttpRequestInstrumentationConfig
): any {
  var instrumentation = this;
  var _config = config || {};
  var _enabled = _config.enabled !== false;
  var _originalXHR = XMLHttpRequest;
  var _isPatched = false;

  // Check if URL should be ignored
  function shouldIgnoreUrl(url: string): boolean {
    if (!_config.ignoreUrls) {
      return false;
    }

    for (var i = 0; i < _config.ignoreUrls.length; i++) {
      var pattern = _config.ignoreUrls[i];
      if (typeof pattern === "string") {
        if (url.indexOf(pattern) !== -1) {
          return true;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(url)) {
          return true;
        }
      }
    }

    return false;
  }

  // Check if CORS headers should be propagated
  function shouldPropagateCorsHeaders(url: string): boolean {
    if (!_config.propagateTraceHeaderCorsUrls) {
      return false;
    }

    for (var i = 0; i < _config.propagateTraceHeaderCorsUrls.length; i++) {
      var pattern = _config.propagateTraceHeaderCorsUrls[i];
      if (typeof pattern === "string") {
        if (url.indexOf(pattern) !== -1) {
          return true;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(url)) {
          return true;
        }
      }
    }

    return false;
  }

  // Create instrumented XMLHttpRequest
  function createInstrumentedXHR(): XMLHttpRequest {
    var xhr = new _originalXHR();
    var span: Span | null = null;
    var url: string = "";
    var method: string = "GET";
    var timingData: XHRTimingData = {
      requestStart: 0,
    };

    // Store original methods
    var originalOpen = xhr.open;
    var originalSend = xhr.send;
    var originalSetRequestHeader = xhr.setRequestHeader;

    // Patch open method
    xhr.open = function (
      method_: string,
      url_: string,
      async?: boolean,
      user?: string,
      password?: string
    ) {
      method = method_.toUpperCase();
      url = url_;

      // Check if URL should be ignored
      if (shouldIgnoreUrl(url)) {
        return originalOpen.apply(xhr, arguments);
      }

      // Create span for this request
      if (typeof window !== "undefined" && (window as any).opentelemetry) {
        var tracer = (window as any).opentelemetry.trace.getActiveTracer();
        if (tracer) {
          span = tracer.startSpan("HTTP " + method, {
            kind: SpanKind.CLIENT,
            attributes: {
              "http.method": method,
              "http.url": url,
              component: "http",
            },
          });
        }
      }

      return originalOpen.apply(xhr, arguments);
    };

    // Patch send method
    xhr.send = function (body?: any) {
      timingData.requestStart = Date.now();

      if (span) {
        // Add request body size if available
        if (body) {
          var bodySize = 0;
          if (typeof body === "string") {
            bodySize = body.length;
          } else if (body instanceof ArrayBuffer) {
            bodySize = body.byteLength;
          }
          if (bodySize > 0) {
            span.setAttribute("http.request_content_length", bodySize);
          }
        }

        // Call request hook if configured
        if (_config.requestHook) {
          try {
            _config.requestHook(span, xhr);
          } catch (error) {
            if (typeof console !== "undefined" && console.warn) {
              console.warn("Request hook error:", error);
            }
          }
        }
      }

      // Patch readystatechange for timing
      var originalOnreadystatechange = xhr.onreadystatechange;
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 2) {
          // Headers received
          timingData.responseStart = Date.now();
        } else if (xhr.readyState === 4) {
          // Request completed
          timingData.responseEnd = Date.now();

          if (span) {
            // Set response attributes
            span.setAttribute("http.status_code", xhr.status);
            span.setAttribute("http.status_text", xhr.statusText);

            // Set response content length if available
            var contentLength = xhr.getResponseHeader("Content-Length");
            if (contentLength) {
              span.setAttribute(
                "http.response_content_length",
                parseInt(contentLength, 10)
              );
            }

            // Calculate timing
            if (timingData.responseStart) {
              span.setAttribute(
                "http.response_start_time",
                timingData.responseStart - timingData.requestStart
              );
            }
            if (timingData.responseEnd) {
              span.setAttribute(
                "http.duration",
                timingData.responseEnd - timingData.requestStart
              );
            }

            // Set status based on HTTP status code
            if (xhr.status >= 400) {
              span.setStatus({
                code: 2, // ERROR
                message: "HTTP " + xhr.status + ": " + xhr.statusText,
              });
            } else {
              span.setStatus({
                code: 1, // OK
              });
            }

            // Call response hook if configured
            if (_config.responseHook) {
              try {
                _config.responseHook(span, xhr);
              } catch (error) {
                if (typeof console !== "undefined" && console.warn) {
                  console.warn("Response hook error:", error);
                }
              }
            }

            // End span
            span.end();
          }
        }

        // Call original handler if it exists
        if (originalOnreadystatechange) {
          return originalOnreadystatechange.apply(xhr, arguments);
        }
      };

      return originalSend.apply(xhr, arguments);
    };

    // Patch setRequestHeader to propagate trace context
    xhr.setRequestHeader = function (name: string, value: string) {
      // If this is a CORS request and we should propagate headers
      if (shouldPropagateCorsHeaders(url) && span) {
        var spanContext = span.spanContext();
        if (spanContext) {
          // Add W3C Trace Context headers
          if (name.toLowerCase() === "traceparent") {
            // Allow manual override
          } else if (
            !xhr.getResponseHeader ||
            !xhr.getResponseHeader("traceparent")
          ) {
            try {
              originalSetRequestHeader.call(
                xhr,
                "traceparent",
                "00-" +
                  spanContext.traceId +
                  "-" +
                  spanContext.spanId +
                  "-" +
                  (spanContext.traceFlags || 1).toString(16).padStart(2, "0")
              );
            } catch (error) {
              // Ignore CORS header errors
            }
          }
        }
      }

      return originalSetRequestHeader.apply(xhr, arguments);
    };

    return xhr;
  }

  // Install instrumentation
  instrumentation.enable = function () {
    if (_isPatched) {
      return;
    }

    if (typeof window !== "undefined" && window.XMLHttpRequest) {
      // Replace global XMLHttpRequest with instrumented version
      window.XMLHttpRequest = function () {
        return createInstrumentedXHR();
      } as any;

      // Copy static properties
      for (var prop in _originalXHR) {
        if (Object.prototype.hasOwnProperty.call(_originalXHR, prop)) {
          try {
            (window.XMLHttpRequest as any)[prop] = (_originalXHR as any)[prop];
          } catch (error) {
            // Ignore property copying errors
          }
        }
      }

      _isPatched = true;
      _enabled = true;
    }
  };

  // Uninstall instrumentation
  instrumentation.disable = function () {
    if (!_isPatched) {
      return;
    }

    if (typeof window !== "undefined") {
      window.XMLHttpRequest = _originalXHR;
      _isPatched = false;
      _enabled = false;
    }
  };

  // Check if enabled
  instrumentation.isEnabled = function () {
    return _enabled;
  };

  // Auto-enable if configured
  if (_enabled) {
    instrumentation.enable();
  }

  return instrumentation;
};

XMLHttpRequestInstrumentation.prototype = {
  constructor: XMLHttpRequestInstrumentation,
};

export { XMLHttpRequestInstrumentation };
