// IE11-compatible Context Propagation for OpenTelemetry SDK

import { SpanContext } from "../api";
import { Context, SPAN_CONTEXT_KEY, ACTIVE_SPAN_KEY } from "./types";
import { createSimpleMap } from "./util";

// IE11-compatible context implementation
export var ContextManager = function (): any {
  var manager = this;
  var _contextStack = [];
  var _activeContext = createRootContext();

  // Create root context
  function createRootContext() {
    return createSimpleMap();
  }

  // Create new context with key-value pair
  manager.setValue = function (context, key, value) {
    var newContext = createSimpleMap();

    // Copy existing context
    if (context) {
      var entries = context.entries();
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        newContext.set(entry[0], entry[1]);
      }
    }

    // Set new value
    newContext.set(key, value);
    return newContext;
  };

  // Get value from context
  manager.getValue = function (context, key) {
    if (!context) {
      return undefined;
    }
    return context.get(key);
  };

  // Get active context
  manager.active = function () {
    return _activeContext;
  };

  // Execute function with context
  manager.with = function (context, fn) {
    var previousContext = _activeContext;
    _activeContext = context || createRootContext();

    try {
      return fn();
    } finally {
      _activeContext = previousContext;
    }
  };

  // Bind function to context
  manager.bind = function (context, target) {
    var boundContext = context || _activeContext;

    if (typeof target === "function") {
      return function () {
        return manager.with(boundContext, function () {
          return target.apply(this, arguments);
        });
      };
    }

    return target;
  };

  return manager;
};

// Global context manager instance
var globalContextManager = new ContextManager();

// Context utilities for span management
export var SpanContextUtils = {
  // Set span context in context
  setSpanContext: function (context, spanContext) {
    return globalContextManager.setValue(
      context,
      SPAN_CONTEXT_KEY,
      spanContext
    );
  },

  // Get span context from context
  getSpanContext: function (context) {
    return globalContextManager.getValue(context, SPAN_CONTEXT_KEY);
  },

  // Set active span in context
  setActiveSpan: function (context, span) {
    return globalContextManager.setValue(context, ACTIVE_SPAN_KEY, span);
  },

  // Get active span from context
  getActiveSpan: function (context) {
    return globalContextManager.getValue(context, ACTIVE_SPAN_KEY);
  },

  // Create context with span
  setSpan: function (context, span) {
    var contextWithSpan = SpanContextUtils.setActiveSpan(context, span);
    if (span && typeof span.spanContext === "function") {
      contextWithSpan = SpanContextUtils.setSpanContext(
        contextWithSpan,
        span.spanContext()
      );
    }
    return contextWithSpan;
  },

  // Get span from context (active span or create from span context)
  getSpan: function (context) {
    var activeSpan = SpanContextUtils.getActiveSpan(context);
    if (activeSpan) {
      return activeSpan;
    }

    // If no active span, create a non-recording span from span context
    var spanContext = SpanContextUtils.getSpanContext(context);
    if (spanContext) {
      return createNonRecordingSpan(spanContext);
    }

    return undefined;
  },
};

// Create a non-recording span for context propagation
function createNonRecordingSpan(spanContext) {
  return {
    spanContext: function () {
      return spanContext;
    },

    setAttribute: function (key, value) {
      return this;
    },

    setAttributes: function (attributes) {
      return this;
    },

    addEvent: function (name, attributes, time) {
      return this;
    },

    setStatus: function (status) {
      return this;
    },

    updateName: function (name) {
      return this;
    },

    end: function (endTime) {
      // Non-recording span does nothing
    },

    isRecording: function () {
      return false;
    },

    recordException: function (exception, time) {
      return this;
    },
  };
}

// Trace context propagation utilities
export var TraceContextPropagation = {
  // Extract trace context from headers (W3C Trace Context format)
  extract: function (headers) {
    if (!headers || typeof headers !== "object") {
      return globalContextManager.active();
    }

    var traceparent = headers["traceparent"] || headers["Traceparent"];
    if (!traceparent || typeof traceparent !== "string") {
      return globalContextManager.active();
    }

    // Parse W3C traceparent header: version-traceId-spanId-flags
    var parts = traceparent.split("-");
    if (parts.length !== 4) {
      return globalContextManager.active();
    }

    var version = parts[0];
    var traceId = parts[1];
    var spanId = parts[2];
    var flags = parseInt(parts[3], 16);

    // Validate format
    if (version !== "00" || traceId.length !== 32 || spanId.length !== 16) {
      return globalContextManager.active();
    }

    var spanContext = {
      traceId: traceId,
      spanId: spanId,
      traceFlags: flags || 0,
    };

    var context = globalContextManager.active();
    return SpanContextUtils.setSpanContext(context, spanContext);
  },

  // Inject trace context into headers
  inject: function (context, headers) {
    if (!headers || typeof headers !== "object") {
      return;
    }

    var spanContext = SpanContextUtils.getSpanContext(context);
    if (!spanContext) {
      return;
    }

    // Create W3C traceparent header
    var traceparent =
      "00-" +
      spanContext.traceId +
      "-" +
      spanContext.spanId +
      "-" +
      (spanContext.traceFlags || 0).toString(16).padStart(2, "0");

    headers["traceparent"] = traceparent;

    // Add tracestate if available
    if (
      spanContext.traceState &&
      typeof spanContext.traceState.serialize === "function"
    ) {
      var tracestate = spanContext.traceState.serialize();
      if (tracestate) {
        headers["tracestate"] = tracestate;
      }
    }
  },
};

// Export context manager and utilities
export { globalContextManager as context };
export { ContextManager };
