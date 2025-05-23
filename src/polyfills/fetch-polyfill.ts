// Fetch polyfill for IE11
import "whatwg-fetch";

// Additional XMLHttpRequest enhancements for IE11
export function enhanceXHR(): void {
  // Ensure XMLHttpRequest supports responseType if missing
  if (typeof XMLHttpRequest !== "undefined") {
    const xhr = new XMLHttpRequest();
    if (!("responseType" in xhr)) {
      Object.defineProperty(XMLHttpRequest.prototype, "responseType", {
        get: function () {
          return this._responseType || "";
        },
        set: function (value: string) {
          this._responseType = value;
        },
        enumerable: true,
        configurable: true,
      });
    }
  }
}

// Initialize fetch polyfill
export function initializeFetchPolyfill(): void {
  enhanceXHR();
  console.log("Fetch polyfill loaded for IE11");
}
