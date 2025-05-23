// OpenTelemetry Metrics SDK Types for IE11
// All types are ES5 compatible

// Basic metric types
export interface MetricValue {
  value: number;
  timestamp: number;
}

export interface MetricDataPoint {
  attributes: { [key: string]: string | number | boolean };
  value: number;
  timestamp: number;
}

export interface HistogramDataPoint {
  attributes: { [key: string]: string | number | boolean };
  bucketCounts: number[];
  buckets: number[];
  count: number;
  sum: number;
  min?: number;
  max?: number;
  timestamp: number;
}

// Metric instrument types
export interface Counter {
  add(
    value: number,
    attributes?: { [key: string]: string | number | boolean }
  ): void;
}

export interface Gauge {
  record(
    value: number,
    attributes?: { [key: string]: string | number | boolean }
  ): void;
}

export interface Histogram {
  record(
    value: number,
    attributes?: { [key: string]: string | number | boolean }
  ): void;
}

// Aggregation types
export type AggregationType =
  | "sum"
  | "gauge"
  | "histogram"
  | "exponential-histogram";

export interface AggregationConfig {
  type: AggregationType;
  boundaries?: number[];
  maxSize?: number;
}

// Export configuration
export interface MetricExportConfig {
  endpoint: string;
  headers?: { [key: string]: string };
  timeout?: number;
  retryAttempts?: number;
  useXHR?: boolean;
  useImageBeacon?: boolean;
}

// Metric exporter interface
export interface MetricExporter {
  export(metrics: MetricData[]): Promise<void>;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

// IE11 compatible feature detection
export interface IE11Features {
  hasXHR: boolean;
  hasLocalStorage: boolean;
  hasJSON: boolean;
  hasPerformanceAPI: boolean;
  maxArrayLength: number;
  maxObjectKeys: number;
}

// Metric reader interface
export interface MetricReader {
  collect(): MetricData[];
  forceFlush(): Promise<void>;
  shutdown(): Promise<void>;
  setCollectCallback?: (callback: () => MetricData[]) => void;
  start?: () => void;
  stop?: () => void;
}

export interface MetricData {
  resource: { [key: string]: string };
  instrumentationScope: {
    name: string;
    version?: string;
  };
  metrics: MetricRecord[];
}

export interface MetricRecord {
  name: string;
  description?: string;
  unit?: string;
  type: AggregationType;
  dataPoints: MetricDataPoint[] | HistogramDataPoint[];
}

// Error types for IE11 debugging
export interface MetricError {
  code: string;
  message: string;
  timestamp: number;
  context?: any;
}
