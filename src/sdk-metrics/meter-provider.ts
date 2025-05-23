// Meter Provider for IE11
// Manages metric instruments and provides meter instances

import { Counter, Gauge, Histogram } from "./types";
import { createCounter } from "./instruments/counter";
import { createGauge } from "./instruments/gauge";
import { createHistogram } from "./instruments/histogram";
import {
  MetricReader,
  MetricData,
  MetricRecord,
  MetricDataPoint,
  HistogramDataPoint,
} from "./types";
import { getHighResolutionTime, generateId } from "./utils/ie11-utils";

export interface Meter {
  createCounter(name: string, description?: string, unit?: string): Counter;
  createGauge(name: string, description?: string, unit?: string): Gauge;
  createHistogram(
    name: string,
    description?: string,
    unit?: string,
    boundaries?: number[]
  ): Histogram;
  getName(): string;
  getVersion(): string;
}

export interface MeterProvider {
  getMeter(name: string, version?: string): Meter;
  addMetricReader(reader: MetricReader): void;
  removeMetricReader(reader: MetricReader): void;
  forceFlush(): Promise<void>;
  shutdown(): Promise<void>;
}

export function createMeterProvider(config?: {
  resource?: { [key: string]: string };
  instrumentationScope?: { name: string; version?: string };
}): MeterProvider {
  var _resource = (config && config.resource) || {
    "service.name": "unknown_service",
  };
  var _instrumentationScope = (config && config.instrumentationScope) || {
    name: "opentelemetry-ie11-metrics",
    version: "1.0.0",
  };
  var _meters: { [key: string]: Meter } = {};
  var _readers: MetricReader[] = [];
  var _instruments: Array<{
    meter: string;
    instrument: Counter | Gauge | Histogram;
  }> = [];
  var _isShutdown = false;

  function createMeterInstance(name: string, version?: string): Meter {
    var meterName = name;
    var meterVersion = version || "1.0.0";
    var meterInstruments: Array<Counter | Gauge | Histogram> = [];

    function createCounterInstrument(
      instrumentName: string,
      description?: string,
      unit?: string
    ): Counter {
      if (_isShutdown) {
        throw new Error("MeterProvider has been shutdown");
      }

      var counter = createCounter(instrumentName, description, unit);
      meterInstruments.push(counter);
      _instruments.push({
        meter: meterName + "@" + meterVersion,
        instrument: counter,
      });
      return counter;
    }

    function createGaugeInstrument(
      instrumentName: string,
      description?: string,
      unit?: string
    ): Gauge {
      if (_isShutdown) {
        throw new Error("MeterProvider has been shutdown");
      }

      var gauge = createGauge(instrumentName, description, unit);
      meterInstruments.push(gauge);
      _instruments.push({
        meter: meterName + "@" + meterVersion,
        instrument: gauge,
      });
      return gauge;
    }

    function createHistogramInstrument(
      instrumentName: string,
      description?: string,
      unit?: string,
      boundaries?: number[]
    ): Histogram {
      if (_isShutdown) {
        throw new Error("MeterProvider has been shutdown");
      }

      var histogram = createHistogram(
        instrumentName,
        description,
        unit,
        boundaries
      );
      meterInstruments.push(histogram);
      _instruments.push({
        meter: meterName + "@" + meterVersion,
        instrument: histogram,
      });
      return histogram;
    }

    function getMeterName(): string {
      return meterName;
    }

    function getMeterVersion(): string {
      return meterVersion;
    }

    return {
      createCounter: createCounterInstrument,
      createGauge: createGaugeInstrument,
      createHistogram: createHistogramInstrument,
      getName: getMeterName,
      getVersion: getMeterVersion,
    };
  }

  function getMeter(name: string, version?: string): Meter {
    if (_isShutdown) {
      throw new Error("MeterProvider has been shutdown");
    }

    var meterKey = name + "@" + (version || "1.0.0");

    if (!_meters[meterKey]) {
      _meters[meterKey] = createMeterInstance(name, version);
    }

    return _meters[meterKey];
  }

  function addMetricReader(reader: MetricReader): void {
    if (_isShutdown) {
      throw new Error("MeterProvider has been shutdown");
    }

    // Check if reader is already added
    for (var i = 0; i < _readers.length; i++) {
      if (_readers[i] === reader) {
        return;
      }
    }

    _readers.push(reader);
  }

  function removeMetricReader(reader: MetricReader): void {
    for (var i = 0; i < _readers.length; i++) {
      if (_readers[i] === reader) {
        _readers.splice(i, 1);
        break;
      }
    }
  }

  function collectMetrics(): MetricData[] {
    var metricData: MetricData[] = [];
    var timestamp = getHighResolutionTime();

    // Group instruments by meter
    var meterGroups: { [key: string]: Array<Counter | Gauge | Histogram> } = {};

    for (var i = 0; i < _instruments.length; i++) {
      var item = _instruments[i];
      if (!meterGroups[item.meter]) {
        meterGroups[item.meter] = [];
      }
      meterGroups[item.meter].push(item.instrument);
    }

    // Create metric data for each meter
    for (var meterKey in meterGroups) {
      if (Object.prototype.hasOwnProperty.call(meterGroups, meterKey)) {
        var instruments = meterGroups[meterKey];
        var metrics: MetricRecord[] = [];

        for (var j = 0; j < instruments.length; j++) {
          var instrument = instruments[j];
          var dataPoints: any[] = [];

          // Call getDataPoints method if available
          if (typeof (instrument as any).getDataPoints === "function") {
            dataPoints = (instrument as any).getDataPoints();
          }

          if (dataPoints.length > 0) {
            var metricType: any = "sum"; // Default type

            // Determine metric type based on instrument
            if (typeof (instrument as any).record === "function") {
              // Could be gauge or histogram
              if (typeof (instrument as any).getBoundaries === "function") {
                metricType = "histogram";
              } else {
                metricType = "gauge";
              }
            } else if (typeof (instrument as any).add === "function") {
              metricType = "sum";
            }

            var metricRecord: MetricRecord = {
              name: (instrument as any).getName() || "unknown_metric",
              description: (instrument as any).getDescription() || "",
              unit: (instrument as any).getUnit() || "",
              type: metricType,
              dataPoints: dataPoints,
            };

            metrics.push(metricRecord);
          }
        }

        if (metrics.length > 0) {
          metricData.push({
            resource: _resource,
            instrumentationScope: _instrumentationScope,
            metrics: metrics,
          });
        }
      }
    }

    return metricData;
  }

  function forceFlush(): Promise<void> {
    if (_isShutdown) {
      return Promise.reject(new Error("MeterProvider has been shutdown"));
    }

    // Collect metrics and notify all readers
    var metrics = collectMetrics();
    var promises: Promise<void>[] = [];

    for (var i = 0; i < _readers.length; i++) {
      try {
        // Assume readers have a collect method that returns metrics
        var readerMetrics = _readers[i].collect();
        // Note: This is a simplified implementation
        // In a real implementation, readers would be notified of new metrics
      } catch (e) {
        // Handle reader errors gracefully
      }
    }

    return Promise.all(promises)
      .then(function () {
        // Return void explicitly
      })
      .catch(function () {
        // Return void explicitly
      });
  }

  function shutdown(): Promise<void> {
    if (_isShutdown) {
      return Promise.resolve();
    }

    _isShutdown = true;

    // Shutdown all instruments
    for (var i = 0; i < _instruments.length; i++) {
      var instrument = _instruments[i].instrument;
      if (typeof (instrument as any).shutdown === "function") {
        try {
          (instrument as any).shutdown();
        } catch (e) {
          // Handle shutdown errors gracefully
        }
      }
    }

    // Shutdown all readers
    var promises: Promise<void>[] = [];
    for (var j = 0; j < _readers.length; j++) {
      try {
        promises.push(_readers[j].shutdown());
      } catch (e) {
        // Handle reader shutdown errors gracefully
      }
    }

    // Clear references
    _meters = {};
    _instruments = [];
    _readers = [];

    return Promise.all(promises)
      .then(function () {
        // Return void explicitly
      })
      .catch(function () {
        // Return void explicitly
      });
  }

  return {
    getMeter: getMeter,
    addMetricReader: addMetricReader,
    removeMetricReader: removeMetricReader,
    forceFlush: forceFlush,
    shutdown: shutdown,
  };
}

// Factory function with default configuration
export function MeterProvider(config?: {
  resource?: { [key: string]: string };
  instrumentationScope?: { name: string; version?: string };
}): MeterProvider {
  return createMeterProvider(config);
}
