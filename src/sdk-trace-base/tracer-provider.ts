// IE11-compatible TracerProvider implementation

import { TracerProvider as APITracerProvider } from "../api";
import {
  Resource,
  InstrumentationLibrary,
  Sampler,
  SpanProcessor,
  IdGenerator,
  SpanLimits,
  TracerConfig,
} from "./types";
import { Tracer } from "./tracer";
import { objectAssign, createSimpleMap } from "./util";
import { getDefaultResource } from "../core";

// IE11-compatible TracerProvider implementation
export var TracerProvider = function (config?: TracerConfig): any {
  var provider = this;

  // Private properties using IE11-compatible patterns
  var _resource = (config && config.resource) || getDefaultResource();
  var _sampler = (config && config.sampler) || null;
  var _spanProcessors = [];
  var _idGenerator = (config && config.idGenerator) || null;
  var _spanLimits = (config && config.spanLimits) || {
    attributeValueLengthLimit: 200,
    attributeCountLimit: 128,
    linkCountLimit: 128,
    eventCountLimit: 128,
    attributePerEventCountLimit: 128,
    attributePerLinkCountLimit: 128,
  };
  var _tracers = createSimpleMap();
  var _isShutdown = false;

  // Implement APITracerProvider interface
  provider.getTracer = function (name, version, options) {
    if (_isShutdown) {
      // Return a no-op tracer when shut down
      return createNoOpTracer();
    }

    var instrumentationLibrary = {
      name: name || "unknown",
      version: version || undefined,
      schemaUrl: (options && options.schemaUrl) || undefined,
    };

    var key =
      instrumentationLibrary.name +
      "@" +
      (instrumentationLibrary.version || "latest");
    var existingTracer = _tracers.get(key);

    if (existingTracer) {
      return existingTracer;
    }

    // Create new tracer with current configuration
    var tracerConfig = {
      resource: _resource,
      sampler: _sampler,
      spanProcessor: createCompositeSpanProcessor(_spanProcessors),
      idGenerator: _idGenerator,
      spanLimits: _spanLimits,
    };

    var tracer = new Tracer(instrumentationLibrary, tracerConfig);
    _tracers.set(key, tracer);

    return tracer;
  };

  // SDK-specific methods
  provider.addSpanProcessor = function (spanProcessor) {
    if (!_isShutdown) {
      _spanProcessors.push(spanProcessor);
    }
  };

  provider.getActiveSpanProcessor = function () {
    return createCompositeSpanProcessor(_spanProcessors);
  };

  provider.getResource = function () {
    return _resource;
  };

  provider.shutdown = function () {
    if (_isShutdown) {
      return Promise.resolve();
    }

    _isShutdown = true;

    // Shutdown all span processors
    var shutdownPromises = [];
    for (var i = 0; i < _spanProcessors.length; i++) {
      var processor = _spanProcessors[i];
      if (processor && typeof processor.shutdown === "function") {
        shutdownPromises.push(processor.shutdown());
      }
    }

    return Promise.all(shutdownPromises).then(function () {
      // Clear resources
      _tracers.clear();
      _spanProcessors.length = 0;
    });
  };

  provider.forceFlush = function () {
    if (_isShutdown) {
      return Promise.resolve();
    }

    // Force flush all span processors
    var flushPromises = [];
    for (var i = 0; i < _spanProcessors.length; i++) {
      var processor = _spanProcessors[i];
      if (processor && typeof processor.forceFlush === "function") {
        flushPromises.push(processor.forceFlush());
      }
    }

    return Promise.all(flushPromises);
  };

  return provider;
};

// Create a composite span processor that delegates to multiple processors
function createCompositeSpanProcessor(processors) {
  return {
    onStart: function (span, parentContext) {
      for (var i = 0; i < processors.length; i++) {
        var processor = processors[i];
        if (processor && typeof processor.onStart === "function") {
          processor.onStart(span, parentContext);
        }
      }
    },

    onEnd: function (span) {
      for (var i = 0; i < processors.length; i++) {
        var processor = processors[i];
        if (processor && typeof processor.onEnd === "function") {
          processor.onEnd(span);
        }
      }
    },

    forceFlush: function () {
      var flushPromises = [];
      for (var i = 0; i < processors.length; i++) {
        var processor = processors[i];
        if (processor && typeof processor.forceFlush === "function") {
          flushPromises.push(processor.forceFlush());
        }
      }
      return Promise.all(flushPromises);
    },

    shutdown: function () {
      var shutdownPromises = [];
      for (var i = 0; i < processors.length; i++) {
        var processor = processors[i];
        if (processor && typeof processor.shutdown === "function") {
          shutdownPromises.push(processor.shutdown());
        }
      }
      return Promise.all(shutdownPromises);
    },
  };
}

// Create a no-op tracer for when provider is shut down
function createNoOpTracer() {
  return {
    startSpan: function (name, options) {
      return createNoOpSpan();
    },

    startActiveSpan: function (name, optionsOrFn, fn, parentContext) {
      var callback = typeof optionsOrFn === "function" ? optionsOrFn : fn;
      if (typeof callback === "function") {
        return callback(createNoOpSpan());
      }
      return undefined;
    },

    getInstrumentationLibrary: function () {
      return { name: "noop" };
    },

    getResource: function () {
      return { attributes: {} };
    },
  };
}

// Create a no-op span
function createNoOpSpan() {
  return {
    spanContext: function () {
      return {
        traceId: "00000000000000000000000000000000",
        spanId: "0000000000000000",
        traceFlags: 0,
      };
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
      // No-op
    },

    isRecording: function () {
      return false;
    },

    recordException: function (exception, time) {
      return this;
    },
  };
}

TracerProvider.prototype = {
  constructor: TracerProvider,
};

export { TracerProvider };
