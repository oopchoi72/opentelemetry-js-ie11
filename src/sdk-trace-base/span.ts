// IE11-compatible Span implementation for OpenTelemetry SDK

import { Span as APISpan, SpanContext, SpanStatus } from "../api";
import {
  SpanAttributes,
  SpanKind,
  Link,
  TimedEvent,
  ReadableSpan,
  SpanStatusWithCode,
  Resource,
  InstrumentationLibrary,
  Context,
  Exception,
} from "./types";
import { hrTime, hrTimeToNanoseconds, sanitizeAttributes } from "../core";
import { objectAssign } from "./util";

// IE11-compatible Span implementation with enhanced management
export var Span = function (
  parentTracer: any,
  context: SpanContext,
  spanName: string,
  spanKind?: SpanKind,
  parentSpanId?: string,
  links?: Link[],
  startTime?: number,
  resource?: Resource,
  instrumentationLibrary?: InstrumentationLibrary,
  spanLimits?: any
): any {
  var span = this;

  // Private properties with enhanced management
  var _name = spanName;
  var _kind = spanKind || SpanKind.INTERNAL;
  var _spanContext = context;
  var _parentSpanId = parentSpanId;
  var _links = links || [];
  var _events = [];
  var _attributes = {};
  var _status = { code: 0, message: "" };
  var _startTime = startTime || hrTime();
  var _endTime;
  var _ended = false;
  var _resource = resource || { attributes: {} };
  var _instrumentationLibrary = instrumentationLibrary || { name: "unknown" };
  var _spanLimits = spanLimits || {
    attributeValueLengthLimit: 200,
    attributeCountLimit: 128,
    linkCountLimit: 128,
    eventCountLimit: 128,
    attributePerEventCountLimit: 128,
    attributePerLinkCountLimit: 128,
  };

  // Enhanced span management state
  var _droppedAttributesCount = 0;
  var _droppedEventsCount = 0;
  var _droppedLinksCount = 0;

  // Implement APISpan interface methods
  span.spanContext = function () {
    return _spanContext;
  };

  span.setAttribute = function (key, value) {
    if (!_ended && typeof key === "string" && key.length > 0) {
      // Apply span limits with enhanced management
      var currentAttributeCount = Object.keys(_attributes).length;
      if (currentAttributeCount >= _spanLimits.attributeCountLimit) {
        _droppedAttributesCount++;
        return span;
      }

      // Sanitize and limit attribute value
      var sanitizedValue = value;
      if (
        typeof value === "string" &&
        value.length > _spanLimits.attributeValueLengthLimit
      ) {
        sanitizedValue = value.substring(
          0,
          _spanLimits.attributeValueLengthLimit
        );
      }

      _attributes[key] = sanitizedValue;
    }
    return span;
  };

  span.setAttributes = function (attributes) {
    if (!_ended && attributes && typeof attributes === "object") {
      for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          span.setAttribute(key, attributes[key]);
        }
      }
    }
    return span;
  };

  span.addEvent = function (name, attributesOrTimeStamp, timeStamp) {
    if (_ended) {
      return span;
    }

    var eventAttributes = {};
    var eventTime = hrTime();

    // Handle overloaded parameters
    if (typeof attributesOrTimeStamp === "number") {
      eventTime = attributesOrTimeStamp;
    } else if (
      typeof attributesOrTimeStamp === "object" &&
      attributesOrTimeStamp !== null
    ) {
      eventAttributes = attributesOrTimeStamp;
      if (typeof timeStamp === "number") {
        eventTime = timeStamp;
      }
    }

    // Apply event limits with enhanced management
    if (_events.length >= _spanLimits.eventCountLimit) {
      _droppedEventsCount++;
      return span;
    }

    // Apply attribute limits for events
    var limitedAttributes = {};
    var attributeCount = 0;
    for (var key in eventAttributes) {
      if (Object.prototype.hasOwnProperty.call(eventAttributes, key)) {
        if (attributeCount >= _spanLimits.attributePerEventCountLimit) {
          break;
        }

        var value = eventAttributes[key];
        if (
          typeof value === "string" &&
          value.length > _spanLimits.attributeValueLengthLimit
        ) {
          value = value.substring(0, _spanLimits.attributeValueLengthLimit);
        }

        limitedAttributes[key] = value;
        attributeCount++;
      }
    }

    _events.push({
      time: eventTime,
      name: name,
      attributes: limitedAttributes,
    });

    return span;
  };

  span.setStatus = function (status) {
    if (!_ended) {
      _status = {
        code: status.code || 0,
        message: status.message || "",
      };
    }
    return span;
  };

  span.updateName = function (name) {
    if (!_ended && typeof name === "string") {
      _name = name;
    }
    return span;
  };

  span.end = function (endTime) {
    if (_ended) {
      return;
    }

    _ended = true;
    _endTime = endTime || hrTime();

    // Notify span processor if available
    if (parentTracer && parentTracer._spanProcessor) {
      parentTracer._spanProcessor.onEnd(span);
    }
  };

  span.isRecording = function () {
    return !_ended;
  };

  // Enhanced exception recording
  span.recordException = function (exception, time) {
    if (_ended) {
      return span;
    }

    var exceptionAttributes = {};
    if (exception && typeof exception === "object") {
      if (exception.name) {
        exceptionAttributes["exception.type"] = exception.name;
      }
      if (exception.message) {
        exceptionAttributes["exception.message"] = exception.message;
      }
      if (exception.stack) {
        exceptionAttributes["exception.stacktrace"] = exception.stack;
      }
    } else if (typeof exception === "string") {
      exceptionAttributes["exception.message"] = exception;
    }

    span.addEvent("exception", exceptionAttributes, time);
    return span;
  };

  // ReadableSpan interface implementation
  Object.defineProperty(span, "name", {
    get: function () {
      return _name;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "kind", {
    get: function () {
      return _kind;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "parentSpanId", {
    get: function () {
      return _parentSpanId;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "startTime", {
    get: function () {
      return _startTime;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "endTime", {
    get: function () {
      return _endTime;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "status", {
    get: function () {
      return _status;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "attributes", {
    get: function () {
      return objectAssign({}, _attributes);
    },
    enumerable: true,
  });

  Object.defineProperty(span, "links", {
    get: function () {
      return _links.slice();
    },
    enumerable: true,
  });

  Object.defineProperty(span, "events", {
    get: function () {
      return _events.slice();
    },
    enumerable: true,
  });

  Object.defineProperty(span, "duration", {
    get: function () {
      if (_endTime && _startTime) {
        return hrTimeToNanoseconds(_endTime) - hrTimeToNanoseconds(_startTime);
      }
      return undefined;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "ended", {
    get: function () {
      return _ended;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "resource", {
    get: function () {
      return _resource;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "instrumentationLibrary", {
    get: function () {
      return _instrumentationLibrary;
    },
    enumerable: true,
  });

  // Enhanced management properties
  Object.defineProperty(span, "droppedAttributesCount", {
    get: function () {
      return _droppedAttributesCount;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "droppedEventsCount", {
    get: function () {
      return _droppedEventsCount;
    },
    enumerable: true,
  });

  Object.defineProperty(span, "droppedLinksCount", {
    get: function () {
      return _droppedLinksCount;
    },
    enumerable: true,
  });

  // Enhanced span management methods
  span.getSpanLimits = function () {
    return objectAssign({}, _spanLimits);
  };

  span.getDroppedCounts = function () {
    return {
      attributes: _droppedAttributesCount,
      events: _droppedEventsCount,
      links: _droppedLinksCount,
    };
  };

  // Span validation for debugging
  span.isValid = function () {
    return (
      _spanContext &&
      _spanContext.traceId &&
      _spanContext.spanId &&
      _spanContext.traceId.length === 32 &&
      _spanContext.spanId.length === 16
    );
  };

  // Enhanced toString for debugging
  span.toString = function () {
    return (
      "Span{" +
      "name=" +
      _name +
      ", traceId=" +
      _spanContext.traceId +
      ", spanId=" +
      _spanContext.spanId +
      ", kind=" +
      _kind +
      ", ended=" +
      _ended +
      "}"
    );
  };

  return span;
};

// IE11-compatible static methods
Span.prototype = {
  constructor: Span,
};

// Export the constructor function
export { Span };
