// Gauge Instrument for IE11
// Implements last-value metric collection with ES5 compatibility

import { Gauge, MetricDataPoint } from "../types";
import {
  getHighResolutionTime,
  objectAssign,
  safeStringify,
  createError,
} from "../utils/ie11-utils";

export function createGauge(
  name: string,
  description?: string,
  unit?: string
): Gauge {
  var metricName = name;
  var metricDescription = description || "";
  var metricUnit = unit || "";
  var dataPointsMap: { [key: string]: MetricDataPoint } = {};
  var isShutdown = false;

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

  function recordValue(
    value: number,
    attributes?: { [key: string]: string | number | boolean }
  ): void {
    if (isShutdown) {
      throw createError("GAUGE_SHUTDOWN", "Cannot record to a shutdown gauge");
    }

    if (typeof value !== "number" || isNaN(value)) {
      throw createError("INVALID_VALUE", "Gauge value must be a valid number", {
        value: value,
      });
    }

    var normalizedAttributes = normalizeAttributes(attributes);
    var attributeKey = safeStringify(normalizedAttributes);
    var timestamp = getHighResolutionTime();

    // For gauges, we always overwrite the existing value (last value wins)
    dataPointsMap[attributeKey] = {
      attributes: normalizedAttributes,
      value: value,
      timestamp: timestamp,
    };

    // Prevent memory leaks in IE11 by limiting data points
    var dataPointCount = 0;
    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        dataPointCount++;
      }
    }

    if (dataPointCount > 500) {
      // Keep only the most recent 400 data points for gauges
      var entries: Array<{ key: string; timestamp: number }> = [];

      for (var key in dataPointsMap) {
        if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
          entries.push({
            key: key,
            timestamp: dataPointsMap[key].timestamp,
          });
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort(function (a, b) {
        return a.timestamp - b.timestamp;
      });

      // Remove oldest 100 entries
      for (var i = 0; i < 100 && i < entries.length; i++) {
        delete dataPointsMap[entries[i].key];
      }
    }
  }

  function getDataPoints(): MetricDataPoint[] {
    var result: MetricDataPoint[] = [];

    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        var dataPoint = dataPointsMap[key];
        result.push({
          attributes: objectAssign({}, dataPoint.attributes),
          value: dataPoint.value,
          timestamp: dataPoint.timestamp,
        });
      }
    }

    // Sort by timestamp for consistent output
    result.sort(function (a, b) {
      return a.timestamp - b.timestamp;
    });

    return result;
  }

  function getCurrentValue(attributes?: {
    [key: string]: string | number | boolean;
  }): number | undefined {
    var normalizedAttributes = normalizeAttributes(attributes);
    var attributeKey = safeStringify(normalizedAttributes);
    var dataPoint = dataPointsMap[attributeKey];

    return dataPoint ? dataPoint.value : undefined;
  }

  function getLastUpdateTime(attributes?: {
    [key: string]: string | number | boolean;
  }): number | undefined {
    var normalizedAttributes = normalizeAttributes(attributes);
    var attributeKey = safeStringify(normalizedAttributes);
    var dataPoint = dataPointsMap[attributeKey];

    return dataPoint ? dataPoint.timestamp : undefined;
  }

  function getAllAttributes(): Array<{
    [key: string]: string | number | boolean;
  }> {
    var result: Array<{ [key: string]: string | number | boolean }> = [];

    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        result.push(objectAssign({}, dataPointsMap[key].attributes));
      }
    }

    return result;
  }

  function getDataPointCount(): number {
    var count = 0;
    for (var key in dataPointsMap) {
      if (Object.prototype.hasOwnProperty.call(dataPointsMap, key)) {
        count++;
      }
    }
    return count;
  }

  function removeDataPoint(attributes: {
    [key: string]: string | number | boolean;
  }): boolean {
    var normalizedAttributes = normalizeAttributes(attributes);
    var attributeKey = safeStringify(normalizedAttributes);

    if (dataPointsMap[attributeKey]) {
      delete dataPointsMap[attributeKey];
      return true;
    }

    return false;
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

  // Return the public gauge interface
  var gauge: Gauge & {
    getDataPoints(): MetricDataPoint[];
    getCurrentValue(attributes?: {
      [key: string]: string | number | boolean;
    }): number | undefined;
    getLastUpdateTime(attributes?: {
      [key: string]: string | number | boolean;
    }): number | undefined;
    getAllAttributes(): Array<{ [key: string]: string | number | boolean }>;
    getDataPointCount(): number;
    removeDataPoint(attributes: {
      [key: string]: string | number | boolean;
    }): boolean;
    reset(): void;
    shutdown(): void;
    getName(): string;
    getDescription(): string;
    getUnit(): string;
  } = {
    record: recordValue,
    getDataPoints: getDataPoints,
    getCurrentValue: getCurrentValue,
    getLastUpdateTime: getLastUpdateTime,
    getAllAttributes: getAllAttributes,
    getDataPointCount: getDataPointCount,
    removeDataPoint: removeDataPoint,
    reset: reset,
    shutdown: shutdown,
    getName: getName,
    getDescription: getDescription,
    getUnit: getUnit,
  };

  return gauge;
}

// Factory function for creating gauge instances
export function Gauge(
  name: string,
  description?: string,
  unit?: string
): Gauge {
  return createGauge(name, description, unit);
}
