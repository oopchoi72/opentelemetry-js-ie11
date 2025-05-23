// OpenTelemetry API for IE11
// This file will export the IE11-compatible OpenTelemetry API

// IE11-safe timing helper
function getNow(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now ? Date.now() : new Date().getTime();
}

// IE11-safe console helper
function safeConsoleLog(...args: any[]): void {
  if (typeof console !== "undefined" && console.log) {
    try {
      console.log.apply(console, args);
    } catch (e) {
      // Fallback for IE11 console issues
    }
  }
}

// Span interface
export interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: any): this;
  setAttributes(attributes: Record<string, any>): this;
  addEvent(name: string, attributes?: Record<string, any>): this;
  setStatus(status: SpanStatus): this;
  updateName(name: string): this;
  end(endTime?: number): void;
  isRecording(): boolean;
}

// SpanContext interface
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: TraceState;
}

// TraceState interface for W3C Trace Context
export interface TraceState {
  get(key: string): string | undefined;
  set(key: string, value: string): TraceState;
  unset(key: string): TraceState;
  serialize(): string;
}

// SpanStatus interface
export interface SpanStatus {
  code: number;
  message?: string;
}

// Tracer interface
export interface Tracer {
  startSpan(name: string, options?: any): Span;
  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: any, fn: (span: Span) => T): T;
}

// TracerProvider interface
export interface TracerProvider {
  getTracer(name: string, version?: string): Tracer;
}

// Trace API interface
export interface TraceAPI {
  getTracer(name: string, version?: string): Tracer;
  getTracerProvider(): TracerProvider;
  setGlobalTracerProvider(provider: TracerProvider): void;
}

// Metrics API exports
export interface MetricsAPI {
  getMeter(name: string, version?: string): any;
}

// Context API exports
export interface ContextAPI {
  active(): any;
  with<T>(context: any, fn: () => T): T;
  setValue(context: any, key: any, value: any): any;
  getValue(context: any, key: any): any;
}

// Event interface
interface SpanEvent {
  name: string;
  attributes: Record<string, any>;
  time: number;
}

// SpanImpl interface for internal implementation
interface SpanImpl extends Span {
  name: string;
  context: SpanContext;
  attributes: Record<string, any>;
  events: SpanEvent[];
  status: SpanStatus;
  ended: boolean;
  recording: boolean;
  startTime: number;
  endTime?: number;
}

// TracerImpl interface for internal implementation
interface TracerImpl extends Tracer {
  name: string;
  version?: string;
}

// Basic span implementation for IE11
function createSpan(name: string, spanContext: SpanContext): SpanImpl {
  var span: SpanImpl = {
    name: name,
    context: spanContext,
    attributes: {},
    events: [],
    status: { code: 0 },
    ended: false,
    recording: true,
    startTime: getNow(),

    spanContext: function (): SpanContext {
      return this.context;
    },

    setAttribute: function (key: string, value: any): SpanImpl {
      this.attributes[key] = value;
      return this;
    },

    setAttributes: function (attributes: Record<string, any>): SpanImpl {
      for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          this.attributes[key] = attributes[key];
        }
      }
      return this;
    },

    addEvent: function (
      name: string,
      attributes?: Record<string, any>
    ): SpanImpl {
      this.events.push({
        name: name,
        attributes: attributes || {},
        time: getNow(),
      });
      return this;
    },

    setStatus: function (status: SpanStatus): SpanImpl {
      this.status = status;
      return this;
    },

    updateName: function (name: string): SpanImpl {
      this.name = name;
      return this;
    },

    end: function (endTime?: number): void {
      this.ended = true;
      this.recording = false;
      this.endTime = endTime || getNow();
      safeConsoleLog(
        "Span ended:",
        this.name,
        "Duration:",
        this.endTime - this.startTime
      );
    },

    isRecording: function (): boolean {
      return this.recording && !this.ended;
    },
  };

  return span;
}

// Generate random IDs for IE11 with crypto fallback
function generateRandomHex(length: number): string {
  var result = "";
  var chars = "0123456789abcdef";

  // Try to use crypto for better randomness
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    try {
      var array = new Uint8Array(length / 2);
      crypto.getRandomValues(array);
      for (var i = 0; i < array.length; i++) {
        var hex = array[i].toString(16);
        result += hex.length === 1 ? "0" + hex : hex;
      }
      return result;
    } catch (e) {
      // Fall back to Math.random
    }
  }

  // Fallback to Math.random for IE11
  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateTraceId(): string {
  return generateRandomHex(32);
}

function generateSpanId(): string {
  return generateRandomHex(16);
}

// Basic tracer implementation
function createTracer(name: string, version?: string): TracerImpl {
  var tracer: TracerImpl = {
    name: name,
    version: version,

    startSpan: function (name: string, options?: any): Span {
      var spanContext: SpanContext = {
        traceId: generateTraceId(),
        spanId: generateSpanId(),
        traceFlags: 1,
        traceState: createTraceState(),
      };

      var span = createSpan(name, spanContext);
      safeConsoleLog("Started span:", name, "TraceId:", spanContext.traceId);
      return span;
    },

    startActiveSpan: function <T>(
      name: string,
      fnOrOptions?: any,
      fn?: (span: Span) => T
    ): T {
      var actualFn: (span: Span) => T;
      var options: any;

      if (typeof fnOrOptions === "function") {
        actualFn = fnOrOptions;
        options = {};
      } else {
        actualFn = fn!;
        options = fnOrOptions || {};
      }

      var span = this.startSpan(name, options);
      try {
        return actualFn(span);
      } finally {
        span.end();
      }
    },
  };

  return tracer;
}

// Global tracer provider
var globalTracerProvider: TracerProvider = {
  getTracer: function (name: string, version?: string): Tracer {
    return createTracer(name, version);
  },
};

// API implementations
export var trace: TraceAPI = {
  getTracer: function (name: string, version?: string): Tracer {
    return globalTracerProvider.getTracer(name, version);
  },

  getTracerProvider: function (): TracerProvider {
    return globalTracerProvider;
  },

  setGlobalTracerProvider: function (provider: TracerProvider): void {
    globalTracerProvider = provider;
  },
};

export var metrics: MetricsAPI = {
  getMeter: function (name: string, version?: string): any {
    safeConsoleLog("Getting meter for IE11:", name, version);
    return {};
  },
};

export var context: ContextAPI = {
  active: function () {
    return {};
  },

  with: function <T>(ctx: any, fn: () => T): T {
    return fn();
  },

  setValue: function (context: any, key: any, value: any): any {
    var newContext: Record<string, any> = {};
    for (var prop in context) {
      if (Object.prototype.hasOwnProperty.call(context, prop)) {
        newContext[prop] = context[prop];
      }
    }
    newContext[key] = value;
    return newContext;
  },

  getValue: function (context: any, key: any): any {
    return context && context[key];
  },
};

// Basic TraceState implementation for IE11
function createTraceState(entries?: Record<string, string>): TraceState {
  var state: Record<string, string> = entries || {};

  return {
    get: function (key: string): string | undefined {
      return state[key];
    },

    set: function (key: string, value: string): TraceState {
      var newEntries: Record<string, string> = {};
      for (var k in state) {
        if (Object.prototype.hasOwnProperty.call(state, k)) {
          newEntries[k] = state[k];
        }
      }
      newEntries[key] = value;
      return createTraceState(newEntries);
    },

    unset: function (key: string): TraceState {
      var newEntries: Record<string, string> = {};
      for (var k in state) {
        if (Object.prototype.hasOwnProperty.call(state, k) && k !== key) {
          newEntries[k] = state[k];
        }
      }
      return createTraceState(newEntries);
    },

    serialize: function (): string {
      var pairs: string[] = [];
      for (var key in state) {
        if (Object.prototype.hasOwnProperty.call(state, key)) {
          pairs.push(key + "=" + state[key]);
        }
      }
      return pairs.join(",");
    },
  };
}

// Default export for easier import
export default {
  trace: trace,
  metrics: metrics,
  context: context,
  Span: {} as Span,
  SpanContext: {} as SpanContext,
  TraceState: {} as TraceState,
  SpanStatus: {} as SpanStatus,
  Tracer: {} as Tracer,
  TracerProvider: {} as TracerProvider,
  TraceAPI: {} as TraceAPI,
  MetricsAPI: {} as MetricsAPI,
  ContextAPI: {} as ContextAPI,
};
