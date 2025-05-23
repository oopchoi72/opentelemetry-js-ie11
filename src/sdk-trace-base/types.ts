// Types and interfaces for OpenTelemetry SDK Trace Base (IE11 compatible)

import {
  Span,
  SpanContext,
  SpanStatus,
  Tracer,
  TracerProvider,
  TraceState,
} from "../api";

// Additional types needed for SDK implementation
export type SpanAttributeValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;
export type SpanAttributes = Record<string, SpanAttributeValue>;
export type TimeInput = number;
export type Context = any; // Simple context type for IE11

// Span Kind enum-like object for IE11 compatibility
export var SpanKind = {
  INTERNAL: 0,
  SERVER: 1,
  CLIENT: 2,
  PRODUCER: 3,
  CONSUMER: 4,
} as const;

export type SpanKind = (typeof SpanKind)[keyof typeof SpanKind];

// Link interface
export interface Link {
  context: SpanContext;
  attributes?: SpanAttributes;
}

// Exception interface
export interface Exception {
  name?: string;
  message?: string;
  stack?: string;
}

// Span Status with code
export interface SpanStatusWithCode extends SpanStatus {
  code: number;
}

// Readable Span interface
export interface ReadableSpan {
  readonly name: string;
  readonly kind: SpanKind;
  readonly spanContext: SpanContext;
  readonly parentSpanId?: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly status: SpanStatusWithCode;
  readonly attributes: SpanAttributes;
  readonly links: Link[];
  readonly events: TimedEvent[];
  readonly duration: number;
  readonly ended: boolean;
  readonly resource: Resource;
  readonly instrumentationLibrary: InstrumentationLibrary;
}

// Timed Event
export interface TimedEvent {
  time: number;
  name: string;
  attributes?: SpanAttributes;
}

// Resource
export interface Resource {
  attributes: SpanAttributes;
  asyncAttributesPending?: boolean;
  waitForAsyncAttributes?(): Promise<Resource>;
  merge(other: Resource): Resource;
}

// Instrumentation Library
export interface InstrumentationLibrary {
  name: string;
  version?: string;
  schemaUrl?: string;
}

// Sampling Result
export interface SamplingResult {
  decision: SamplingDecision;
  attributes?: SpanAttributes;
  traceState?: TraceState;
}

// Sampling Decision enum-like object
export var SamplingDecision = {
  NOT_RECORD: 0,
  RECORD: 1,
  RECORD_AND_SAMPLED: 2,
} as const;

export type SamplingDecision =
  (typeof SamplingDecision)[keyof typeof SamplingDecision];

// Sampler interface
export interface Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[]
  ): SamplingResult;
  toString(): string;
}

// Span Processor interface
export interface SpanProcessor {
  forceFlush(): Promise<void>;
  onStart(span: ReadableSpan, parentContext: Context): void;
  onEnd(span: ReadableSpan): void;
  shutdown(): Promise<void>;
}

// Span Exporter interface
export interface SpanExporter {
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void;
  shutdown(): Promise<void>;
}

// Export Result
export interface ExportResult {
  code: ExportResultCode;
  error?: Error;
}

// Export Result Code enum-like object
export var ExportResultCode = {
  SUCCESS: 0,
  FAILED: 1,
  TIMEOUT: 2,
} as const;

export type ExportResultCode =
  (typeof ExportResultCode)[keyof typeof ExportResultCode];

// Tracer Config
export interface TracerConfig {
  resource?: Resource;
  sampler?: Sampler;
  spanLimits?: SpanLimits;
  idGenerator?: IdGenerator;
}

// Span Limits
export interface SpanLimits {
  attributeValueLengthLimit?: number;
  attributeCountLimit?: number;
  linkCountLimit?: number;
  eventCountLimit?: number;
  attributePerEventCountLimit?: number;
  attributePerLinkCountLimit?: number;
}

// ID Generator
export interface IdGenerator {
  generateTraceId(): string;
  generateSpanId(): string;
}

// Span Exporter Config
export interface SpanExporterConfig {
  url?: string;
  headers?: { [key: string]: string };
  concurrencyLimit?: number;
  timeoutMillis?: number;
}

// Batch Span Processor Config
export interface BatchSpanProcessorConfig {
  maxExportBatchSize?: number;
  scheduledDelayMillis?: number;
  exportTimeoutMillis?: number;
  maxQueueSize?: number;
}

// Context Keys for IE11 compatibility
export var SPAN_CONTEXT_KEY = "opentelemetry.span_context";
export var ACTIVE_SPAN_KEY = "opentelemetry.active_span";
