// IE11-compatible Sampler implementations

import {
  Sampler,
  SamplingResult,
  SamplingDecision,
  SpanKind,
  SpanAttributes,
  Link,
  Context,
} from "./types";

// Base Sampler for IE11
export var BaseSampler = function (): any {
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
      attributes: {},
    };
  };

  sampler.toString = function () {
    return "BaseSampler";
  };

  return sampler;
};

BaseSampler.prototype = {
  constructor: BaseSampler,
};

export { BaseSampler };
