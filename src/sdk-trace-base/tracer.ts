// IE11-compatible Tracer implementation for OpenTelemetry SDK

import { Tracer as APITracer, SpanContext } from "../api";
import {
  SpanKind,
  SpanAttributes,
  Link,
  Context,
  Sampler,
  SpanProcessor,
  Resource,
  InstrumentationLibrary,
  IdGenerator,
  SpanLimits,
} from "./types";
import { Span } from "./span";
import { generateTraceId, generateSpanId } from "../core";

// IE11-compatible Tracer implementation
export var Tracer = function (
  instrumentationLibrary: InstrumentationLibrary,
  config?: any
): any {
  var tracer = this;

  // Private properties
  var _instrumentationLibrary = instrumentationLibrary;
  var _resource = (config && config.resource) || { attributes: {} };
  var _sampler = (config && config.sampler) || null;
  var _spanProcessor = (config && config.spanProcessor) || null;
  var _idGenerator = (config && config.idGenerator) || {
    generateTraceId: generateTraceId,
    generateSpanId: generateSpanId,
  };
  var _spanLimits = (config && config.spanLimits) || {
    attributeValueLengthLimit: 200,
    attributeCountLimit: 128,
    linkCountLimit: 128,
    eventCountLimit: 128,
    attributePerEventCountLimit: 128,
    attributePerLinkCountLimit: 128,
  };

  // Implement APITracer interface
  tracer.startSpan = function (name, options) {
    options = options || {};

    // Generate span context
    var traceId = options.traceId || _idGenerator.generateTraceId();
    var spanId = _idGenerator.generateSpanId();
    var traceFlags = options.traceFlags || 1; // Sampled by default

    var spanContext = {
      traceId: traceId,
      spanId: spanId,
      traceFlags: traceFlags,
      traceState: options.traceState,
    };

    // Create span
    var span = new Span(
      tracer,
      spanContext,
      name,
      options.kind || SpanKind.INTERNAL,
      options.parentSpanId,
      options.links,
      options.startTime,
      _resource,
      _instrumentationLibrary,
      _spanLimits
    );

    // Set initial attributes
    if (options.attributes) {
      span.setAttributes(options.attributes);
    }

    // Notify span processor
    if (_spanProcessor) {
      _spanProcessor.onStart(span, options.parent || null);
    }

    return span;
  };

  tracer.startActiveSpan = function (name, optionsOrFn, fn, parentContext) {
    var options = {};
    var callback = fn;

    // Handle overloaded parameters
    if (typeof optionsOrFn === "function") {
      callback = optionsOrFn;
    } else if (typeof optionsOrFn === "object" && optionsOrFn !== null) {
      options = optionsOrFn;
    }

    if (typeof callback !== "function") {
      throw new Error("Callback function is required");
    }

    // Start the span
    var span = tracer.startSpan(name, options);

    // Execute callback with the span
    var result;
    try {
      result = callback(span);
    } catch (error) {
      // Record exception and end span
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message || "Unknown error" });
      span.end();
      throw error;
    }

    // Handle Promise result
    if (result && typeof result.then === "function") {
      return result.then(
        function (value) {
          span.end();
          return value;
        },
        function (error) {
          span.recordException(error);
          span.setStatus({
            code: 2,
            message: error.message || "Unknown error",
          });
          span.end();
          throw error;
        }
      );
    }

    // Synchronous result
    span.end();
    return result;
  };

  // SDK-specific methods
  tracer.getInstrumentationLibrary = function () {
    return _instrumentationLibrary;
  };

  tracer.getResource = function () {
    return _resource;
  };

  tracer.getSampler = function () {
    return _sampler;
  };

  tracer.getSpanProcessor = function () {
    return _spanProcessor;
  };

  tracer.getIdGenerator = function () {
    return _idGenerator;
  };

  tracer.getSpanLimits = function () {
    return _spanLimits;
  };

  // Internal properties for span access
  tracer._spanProcessor = _spanProcessor;
  tracer._sampler = _sampler;

  return tracer;
};

// IE11-compatible prototype
Tracer.prototype = {
  constructor: Tracer,
};

export { Tracer };
