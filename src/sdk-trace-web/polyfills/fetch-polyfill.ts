// IE11-compatible Fetch API Polyfill using XMLHttpRequest

// Response interface for IE11 compatibility
export var Response = function (body?: any, init?: any) {
  var response = this;
  var _body = body;
  var _status = (init && init.status) || 200;
  var _statusText = (init && init.statusText) || "OK";
  var _headers = new Headers((init && init.headers) || {});
  var _ok = _status >= 200 && _status < 300;

  response.status = _status;
  response.statusText = _statusText;
  response.ok = _ok;
  response.headers = _headers;

  response.text = function () {
    return Promise.resolve(typeof _body === "string" ? _body : String(_body));
  };

  response.json = function () {
    return response.text().then(function (text) {
      return JSON.parse(text);
    });
  };

  response.blob = function () {
    return Promise.resolve(new Blob([_body]));
  };

  response.arrayBuffer = function () {
    return Promise.reject(new Error("ArrayBuffer not supported in IE11"));
  };

  response.clone = function () {
    return new Response(_body, {
      status: _status,
      statusText: _statusText,
      headers: _headers,
    });
  };

  return response;
};

// Headers interface for IE11 compatibility
export var Headers = function (init?: any) {
  var headers = this;
  var _headers = {};

  // Initialize with provided headers
  if (init) {
    if (typeof init === "object") {
      for (var key in init) {
        if (Object.prototype.hasOwnProperty.call(init, key)) {
          _headers[key.toLowerCase()] = String(init[key]);
        }
      }
    }
  }

  headers.append = function (name, value) {
    var normalizedName = name.toLowerCase();
    if (_headers[normalizedName]) {
      _headers[normalizedName] += ", " + String(value);
    } else {
      _headers[normalizedName] = String(value);
    }
  };

  headers.delete = function (name) {
    delete _headers[name.toLowerCase()];
  };

  headers.get = function (name) {
    return _headers[name.toLowerCase()] || null;
  };

  headers.has = function (name) {
    return Object.prototype.hasOwnProperty.call(_headers, name.toLowerCase());
  };

  headers.set = function (name, value) {
    _headers[name.toLowerCase()] = String(value);
  };

  headers.forEach = function (callback, thisArg) {
    for (var name in _headers) {
      if (Object.prototype.hasOwnProperty.call(_headers, name)) {
        callback.call(thisArg, _headers[name], name, headers);
      }
    }
  };

  return headers;
};

// Request interface for IE11 compatibility
export var Request = function (input, init) {
  var request = this;
  var _url = typeof input === "string" ? input : input.url;
  var _method = (init && init.method) || "GET";
  var _headers = new Headers((init && init.headers) || {});
  var _body = (init && init.body) || null;

  request.url = _url;
  request.method = _method.toUpperCase();
  request.headers = _headers;
  request.body = _body;

  request.clone = function () {
    return new Request(_url, {
      method: _method,
      headers: _headers,
      body: _body,
    });
  };

  return request;
};

// IE11-compatible fetch implementation using XMLHttpRequest
export var IE11FetchPolyfill = {
  // Main fetch function
  fetch: function (input, init) {
    return new Promise(function (resolve, reject) {
      var request =
        typeof input === "string" ? new Request(input, init) : input;
      var xhr = new XMLHttpRequest();

      // Configure request
      try {
        xhr.open(request.method, request.url, true);
      } catch (error) {
        reject(new TypeError("Failed to open request: " + error.message));
        return;
      }

      // Set headers
      if (request.headers) {
        request.headers.forEach(function (value, name) {
          try {
            xhr.setRequestHeader(name, value);
          } catch (error) {
            // Ignore header setting errors for restricted headers
            if (typeof console !== "undefined" && console.warn) {
              console.warn("Cannot set header " + name + ": " + error.message);
            }
          }
        });
      }

      // Handle response
      xhr.onload = function () {
        var responseHeaders = {};
        var headerLines = xhr.getAllResponseHeaders().split("\r\n");

        for (var i = 0; i < headerLines.length; i++) {
          var line = headerLines[i].trim();
          if (line) {
            var colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
              var name = line.substring(0, colonIndex).trim();
              var value = line.substring(colonIndex + 1).trim();
              responseHeaders[name] = value;
            }
          }
        }

        var response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: responseHeaders,
        });

        resolve(response);
      };

      xhr.onerror = function () {
        reject(new TypeError("Network request failed"));
      };

      xhr.ontimeout = function () {
        reject(new TypeError("Network request timed out"));
      };

      xhr.onabort = function () {
        reject(new TypeError("Network request aborted"));
      };

      // Set timeout if specified
      if (init && init.timeout) {
        xhr.timeout = init.timeout;
      }

      // Send request
      try {
        xhr.send(request.body);
      } catch (error) {
        reject(new TypeError("Failed to send request: " + error.message));
      }
    });
  },

  // Install polyfill globally
  install: function () {
    if (typeof window !== "undefined" && !window.fetch) {
      window.fetch = IE11FetchPolyfill.fetch;
      window.Headers = Headers;
      window.Request = Request;
      window.Response = Response;
    }
  },

  // Check if fetch is supported
  isSupported: function () {
    return typeof window !== "undefined" && typeof window.fetch === "function";
  },
};

// Auto-install if fetch is not available
if (typeof window !== "undefined" && !window.fetch) {
  IE11FetchPolyfill.install();
}

export { IE11FetchPolyfill };
