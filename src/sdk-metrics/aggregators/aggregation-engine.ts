// Aggregation Engine for IE11
// Implements metric aggregation with ES5 compatibility

import { MetricDataPoint, HistogramDataPoint, AggregationType } from "../types";
import {
  arrayFill,
  sortArray,
  getHighResolutionTime,
} from "../utils/ie11-utils";

export interface AggregationResult {
  type: AggregationType;
  value: number | HistogramDataPoint;
  timestamp: number;
  count: number;
}

export interface Aggregator {
  aggregate(dataPoints: MetricDataPoint[]): AggregationResult;
  reset(): void;
}

export function createSumAggregator(): Aggregator {
  var lastTimestamp = 0;

  function aggregate(dataPoints: MetricDataPoint[]): AggregationResult {
    var sum = 0;
    var count = 0;
    var latestTimestamp = 0;

    for (var i = 0; i < dataPoints.length; i++) {
      var point = dataPoints[i];
      if (typeof point.value === "number" && !isNaN(point.value)) {
        sum += point.value;
        count++;
        if (point.timestamp > latestTimestamp) {
          latestTimestamp = point.timestamp;
        }
      }
    }

    lastTimestamp = latestTimestamp || getHighResolutionTime();

    return {
      type: "sum",
      value: sum,
      timestamp: lastTimestamp,
      count: count,
    };
  }

  function reset(): void {
    lastTimestamp = 0;
  }

  return {
    aggregate: aggregate,
    reset: reset,
  };
}

export function createGaugeAggregator(): Aggregator {
  var lastTimestamp = 0;

  function aggregate(dataPoints: MetricDataPoint[]): AggregationResult {
    var latestValue = 0;
    var latestTimestamp = 0;
    var count = 0;

    // For gauge, we want the most recent value
    for (var i = 0; i < dataPoints.length; i++) {
      var point = dataPoints[i];
      if (typeof point.value === "number" && !isNaN(point.value)) {
        if (point.timestamp >= latestTimestamp) {
          latestValue = point.value;
          latestTimestamp = point.timestamp;
        }
        count++;
      }
    }

    lastTimestamp = latestTimestamp || getHighResolutionTime();

    return {
      type: "gauge",
      value: latestValue,
      timestamp: lastTimestamp,
      count: count,
    };
  }

  function reset(): void {
    lastTimestamp = 0;
  }

  return {
    aggregate: aggregate,
    reset: reset,
  };
}

export function createHistogramAggregator(boundaries?: number[]): Aggregator {
  var defaultBoundaries = [
    0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10,
  ];
  var bucketBoundaries = boundaries
    ? sortArray(boundaries.slice())
    : defaultBoundaries.slice();
  var bucketCount = bucketBoundaries.length + 1;
  var lastTimestamp = 0;

  function findBucketIndex(value: number): number {
    // Binary search for bucket index (optimized for IE11)
    var left = 0;
    var right = bucketBoundaries.length;

    while (left < right) {
      var mid = Math.floor((left + right) / 2);
      if (value <= bucketBoundaries[mid]) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return left;
  }

  function aggregate(dataPoints: MetricDataPoint[]): AggregationResult {
    var bucketCounts = new Array(bucketCount);
    arrayFill(bucketCounts, 0);

    var sum = 0;
    var count = 0;
    var min: number | undefined;
    var max: number | undefined;
    var latestTimestamp = 0;

    // Aggregate all data points into histogram buckets
    for (var i = 0; i < dataPoints.length; i++) {
      var point = dataPoints[i];
      if (typeof point.value === "number" && !isNaN(point.value)) {
        var value = point.value;
        var bucketIndex = findBucketIndex(value);
        bucketCounts[bucketIndex]++;

        sum += value;
        count++;

        if (min === undefined || value < min) {
          min = value;
        }
        if (max === undefined || value > max) {
          max = value;
        }

        if (point.timestamp > latestTimestamp) {
          latestTimestamp = point.timestamp;
        }
      }
    }

    lastTimestamp = latestTimestamp || getHighResolutionTime();

    var histogramValue: HistogramDataPoint = {
      attributes: {},
      bucketCounts: bucketCounts,
      buckets: bucketBoundaries.slice(),
      count: count,
      sum: sum,
      min: min,
      max: max,
      timestamp: lastTimestamp,
    };

    return {
      type: "histogram",
      value: histogramValue,
      timestamp: lastTimestamp,
      count: count,
    };
  }

  function reset(): void {
    lastTimestamp = 0;
  }

  return {
    aggregate: aggregate,
    reset: reset,
  };
}

// Advanced aggregation functions
export function calculatePercentile(
  values: number[],
  percentile: number
): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  if (percentile < 0 || percentile > 100) {
    throw new Error("Percentile must be between 0 and 100");
  }

  var sorted = sortArray(values.slice());
  var index = Math.ceil((percentile / 100) * sorted.length) - 1;
  index = Math.max(0, Math.min(index, sorted.length - 1));

  return sorted[index];
}

export function calculateAverage(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  var sum = 0;
  for (var i = 0; i < values.length; i++) {
    sum += values[i];
  }

  return sum / values.length;
}

export function calculateMinMax(values: number[]): {
  min?: number;
  max?: number;
} {
  if (values.length === 0) {
    return { min: undefined, max: undefined };
  }

  var min = values[0];
  var max = values[0];

  for (var i = 1; i < values.length; i++) {
    if (values[i] < min) {
      min = values[i];
    }
    if (values[i] > max) {
      max = values[i];
    }
  }

  return { min: min, max: max };
}

export function calculateStandardDeviation(
  values: number[]
): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  var avg = calculateAverage(values);
  if (avg === undefined) {
    return undefined;
  }

  var variance = 0;
  for (var i = 0; i < values.length; i++) {
    var diff = values[i] - avg;
    variance += diff * diff;
  }

  variance = variance / values.length;
  return Math.sqrt(variance);
}

// Temporal aggregation for time-based windows
export function createTemporalAggregator(
  windowSize: number,
  aggregationType: AggregationType
): {
  addValue: (value: number, timestamp?: number) => void;
  getAggregation: () => AggregationResult | undefined;
  reset: () => void;
} {
  var values: Array<{ value: number; timestamp: number }> = [];
  var aggregator: Aggregator;

  switch (aggregationType) {
    case "sum":
      aggregator = createSumAggregator();
      break;
    case "gauge":
      aggregator = createGaugeAggregator();
      break;
    case "histogram":
      aggregator = createHistogramAggregator();
      break;
    default:
      aggregator = createSumAggregator();
  }

  function addValue(value: number, timestamp?: number): void {
    var ts = timestamp || getHighResolutionTime();
    values.push({ value: value, timestamp: ts });

    // Remove values outside the window
    var cutoffTime = ts - windowSize;
    var validValues = [];

    for (var i = 0; i < values.length; i++) {
      if (values[i].timestamp >= cutoffTime) {
        validValues.push(values[i]);
      }
    }

    values = validValues;
  }

  function getAggregation(): AggregationResult | undefined {
    if (values.length === 0) {
      return undefined;
    }

    var dataPoints: MetricDataPoint[] = [];
    for (var i = 0; i < values.length; i++) {
      dataPoints.push({
        attributes: {},
        value: values[i].value,
        timestamp: values[i].timestamp,
      });
    }

    return aggregator.aggregate(dataPoints);
  }

  function reset(): void {
    values = [];
    aggregator.reset();
  }

  return {
    addValue: addValue,
    getAggregation: getAggregation,
    reset: reset,
  };
}
