// OpenTelemetry Metrics SDK for IE11
// This file will export the IE11-compatible OpenTelemetry metrics functionality

// Base metric interface
export interface Metric {
  record(value: number, attributes?: Record<string, any>): void;
}

// Extended interfaces with implementation properties
export interface CounterImpl extends Metric {
  name: string;
  value: number;
  add(value: number, attributes?: Record<string, any>): void;
}

export interface HistogramImpl extends Metric {
  name: string;
  values: number[];
  record(value: number, attributes?: Record<string, any>): void;
}

export interface GaugeImpl extends Metric {
  name: string;
  currentValue: number;
  set(value: number, attributes?: Record<string, any>): void;
}

// Public interfaces (for external use)
export interface Counter extends Metric {
  add(value: number, attributes?: Record<string, any>): void;
}

export interface Histogram extends Metric {
  record(value: number, attributes?: Record<string, any>): void;
}

export interface Gauge extends Metric {
  set(value: number, attributes?: Record<string, any>): void;
}

// Meter interface
export interface Meter {
  createCounter(name: string, options?: any): Counter;
  createHistogram(name: string, options?: any): Histogram;
  createGauge(name: string, options?: any): Gauge;
}

// MeterProvider interface
export interface MeterProvider {
  getMeter(name: string, version?: string): Meter;
}

// Basic counter implementation for IE11
export function createCounter(name: string): CounterImpl {
  return {
    name: name,
    value: 0,

    record: function (value: number, attributes?: Record<string, any>): void {
      this.add(value, attributes);
    },

    add: function (value: number, attributes?: Record<string, any>): void {
      this.value += value;
      console.log(
        "Counter",
        this.name,
        "value:",
        this.value,
        "attributes:",
        attributes
      );
    },
  };
}

// Basic histogram implementation for IE11
export function createHistogram(name: string): HistogramImpl {
  return {
    name: name,
    values: [] as number[],

    record: function (value: number, attributes?: Record<string, any>): void {
      this.values.push(value);
      console.log(
        "Histogram",
        this.name,
        "recorded:",
        value,
        "attributes:",
        attributes
      );
    },
  };
}

// Basic gauge implementation for IE11
export function createGauge(name: string): GaugeImpl {
  return {
    name: name,
    currentValue: 0,

    record: function (value: number, attributes?: Record<string, any>): void {
      this.set(value, attributes);
    },

    set: function (value: number, attributes?: Record<string, any>): void {
      this.currentValue = value;
      console.log(
        "Gauge",
        this.name,
        "set to:",
        value,
        "attributes:",
        attributes
      );
    },
  };
}

// Meter implementation
export function createMeter(): Meter {
  return {
    createCounter: function (name: string, options?: any): Counter {
      console.log("Creating counter for IE11:", name, options);
      return createCounter(name);
    },

    createHistogram: function (name: string, options?: any): Histogram {
      console.log("Creating histogram for IE11:", name, options);
      return createHistogram(name);
    },

    createGauge: function (name: string, options?: any): Gauge {
      console.log("Creating gauge for IE11:", name, options);
      return createGauge(name);
    },
  };
}
