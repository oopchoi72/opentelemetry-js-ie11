// OpenTelemetry SDK Trace Base for IE11
// This module provides the core tracing SDK functionality compatible with IE11

// Core components
export { Span } from "./span";
export { Tracer } from "./tracer";
export { TracerProvider } from "./tracer-provider";

// Span processors
export { SpanProcessor } from "./span-processor";
export { BatchSpanProcessor } from "./batch-span-processor";
export { SimpleSpanProcessor } from "./simple-span-processor";

// Samplers
export { BaseSampler } from "./sampler";
export { AlwaysOnSampler } from "./sampler/always-on-sampler";
export { AlwaysOffSampler } from "./sampler/always-off-sampler";
export { TraceIdRatioBasedSampler } from "./sampler/trace-id-ratio-based-sampler";

// Export interfaces
export { ReadableSpan } from "./export/readable-span";
export {
  SpanExporter,
  BaseSpanExporter,
  ConsoleSpanExporter,
} from "./export/span-exporter";

// Context management
export {
  ContextManager,
  SpanContextUtils,
  TraceContextPropagation,
  context,
} from "./context";

// Span management
export { SpanBuilder, SpanManager } from "./span-builder";

// Utilities
export {
  objectAssign,
  arrayFind,
  arrayIncludes,
  createSimpleMap,
  createSimpleSet,
} from "./util";

// Types
export * from "./types";
