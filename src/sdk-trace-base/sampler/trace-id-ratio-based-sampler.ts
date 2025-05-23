// IE11-compatible TraceIdRatioBasedSampler implementation

import {
  Sampler,
  SamplingResult,
  SamplingDecision,
  SpanKind,
  SpanAttributes,
  Link,
  Context,
} from "../types";

// Optimized trace ID ratio-based sampler for IE11
export var TraceIdRatioBasedSampler = function (ratio?: number): any {
  var sampler = this;

  // Validate and normalize ratio
  var _ratio = ratio;
  if (typeof _ratio !== "number" || _ratio < 0) {
    _ratio = 0;
  } else if (_ratio > 1) {
    _ratio = 1;
  }

  // Pre-calculate threshold for performance optimization
  var _threshold = Math.floor(_ratio * 0xffffffff);

  sampler.shouldSample = function (
    context,
    traceId,
    spanName,
    spanKind,
    attributes,
    links
  ) {
    // Fast path for always sample or never sample
    if (_ratio === 1) {
      return {
        decision: SamplingDecision.RECORD_AND_SAMPLED,
        attributes: undefined,
        traceState: undefined,
      };
    }

    if (_ratio === 0) {
      return {
        decision: SamplingDecision.NOT_RECORD,
        attributes: undefined,
        traceState: undefined,
      };
    }

    // Extract the last 8 characters (32 bits) from trace ID for sampling decision
    // This is optimized for IE11 performance
    var traceIdSuffix = traceId.slice(-8);
    var traceIdValue = parseInt(traceIdSuffix, 16);

    // Handle invalid trace ID gracefully
    if (isNaN(traceIdValue)) {
      return {
        decision: SamplingDecision.NOT_RECORD,
        attributes: undefined,
        traceState: undefined,
      };
    }

    // Compare with threshold for sampling decision
    var shouldSample = traceIdValue <= _threshold;

    return {
      decision: shouldSample
        ? SamplingDecision.RECORD_AND_SAMPLED
        : SamplingDecision.NOT_RECORD,
      attributes: undefined,
      traceState: undefined,
    };
  };

  sampler.toString = function () {
    return "TraceIdRatioBasedSampler{" + _ratio + "}";
  };

  // Getter for ratio (useful for debugging)
  sampler.getRatio = function () {
    return _ratio;
  };

  return sampler;
};

TraceIdRatioBasedSampler.prototype = {
  constructor: TraceIdRatioBasedSampler,
};

export { TraceIdRatioBasedSampler };
