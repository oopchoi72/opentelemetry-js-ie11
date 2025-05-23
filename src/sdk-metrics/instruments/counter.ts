// Counter Instrument for IE11
// Implements additive metric collection with ES5 compatibility

import { Counter, MetricDataPoint } from "../types";
import {
  getHighResolutionTime,
  objectAssign,
  safeStringify,
  createError,
} from "../utils/ie11-utils";

export function createCounter(
  name: string,
  description?: string,
  unit?: string
): Counter {
  var metricName = name;
  var metricDescription = description || "";
  var metricUnit = unit || "";
  var dataPoints: MetricDataPoint[] = [];
  var isShutdown = false;

  // Attribute key normalization for IE11 memory efficiency
  var attributeCache: { [key: string]: string } = {};

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
        // Ensure IE11 compatible value types
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

  function findExistingDataPoint(attributes: {
    [key: string]: string | number | boolean;
  }): MetricDataPoint | null {
    var attributeKey = safeStringify(attributes);

    // Use cached key for performance
    if (attributeCache[attributeKey]) {
      for (var i = 0; i < dataPoints.length; i++) {
        if (safeStringify(dataPoints[i].attributes) === attributeKey) {
          return dataPoints[i];
        }
      }
    }

    return null;
  }

  function addValue(
    value: number,
    attributes?: { [key: string]: string | number | boolean }
  ): void {
    if (isShutdown) {
      throw createError("COUNTER_SHUTDOWN", "Cannot add to a shutdown counter");
    }

    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw createError(
        "INVALID_VALUE",
        "Counter value must be a non-negative number",
        { value: value }
      );
    }

    var normalizedAttributes = normalizeAttributes(attributes);
    var timestamp = getHighResolutionTime();

    // Try to find existing data point for this attribute combination
    var existingPoint = findExistingDataPoint(normalizedAttributes);

    if (existingPoint) {
      // Update existing data point
      existingPoint.value += value;
      existingPoint.timestamp = timestamp;
    } else {
      // Create new data point
      var newDataPoint: MetricDataPoint = {
        attributes: normalizedAttributes,
        value: value,
        timestamp: timestamp,
      };

      dataPoints.push(newDataPoint);

      // Cache attribute key for performance
      var attributeKey = safeStringify(normalizedAttributes);
      attributeCache[attributeKey] = attributeKey;
    }

    // Prevent memory leaks in IE11 by limiting data points
    if (dataPoints.length > 1000) {
      // Keep only the most recent 800 data points
      dataPoints = dataPoints.slice(-800);

      // Clear attribute cache to prevent stale references
      attributeCache = {};
    }
  }

  function getDataPoints(): MetricDataPoint[] {
    var result = [];
    for (var i = 0; i < dataPoints.length; i++) {
      result.push({
        attributes: objectAssign({}, dataPoints[i].attributes),
        value: dataPoints[i].value,
        timestamp: dataPoints[i].timestamp,
      });
    }
    return result;
  }

  function reset(): void {
    dataPoints = [];
    attributeCache = {};
  }

  function shutdown(): void {
    isShutdown = true;
    dataPoints = [];
    attributeCache = {};
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

  // Return the public counter interface
  var counter: Counter & {
    getDataPoints(): MetricDataPoint[];
    reset(): void;
    shutdown(): void;
    getName(): string;
    getDescription(): string;
    getUnit(): string;
  } = {
    add: addValue,
    getDataPoints: getDataPoints,
    reset: reset,
    shutdown: shutdown,
    getName: getName,
    getDescription: getDescription,
    getUnit: getUnit,
  };

  return counter;
}

// Factory function for creating counter instances
export function Counter(
  name: string,
  description?: string,
  unit?: string
): Counter {
  return createCounter(name, description, unit);
}
