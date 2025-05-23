// IE11-compatible SpanProcessor base implementation

import { SpanProcessor, ReadableSpan, Context } from "./types";

// Base SpanProcessor for IE11
export var SpanProcessor = function (): any {
  var processor = this;

  processor.forceFlush = function () {
    return Promise.resolve();
  };

  processor.onStart = function (span, parentContext) {
    // Default implementation - do nothing
  };

  processor.onEnd = function (span) {
    // Default implementation - do nothing
  };

  processor.shutdown = function () {
    return Promise.resolve();
  };

  return processor;
};

SpanProcessor.prototype = {
  constructor: SpanProcessor,
};

export { SpanProcessor };
