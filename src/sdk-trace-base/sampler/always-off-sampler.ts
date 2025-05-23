// IE11-compatible Always Off Sampler implementation

import {
  Sampler,
  SamplingResult,
  SamplingDecision,
  SpanKind,
  SpanAttributes,
  Link,
  Context,
} from "../types";

// Never samples (0% sampling rate)
export var AlwaysOffSampler = function (): any {
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
      decision: SamplingDecision.NOT_RECORD,
      attributes: undefined,
      traceState: undefined,
    };
  };

  sampler.toString = function () {
    return "AlwaysOffSampler";
  };

  return sampler;
};

AlwaysOffSampler.prototype = {
  constructor: AlwaysOffSampler,
};

export { AlwaysOffSampler };
