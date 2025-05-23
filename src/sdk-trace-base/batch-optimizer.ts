// IE11-compatible Batch Processing Optimization

import {
  ReadableSpan,
  SpanExporter,
  ExportResult,
  ExportResultCode,
} from "./types";
import { objectAssign } from "./util";

// Batch optimization strategies
export var BatchOptimizer = {
  // Optimize batch size based on span characteristics
  optimizeBatchSize: function (spans, baseSize) {
    if (!spans || spans.length === 0) {
      return baseSize;
    }

    var totalSize = 0;
    var avgAttributeCount = 0;
    var avgEventCount = 0;

    // Calculate span complexity
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];

      // Estimate span size
      var spanSize = 100; // Base span size

      if (span.attributes) {
        var attrCount = Object.keys(span.attributes).length;
        avgAttributeCount += attrCount;
        spanSize += attrCount * 50; // Estimate 50 bytes per attribute
      }

      if (span.events) {
        avgEventCount += span.events.length;
        spanSize += span.events.length * 100; // Estimate 100 bytes per event
      }

      totalSize += spanSize;
    }

    avgAttributeCount = Math.floor(avgAttributeCount / spans.length);
    avgEventCount = Math.floor(avgEventCount / spans.length);

    // Adjust batch size based on complexity
    var complexityFactor = 1.0;
    if (avgAttributeCount > 10 || avgEventCount > 5) {
      complexityFactor = 0.7; // Reduce batch size for complex spans
    } else if (avgAttributeCount < 3 && avgEventCount < 2) {
      complexityFactor = 1.3; // Increase batch size for simple spans
    }

    var optimizedSize = Math.floor(baseSize * complexityFactor);

    // Ensure reasonable bounds
    return Math.max(50, Math.min(1000, optimizedSize));
  },

  // Sort spans for optimal batching
  sortSpansForBatching: function (spans) {
    if (!spans || spans.length <= 1) {
      return spans;
    }

    // Sort by trace ID first, then by start time
    return spans.slice().sort(function (a, b) {
      var aContext = a.spanContext();
      var bContext = b.spanContext();

      // Compare trace IDs
      if (aContext.traceId < bContext.traceId) return -1;
      if (aContext.traceId > bContext.traceId) return 1;

      // Same trace, compare start times
      var aStart = a.startTime || 0;
      var bStart = b.startTime || 0;
      return aStart - bStart;
    });
  },

  // Group spans by trace for efficient processing
  groupSpansByTrace: function (spans) {
    var traceGroups = {};

    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      var traceId = span.spanContext().traceId;

      if (!traceGroups[traceId]) {
        traceGroups[traceId] = [];
      }

      traceGroups[traceId].push(span);
    }

    return traceGroups;
  },

  // Create optimized batches
  createOptimizedBatches: function (spans, maxBatchSize) {
    if (!spans || spans.length === 0) {
      return [];
    }

    // Sort spans for optimal batching
    var sortedSpans = BatchOptimizer.sortSpansForBatching(spans);

    // Optimize batch size
    var optimizedBatchSize = BatchOptimizer.optimizeBatchSize(
      sortedSpans,
      maxBatchSize
    );

    var batches = [];
    var currentBatch = [];

    for (var i = 0; i < sortedSpans.length; i++) {
      currentBatch.push(sortedSpans[i]);

      if (currentBatch.length >= optimizedBatchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    // Add remaining spans
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  },
};

// Enhanced batch span processor with optimization
export var OptimizedBatchSpanProcessor = function (
  exporter: SpanExporter,
  config?: any
): any {
  var processor = this;
  var _exporter = exporter;
  var _isShutdown = false;

  // Enhanced configuration
  var _config = config || {};
  var _maxExportBatchSize = _config.maxExportBatchSize || 512;
  var _scheduledDelayMillis = _config.scheduledDelayMillis || 5000;
  var _exportTimeoutMillis = _config.exportTimeoutMillis || 30000;
  var _maxQueueSize = _config.maxQueueSize || 2048;
  var _enableOptimization = _config.enableOptimization !== false;

  // Internal state with optimization
  var _spanQueue = [];
  var _timer = null;
  var _isExporting = false;
  var _exportStats = {
    totalExports: 0,
    totalSpans: 0,
    totalErrors: 0,
    avgBatchSize: 0,
    avgExportTime: 0,
  };

  // Optimized export function
  function exportBatchOptimized() {
    if (_isShutdown || _isExporting || _spanQueue.length === 0) {
      return;
    }

    _isExporting = true;
    var exportStartTime = Date.now();

    // Create optimized batches
    var batches;
    if (_enableOptimization) {
      batches = BatchOptimizer.createOptimizedBatches(
        _spanQueue,
        _maxExportBatchSize
      );
    } else {
      // Fallback to simple batching
      var batchSize = Math.min(_maxExportBatchSize, _spanQueue.length);
      batches = [_spanQueue.splice(0, batchSize)];
    }

    if (batches.length === 0) {
      _isExporting = false;
      return;
    }

    // Clear queue for optimized batches
    if (_enableOptimization) {
      _spanQueue = [];
    }

    var completedBatches = 0;
    var totalBatches = batches.length;
    var hasError = false;

    // Export all batches
    for (var i = 0; i < batches.length; i++) {
      var batch = batches[i];

      (function (currentBatch) {
        var timeoutId = setTimeout(function () {
          hasError = true;
          if (typeof console !== "undefined" && console.warn) {
            console.warn(
              "Batch export timeout after",
              _exportTimeoutMillis,
              "ms"
            );
          }
          handleBatchComplete();
        }, _exportTimeoutMillis);

        _exporter.export(currentBatch, function (result) {
          clearTimeout(timeoutId);

          if (result.error) {
            hasError = true;
            _exportStats.totalErrors++;
            if (typeof console !== "undefined" && console.error) {
              console.error("Failed to export batch:", result.error);
            }
          }

          _exportStats.totalSpans += currentBatch.length;
          handleBatchComplete();
        });
      })(batch);
    }

    function handleBatchComplete() {
      completedBatches++;

      if (completedBatches >= totalBatches) {
        var exportTime = Date.now() - exportStartTime;

        // Update statistics
        _exportStats.totalExports++;
        _exportStats.avgExportTime =
          (_exportStats.avgExportTime * (_exportStats.totalExports - 1) +
            exportTime) /
          _exportStats.totalExports;
        _exportStats.avgBatchSize =
          _exportStats.totalSpans / _exportStats.totalExports;

        _isExporting = false;
        scheduleNextExport();
      }
    }
  }

  function scheduleNextExport() {
    if (_isShutdown || _timer || _spanQueue.length === 0) {
      return;
    }

    _timer = setTimeout(function () {
      _timer = null;
      exportBatchOptimized();
    }, _scheduledDelayMillis);
  }

  processor.forceFlush = function () {
    return new Promise(function (resolve) {
      if (_isShutdown) {
        resolve();
        return;
      }

      if (_timer) {
        clearTimeout(_timer);
        _timer = null;
      }

      var flushBatches = function () {
        if (_spanQueue.length === 0 || _isExporting) {
          resolve();
          return;
        }

        exportBatchOptimized();

        var checkComplete = function () {
          if (!_isExporting) {
            flushBatches();
          } else {
            setTimeout(checkComplete, 10);
          }
        };

        setTimeout(checkComplete, 10);
      };

      flushBatches();
    });
  };

  processor.onStart = function (span, parentContext) {
    // Optimized processor doesn't need to do anything on start
  };

  processor.onEnd = function (span) {
    if (_isShutdown) {
      return;
    }

    // Add span to queue with optimization
    if (_spanQueue.length >= _maxQueueSize) {
      _spanQueue.shift(); // Drop oldest span

      if (typeof console !== "undefined" && console.warn) {
        console.warn("Span queue full, dropping oldest span");
      }
    }

    _spanQueue.push(span);

    // Trigger export based on optimization
    var shouldExportNow = false;
    if (_enableOptimization) {
      // Smart triggering based on queue characteristics
      var queueComplexity = BatchOptimizer.optimizeBatchSize(
        _spanQueue,
        _maxExportBatchSize
      );
      shouldExportNow = _spanQueue.length >= queueComplexity;
    } else {
      shouldExportNow = _spanQueue.length >= _maxExportBatchSize;
    }

    if (shouldExportNow) {
      if (_timer) {
        clearTimeout(_timer);
        _timer = null;
      }
      exportBatchOptimized();
    } else {
      scheduleNextExport();
    }
  };

  processor.shutdown = function () {
    if (_isShutdown) {
      return Promise.resolve();
    }

    _isShutdown = true;

    if (_timer) {
      clearTimeout(_timer);
      _timer = null;
    }

    return processor.forceFlush().then(function () {
      if (_exporter && typeof _exporter.shutdown === "function") {
        return _exporter.shutdown();
      }
      return Promise.resolve();
    });
  };

  // Get export statistics
  processor.getExportStats = function () {
    return objectAssign({}, _exportStats);
  };

  // Reset statistics
  processor.resetStats = function () {
    _exportStats = {
      totalExports: 0,
      totalSpans: 0,
      totalErrors: 0,
      avgBatchSize: 0,
      avgExportTime: 0,
    };
  };

  return processor;
};

OptimizedBatchSpanProcessor.prototype = {
  constructor: OptimizedBatchSpanProcessor,
};

export { BatchOptimizer, OptimizedBatchSpanProcessor };
