// IE11-compatible Document Load Instrumentation for OpenTelemetry

import { Span, SpanKind } from "../../sdk-trace-base";
import { EventListenerManager } from "../utils/event-listener-manager";

// Document load instrumentation configuration
export interface DocumentLoadInstrumentationConfig {
  enabled?: boolean;
  ignoreNetworkEvents?: boolean;
  collectResourceTimings?: boolean;
  applyCustomAttributesOnSpan?: (span: Span) => void;
}

// Document timing interface for IE11 compatibility
interface DocumentTiming {
  navigationStart?: number;
  domLoading?: number;
  domInteractive?: number;
  domContentLoadedEventStart?: number;
  domContentLoadedEventEnd?: number;
  domComplete?: number;
  loadEventStart?: number;
  loadEventEnd?: number;
  responseStart?: number;
  responseEnd?: number;
}

// IE11-compatible Document Load Instrumentation
export var DocumentLoadInstrumentation = function (
  config?: DocumentLoadInstrumentationConfig
): any {
  var instrumentation = this;
  var _config = config || {};
  var _enabled = _config.enabled !== false;
  var _documentLoadSpan: Span | null = null;
  var _isInstrumented = false;

  // Get performance timing with IE11 compatibility
  function getPerformanceTiming(): DocumentTiming {
    if (typeof window === "undefined") {
      return {};
    }

    var timing: DocumentTiming = {};

    // Try modern Performance API first
    if (window.performance && window.performance.timing) {
      var perfTiming = window.performance.timing;
      timing = {
        navigationStart: perfTiming.navigationStart,
        domLoading: perfTiming.domLoading,
        domInteractive: perfTiming.domInteractive,
        domContentLoadedEventStart: perfTiming.domContentLoadedEventStart,
        domContentLoadedEventEnd: perfTiming.domContentLoadedEventEnd,
        domComplete: perfTiming.domComplete,
        loadEventStart: perfTiming.loadEventStart,
        loadEventEnd: perfTiming.loadEventEnd,
        responseStart: perfTiming.responseStart,
        responseEnd: perfTiming.responseEnd,
      };
    } else {
      // Fallback for environments without Performance API
      var now = Date.now();
      timing = {
        navigationStart: now,
        domLoading: now,
        domInteractive: now,
        domContentLoadedEventStart: now,
        domContentLoadedEventEnd: now,
        domComplete: now,
        loadEventStart: now,
        loadEventEnd: now,
        responseStart: now,
        responseEnd: now,
      };
    }

    return timing;
  }

  // Start document load span
  function startDocumentLoadSpan(): void {
    if (_documentLoadSpan) {
      return;
    }

    // Get tracer
    if (typeof window !== "undefined" && (window as any).opentelemetry) {
      var tracer = (window as any).opentelemetry.trace.getActiveTracer();
      if (tracer) {
        _documentLoadSpan = tracer.startSpan("document-load", {
          kind: SpanKind.CLIENT,
          attributes: {
            component: "document-load",
            "document.url": window.location.href,
            "document.referrer": document.referrer || "",
          },
        });

        // Add custom attributes if configured
        if (_config.applyCustomAttributesOnSpan) {
          try {
            _config.applyCustomAttributesOnSpan(_documentLoadSpan);
          } catch (error) {
            if (typeof console !== "undefined" && console.warn) {
              console.warn("Error applying custom attributes:", error);
            }
          }
        }
      }
    }
  }

  // Add performance timing to span
  function addPerformanceTimings(span: Span): void {
    var timing = getPerformanceTiming();

    if (timing.navigationStart) {
      span.setAttribute("navigation.start", timing.navigationStart);

      // Calculate durations relative to navigation start
      if (timing.domLoading) {
        span.setAttribute(
          "dom.loading",
          timing.domLoading - timing.navigationStart
        );
      }
      if (timing.domInteractive) {
        span.setAttribute(
          "dom.interactive",
          timing.domInteractive - timing.navigationStart
        );
      }
      if (timing.domContentLoadedEventStart) {
        span.setAttribute(
          "dom.content_loaded_start",
          timing.domContentLoadedEventStart - timing.navigationStart
        );
      }
      if (timing.domContentLoadedEventEnd) {
        span.setAttribute(
          "dom.content_loaded_end",
          timing.domContentLoadedEventEnd - timing.navigationStart
        );
      }
      if (timing.domComplete) {
        span.setAttribute(
          "dom.complete",
          timing.domComplete - timing.navigationStart
        );
      }
      if (timing.loadEventStart) {
        span.setAttribute(
          "load.event_start",
          timing.loadEventStart - timing.navigationStart
        );
      }
      if (timing.loadEventEnd) {
        span.setAttribute(
          "load.event_end",
          timing.loadEventEnd - timing.navigationStart
        );
      }
      if (timing.responseStart) {
        span.setAttribute(
          "response.start",
          timing.responseStart - timing.navigationStart
        );
      }
      if (timing.responseEnd) {
        span.setAttribute(
          "response.end",
          timing.responseEnd - timing.navigationStart
        );
      }
    }
  }

  // Collect resource timings for IE11
  function collectResourceTimings(span: Span): void {
    if (!_config.collectResourceTimings) {
      return;
    }

    try {
      var resources: any[] = [];

      // Try modern Resource Timing API
      if (window.performance && window.performance.getEntriesByType) {
        resources = window.performance.getEntriesByType("resource");
      }

      if (resources.length > 0) {
        var resourceCount = {
          script: 0,
          link: 0,
          img: 0,
          css: 0,
          fetch: 0,
          other: 0,
        };

        var totalDuration = 0;
        var totalSize = 0;

        for (var i = 0; i < resources.length; i++) {
          var resource = resources[i];
          var resourceType = resource.initiatorType || "other";

          // Count resources by type
          if (resourceCount.hasOwnProperty(resourceType)) {
            resourceCount[resourceType]++;
          } else {
            resourceCount.other++;
          }

          // Calculate total duration and size
          if (resource.duration) {
            totalDuration += resource.duration;
          }
          if (resource.transferSize) {
            totalSize += resource.transferSize;
          }
        }

        // Add resource timing attributes
        span.setAttribute("resource.total_count", resources.length);
        span.setAttribute("resource.script_count", resourceCount.script);
        span.setAttribute("resource.link_count", resourceCount.link);
        span.setAttribute("resource.img_count", resourceCount.img);
        span.setAttribute("resource.css_count", resourceCount.css);
        span.setAttribute("resource.fetch_count", resourceCount.fetch);
        span.setAttribute("resource.other_count", resourceCount.other);
        span.setAttribute("resource.total_duration", totalDuration);
        span.setAttribute("resource.total_size", totalSize);
      }
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Error collecting resource timings:", error);
      }
    }
  }

  // Handle DOM content loaded event
  function onDOMContentLoaded(): void {
    if (_documentLoadSpan) {
      _documentLoadSpan.addEvent("dom.content_loaded");
      addPerformanceTimings(_documentLoadSpan);
    }
  }

  // Handle window load event
  function onWindowLoad(): void {
    if (_documentLoadSpan) {
      _documentLoadSpan.addEvent("window.load");
      addPerformanceTimings(_documentLoadSpan);
      collectResourceTimings(_documentLoadSpan);

      // Set span status as successful
      _documentLoadSpan.setStatus({ code: 1 }); // OK

      // End the span
      _documentLoadSpan.end();
      _documentLoadSpan = null;
    }
  }

  // Handle page visibility change (for SPA navigation)
  function onVisibilityChange(): void {
    if (document.visibilityState === "hidden" && _documentLoadSpan) {
      _documentLoadSpan.addEvent("page.visibility_hidden");
      _documentLoadSpan.setStatus({ code: 1 }); // OK
      _documentLoadSpan.end();
      _documentLoadSpan = null;
    }
  }

  // Enable instrumentation
  instrumentation.enable = function (): void {
    if (_isInstrumented) {
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Start document load span immediately
    startDocumentLoadSpan();

    // Set up event listeners using EventListenerManager
    EventListenerManager.addEventListener(
      document,
      "DOMContentLoaded",
      onDOMContentLoaded
    );
    EventListenerManager.addEventListener(window, "load", onWindowLoad);

    // Handle visibility change for SPA scenarios
    if (typeof document.visibilityState !== "undefined") {
      EventListenerManager.addEventListener(
        document,
        "visibilitychange",
        onVisibilityChange
      );
    }

    _isInstrumented = true;
    _enabled = true;
  };

  // Disable instrumentation
  instrumentation.disable = function (): void {
    if (!_isInstrumented) {
      return;
    }

    // Remove event listeners
    EventListenerManager.removeEventListener(
      document,
      "DOMContentLoaded",
      onDOMContentLoaded
    );
    EventListenerManager.removeEventListener(window, "load", onWindowLoad);
    EventListenerManager.removeEventListener(
      document,
      "visibilitychange",
      onVisibilityChange
    );

    // End any active span
    if (_documentLoadSpan) {
      _documentLoadSpan.setStatus({ code: 1 }); // OK
      _documentLoadSpan.end();
      _documentLoadSpan = null;
    }

    _isInstrumented = false;
    _enabled = false;
  };

  // Check if enabled
  instrumentation.isEnabled = function (): boolean {
    return _enabled;
  };

  // Get current document load span
  instrumentation.getCurrentSpan = function (): Span | null {
    return _documentLoadSpan;
  };

  // Auto-enable if configured and document is not already loaded
  if (_enabled && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      instrumentation.enable();
    } else {
      // Document already loaded, create a minimal span
      EventListenerManager.whenReady(function () {
        startDocumentLoadSpan();
        if (_documentLoadSpan) {
          addPerformanceTimings(_documentLoadSpan);
          collectResourceTimings(_documentLoadSpan);
          _documentLoadSpan.setStatus({ code: 1 }); // OK
          _documentLoadSpan.end();
          _documentLoadSpan = null;
        }
      });
    }
  }

  return instrumentation;
};

DocumentLoadInstrumentation.prototype = {
  constructor: DocumentLoadInstrumentation,
};

export { DocumentLoadInstrumentation };
