// Histogram Instrument for IE11
// Implements bucket-based metric collection with ES5 compatibility

import { Histogram, HistogramDataPoint } from "../types";
import {
  getHighResolutionTime,
  objectAssign,
  safeStringify,
  createError,
  arrayFill,
  sortArray,
} from "../utils/ie11-utils";

// Default histogram boundaries for IE11 optimization
var DEFAULT_BOUNDARIES = [
  0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10,
];

export function createHistogram(
  name: string,
  description?: string,
  unit?: string,
  boundaries?: number[]
): Histogram {
  var metricName = name;
  var metricDescription = description || "";
  var metricUnit = unit || "";
  var bucketBoundaries = boundaries
    ? sortArray(boundaries.slice())
    : DEFAULT_BOUNDARIES.slice();
  var isShutdown = false;

  // Pre-allocate bucket arrays for IE11 performance
  var bucketCount = bucketBoundaries.length + 1;
  var dataPointsMap: { [key: string]: HistogramDataPoint } = {};

  function normalizeAttributes(attributes?: {
    [key: string]: string | number | boolean;
  }): { [key: string]: string | number | boolean } {
    if (!attributes) {
      return {};
    }

    var normalized: { [key: string]: string | number | boolean } = {};
    for (var key in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, key)) {
        var value = attributes[key];
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          normalized[key] = value;
        } else {
          normalized[key] = String(value);
        }
      }
    }
    return normalized;
  }

  function createEmptyHistogramDataPoint(attributes: {
    [key: string]: string | number | boolean;
  }): HistogramDataPoint {
    var bucketCounts = new Array(bucketCount);
    arrayFill(bucketCounts, 0);

    return {
      attributes: attributes,
      bucketCounts: bucketCounts,
      buckets: bucketBoundaries.slice(),
      count: 0,
      sum: 0,
      min: undefined,
      max: undefined,
      timestamp: getHighResolutionTime(),
    };
  }

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

  function recordValue(
    value: number,
    attributes?: { [key: string]: string | number | boolean }
  ): void {
    if (isShutdown) {
      throw createError(
        "HISTOGRAM_SHUTDOWN",
        "Cannot record to a shutdown histogram"
      );
    }

    if (typeof value !== "number" || isNaN(value)) {
      throw createError(
        "INVALID_VALUE",
        "Histogram value must be a valid number",
        { value: value }
      );
    }

    var normalizedAttributes = normalizeAttributes(attributes);
    var attributeKey = safeStringify(normalizedAttributes);
    var timestamp = getHighResolutionTime();

    // Get or create histogram data point for this attribute combination
    var dataPoint = dataPointsMap[attributeKey];
    if (!dataPoint) {
      dataPoint = createEmptyHistogramDataPoint(normalizedAttributes);
      dataPointsMap[attributeKey] = dataPoint;
    }

    // Find the appropriate bucket for this value
    var bucketIndex = findBucketIndex(value);
    dataPoint.bucketCounts[bucketIndex]++;

    // Update aggregation values
    dataPoint.count++;
    dataPoint.sum += value;
    dataPoint.timestamp = timestamp;

    // Update min/max values
    if (dataPoint.min === undefined || value < dataPoint.min) {
      dataPoint.min = value;
    }
    if (dataPoint.max === undefined || value > dataPoint.max) {
      dataPoint.max = value;
    }

    // Prevent memory leaks in IE11 by limiting data points
    var dataPointCount = 0;
    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        dataPointCount++;
      }
    }

    if (dataPointCount > 100) {
      // Remove oldest data points (simple strategy for IE11)
      var keysToRemove: string[] = [];
      var count = 0;
      for (var key in dataPointsMap) {
        if (
          Object.prototype.hasOwnProperty.call(dataPointsMap, key) &&
          count < 20
        ) {
          keysToRemove.push(key);
          count++;
        }
      }

      for (var i = 0; i < keysToRemove.length; i++) {
        delete dataPointsMap[keysToRemove[i]];
      }
    }
  }

  function getDataPoints(): HistogramDataPoint[] {
    var result: HistogramDataPoint[] = [];

    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        var dataPoint = dataPointsMap[key];
        result.push({
          attributes: objectAssign({}, dataPoint.attributes),
          bucketCounts: dataPoint.bucketCounts.slice(),
          buckets: dataPoint.buckets.slice(),
          count: dataPoint.count,
          sum: dataPoint.sum,
          min: dataPoint.min,
          max: dataPoint.max,
          timestamp: dataPoint.timestamp,
        });
      }
    }

    return result;
  }

  function getBoundaries(): number[] {
    return bucketBoundaries.slice();
  }

  function getPercentile(percentile: number): number | undefined {
    if (percentile < 0 || percentile > 100) {
      throw createError(
        "INVALID_PERCENTILE",
        "Percentile must be between 0 and 100",
        { percentile: percentile }
      );
    }

    // Calculate percentile across all data points (simplified for IE11)
    var totalCount = 0;
    var combinedBuckets = new Array(bucketCount);
    arrayFill(combinedBuckets, 0);

    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        var dataPoint = dataPointsMap[key];
        totalCount += dataPoint.count;
        for (var i = 0; i < bucketCount; i++) {
          combinedBuckets[i] += dataPoint.bucketCounts[i];
        }
      }
    }

    if (totalCount === 0) {
      return undefined;
    }

    var targetCount = Math.floor((percentile / 100) * totalCount);
    var cumulativeCount = 0;

    for (var i = 0; i < bucketCount; i++) {
      cumulativeCount += combinedBuckets[i];
      if (cumulativeCount >= targetCount) {
        if (i === bucketCount - 1) {
          // Last bucket - no upper boundary
          return bucketBoundaries[bucketBoundaries.length - 1];
        } else {
          return bucketBoundaries[i];
        }
      }
    }

    return undefined;
  }

  function reset(): void {
    dataPointsMap = {};
  }

  function shutdown(): void {
    isShutdown = true;
    dataPointsMap = {};
  }

  function getName(): string {
    return metricName;
  }

  function getDescription(): string {
    return metricDescription;
  }

  function getUnit(): string {
    return metricUnit;
  }

  // Return the public histogram interface
  var histogram: Histogram & {
    getDataPoints(): HistogramDataPoint[];
    getBoundaries(): number[];
    getPercentile(percentile: number): number | undefined;
    reset(): void;
    shutdown(): void;
    getName(): string;
    getDescription(): string;
    getUnit(): string;
  } = {
    record: recordValue,
    getDataPoints: getDataPoints,
    getBoundaries: getBoundaries,
    getPercentile: getPercentile,
    reset: reset,
    shutdown: shutdown,
    getName: getName,
    getDescription: getDescription,
    getUnit: getUnit,
  };

  return histogram;
}

// Factory function for creating histogram instances
export function Histogram(
  name: string,
  description?: string,
  unit?: string,
  boundaries?: number[]
): Histogram {
  return createHistogram(name, description, unit, boundaries);
}
