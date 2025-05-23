// IE11-compatible SpanBuilder for enhanced span management

import { SpanKind, SpanAttributes, Link, Context } from "./types";
import { Span } from "./span";
import { generateSpanId } from "../core";
import { objectAssign } from "./util";

// SpanBuilder for fluent span creation
export var SpanBuilder = function (
  tracer: any,
  spanName: string,
  spanContext: any
): any {
  var builder = this;

  // Private properties
  var _tracer = tracer;
  var _spanName = spanName;
  var _spanContext = spanContext;
  var _spanKind = SpanKind.INTERNAL;
  var _attributes = {};
  var _links = [];
  var _parent = undefined;
  var _startTime = undefined;

  // Set span kind
  builder.setSpanKind = function (spanKind) {
    _spanKind = spanKind;
    return builder;
  };

  // Set parent span or context
  builder.setParent = function (parent) {
    _parent = parent;
    return builder;
  };

  // Add attribute
  builder.setAttribute = function (key, value) {
    if (typeof key === "string" && key.length > 0) {
      _attributes[key] = value;
    }
    return builder;
  };

  // Add multiple attributes
  builder.setAttributes = function (attributes) {
    if (attributes && typeof attributes === "object") {
      for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          _attributes[key] = attributes[key];
        }
      }
    }
    return builder;
  };

  // Add link to another span
  builder.addLink = function (spanContext, attributes) {
    var link = {
      context: spanContext,
      attributes: attributes || {},
    };
    _links.push(link);
    return builder;
  };

  // Set start time
  builder.setStartTime = function (startTime) {
    _startTime = startTime;
    return builder;
  };

  // Start the span
  builder.start = function (context) {
    // Determine parent span ID
    var parentSpanId = undefined;
    if (_parent) {
      if (typeof _parent.spanContext === "function") {
        var parentContext = _parent.spanContext();
        if (parentContext && parentContext.spanId) {
          parentSpanId = parentContext.spanId;
        }
      } else if (_parent.spanId) {
        parentSpanId = _parent.spanId;
      }
    }

    // Create span with enhanced management
    var span = new Span(
      _tracer,
      _spanContext,
      _spanName,
      _spanKind,
      parentSpanId,
      _links.slice(), // Copy links
      _startTime,
      _tracer._resource,
      _tracer._instrumentationLibrary,
      _tracer._spanLimits
    );

    // Set initial attributes
    span.setAttributes(_attributes);

    // Notify span processor
    if (_tracer._spanProcessor) {
      _tracer._spanProcessor.onStart(span, context);
    }

    return span;
  };

  return builder;
};

SpanBuilder.prototype = {
  constructor: SpanBuilder,
};

// Span management utilities
export var SpanManager = {
  // Create span builder
  createSpanBuilder: function (tracer, spanName, spanContext) {
    return new SpanBuilder(tracer, spanName, spanContext);
  },

  // Create child span from parent
  createChildSpan: function (parent, tracer, spanName, spanKind) {
    var parentContext = parent.spanContext();
    var childSpanId = generateSpanId();

    var childSpanContext = {
      traceId: parentContext.traceId,
      spanId: childSpanId,
      traceFlags: parentContext.traceFlags,
      traceState: parentContext.traceState,
    };

    return SpanManager.createSpanBuilder(tracer, spanName, childSpanContext)
      .setSpanKind(spanKind || SpanKind.INTERNAL)
      .setParent(parent);
  },

  // Validate span hierarchy
  validateSpanHierarchy: function (spans) {
    var traceMap = {};
    var errors = [];

    // Build trace map
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      var context = span.spanContext();

      if (!traceMap[context.traceId]) {
        traceMap[context.traceId] = {};
      }

      traceMap[context.traceId][context.spanId] = {
        span: span,
        parentSpanId: span.parentSpanId,
      };
    }

    // Validate hierarchy
    for (var traceId in traceMap) {
      if (Object.prototype.hasOwnProperty.call(traceMap, traceId)) {
        var trace = traceMap[traceId];

        for (var spanId in trace) {
          if (Object.prototype.hasOwnProperty.call(trace, spanId)) {
            var spanInfo = trace[spanId];

            if (spanInfo.parentSpanId && !trace[spanInfo.parentSpanId]) {
              errors.push({
                type: "missing_parent",
                spanId: spanId,
                parentSpanId: spanInfo.parentSpanId,
                traceId: traceId,
              });
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      traceCount: Object.keys(traceMap).length,
    };
  },

  // Get span statistics
  getSpanStatistics: function (spans) {
    var stats = {
      total: spans.length,
      byKind: {},
      byStatus: {},
      avgDuration: 0,
      totalDuration: 0,
      droppedCounts: {
        attributes: 0,
        events: 0,
        links: 0,
      },
    };

    var totalDuration = 0;
    var durationCount = 0;

    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];

      // Count by kind
      var kind = span.kind || SpanKind.INTERNAL;
      stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;

      // Count by status
      var statusCode = span.status ? span.status.code : 0;
      stats.byStatus[statusCode] = (stats.byStatus[statusCode] || 0) + 1;

      // Calculate duration
      if (span.duration !== undefined) {
        totalDuration += span.duration;
        durationCount++;
      }

      // Aggregate dropped counts
      if (typeof span.getDroppedCounts === "function") {
        var dropped = span.getDroppedCounts();
        stats.droppedCounts.attributes += dropped.attributes;
        stats.droppedCounts.events += dropped.events;
        stats.droppedCounts.links += dropped.links;
      }
    }

    stats.totalDuration = totalDuration;
    stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  },
};

export { SpanBuilder, SpanManager };
