// IE11-compatible SpanExporter interface and base implementation

import {
  SpanExporter,
  ReadableSpan,
  ExportResult,
  ExportResultCode,
} from "../types";

// Base SpanExporter implementation for IE11
export var BaseSpanExporter = function (): any {
  var exporter = this;

  exporter.export = function (spans, resultCallback) {
    // Default implementation - should be overridden
    resultCallback({
      code: ExportResultCode.SUCCESS,
    });
  };

  exporter.shutdown = function () {
    return Promise.resolve();
  };

  return exporter;
};

BaseSpanExporter.prototype = {
  constructor: BaseSpanExporter,
};

// Console exporter for debugging in IE11
export var ConsoleSpanExporter = function (): any {
  var exporter = this;

  exporter.export = function (spans, resultCallback) {
    try {
      if (typeof console !== "undefined" && console.log) {
        for (var i = 0; i < spans.length; i++) {
          var span = spans[i];
          console.log("Span:", {
            name: span.name,
            traceId: span.spanContext.traceId,
            spanId: span.spanContext.spanId,
            duration: span.duration,
            status: span.status,
            attributes: span.attributes,
          });
        }
      }

      resultCallback({
        code: ExportResultCode.SUCCESS,
      });
    } catch (error) {
      resultCallback({
        code: ExportResultCode.FAILED,
        error: error,
      });
    }
  };

  exporter.shutdown = function () {
    return Promise.resolve();
  };

  return exporter;
};

ConsoleSpanExporter.prototype = {
  constructor: ConsoleSpanExporter,
};

// Re-export types
export { SpanExporter, ExportResult, ExportResultCode } from "../types";
