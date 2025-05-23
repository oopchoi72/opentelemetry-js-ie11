// IE11-compatible Always On Sampler implementation

import {
  Sampler,
  SamplingResult,
  SamplingDecision,
  SpanKind,
  SpanAttributes,
  Link,
  Context,
} from "../types";

// Always samples (100% sampling rate)
export var AlwaysOnSampler = function (): any {
  var sampler = this;

  sampler.shouldSample = function (
    context,
    traceId,
    spanName,
    spanKind,
    attributes,
    links
  ) {
    return {
      decision: SamplingDecision.RECORD_AND_SAMPLED,
      attributes: undefined,
      traceState: undefined,
    };
  };

  sampler.toString = function () {
    return "AlwaysOnSampler";
  };

  return sampler;
};

AlwaysOnSampler.prototype = {
  constructor: AlwaysOnSampler,
};

export { AlwaysOnSampler };
