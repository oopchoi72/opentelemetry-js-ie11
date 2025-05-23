// IE11-compatible BatchSpanProcessor implementation

import {
  SpanProcessor,
  ReadableSpan,
  Context,
  SpanExporter,
  BatchSpanProcessorConfig,
} from "./types";

// Optimized batch span processor for IE11
export var BatchSpanProcessor = function (
  exporter: SpanExporter,
  config?: BatchSpanProcessorConfig
): any {
  var processor = this;
  var _exporter = exporter;
  var _isShutdown = false;

  // Configuration with defaults optimized for IE11
  var _config = config || {};
  var _maxExportBatchSize = _config.maxExportBatchSize || 512;
  var _scheduledDelayMillis = _config.scheduledDelayMillis || 5000;
  var _exportTimeoutMillis = _config.exportTimeoutMillis || 30000;
  var _maxQueueSize = _config.maxQueueSize || 2048;

  // Internal state
  var _spanQueue = [];
  var _timer = null;
  var _isExporting = false;

  // IE11-compatible timer functions
  function setTimer(callback, delay) {
    return setTimeout(callback, delay);
  }

  function clearTimer(timerId) {
    if (timerId) {
      clearTimeout(timerId);
    }
  }

  // Optimized batch export function
  function exportBatch() {
    if (_isShutdown || _isExporting || _spanQueue.length === 0) {
      return;
    }

    _isExporting = true;

    // Extract batch from queue
    var batchSize = Math.min(_maxExportBatchSize, _spanQueue.length);
    var batch = _spanQueue.splice(0, batchSize);

    // Export with timeout handling
    var exportStartTime = Date.now();
    var timeoutId = setTimer(function () {
      // Handle timeout
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Span export timeout after", _exportTimeoutMillis, "ms");
      }
      _isExporting = false;
      scheduleNextExport();
    }, _exportTimeoutMillis);

    _exporter.export(batch, function (result) {
      clearTimer(timeoutId);
      _isExporting = false;

      if (result.error) {
        // Log error in IE11-compatible way
        if (typeof console !== "undefined" && console.error) {
          console.error("Failed to export span batch:", result.error);
        }
      }

      // Schedule next export if there are more spans
      scheduleNextExport();
    });
  }

  // Schedule next export with optimization
  function scheduleNextExport() {
    if (_isShutdown || _timer || _spanQueue.length === 0) {
      return;
    }

    _timer = setTimer(function () {
      _timer = null;
      exportBatch();
    }, _scheduledDelayMillis);
  }

  processor.forceFlush = function () {
    return new Promise(function (resolve) {
      if (_isShutdown) {
        resolve();
        return;
      }

      // Clear scheduled timer
      if (_timer) {
        clearTimer(_timer);
        _timer = null;
      }

      // Export all remaining spans
      var flushBatches = function () {
        if (_spanQueue.length === 0 || _isExporting) {
          resolve();
          return;
        }

        exportBatch();

        // Wait for export to complete
        var checkComplete = function () {
          if (!_isExporting) {
            flushBatches();
          } else {
            setTimer(checkComplete, 10);
          }
        };

        setTimer(checkComplete, 10);
      };

      flushBatches();
    });
  };

  processor.onStart = function (span, parentContext) {
    // Batch processor doesn't need to do anything on start
  };

  processor.onEnd = function (span) {
    if (_isShutdown) {
      return;
    }

    // Add span to queue with size limit
    if (_spanQueue.length >= _maxQueueSize) {
      // Drop oldest span to make room (FIFO)
      _spanQueue.shift();

      if (typeof console !== "undefined" && console.warn) {
        console.warn("Span queue full, dropping oldest span");
      }
    }

    _spanQueue.push(span);

    // Trigger immediate export if batch is full
    if (_spanQueue.length >= _maxExportBatchSize) {
      if (_timer) {
        clearTimer(_timer);
        _timer = null;
      }
      exportBatch();
    } else {
      // Schedule export
      scheduleNextExport();
    }
  };

  processor.shutdown = function () {
    if (_isShutdown) {
      return Promise.resolve();
    }

    _isShutdown = true;

    // Clear timer
    if (_timer) {
      clearTimer(_timer);
      _timer = null;
    }

    // Force flush and shutdown exporter
    return processor.forceFlush().then(function () {
      if (_exporter && typeof _exporter.shutdown === "function") {
        return _exporter.shutdown();
      }
      return Promise.resolve();
    });
  };

  return processor;
};

BatchSpanProcessor.prototype = {
  constructor: BatchSpanProcessor,
};

export { BatchSpanProcessor };
