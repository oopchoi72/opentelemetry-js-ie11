// IE11-compatible SimpleSpanProcessor implementation

import { SpanProcessor, ReadableSpan, Context, SpanExporter } from "./types";

// Simple span processor that exports spans immediately
export var SimpleSpanProcessor = function (exporter: SpanExporter): any {
  var processor = this;
  var _exporter = exporter;
  var _isShutdown = false;

  processor.forceFlush = function () {
    return Promise.resolve();
  };

  processor.onStart = function (span, parentContext) {
    // Simple processor doesn't need to do anything on start
  };

  processor.onEnd = function (span) {
    if (_isShutdown || !_exporter) {
      return;
    }

    // Export span immediately
    _exporter.export([span], function (result) {
      // Handle export result if needed
      if (result.error) {
        // Log error in IE11-compatible way
        if (typeof console !== "undefined" && console.error) {
          console.error("Failed to export span:", result.error);
        }
      }
    });
  };

  processor.shutdown = function () {
    if (_isShutdown) {
      return Promise.resolve();
    }

    _isShutdown = true;

    if (_exporter && typeof _exporter.shutdown === "function") {
      return _exporter.shutdown();
    }

    return Promise.resolve();
  };

  return processor;
};

SimpleSpanProcessor.prototype = {
  constructor: SimpleSpanProcessor,
};

export { SimpleSpanProcessor };
