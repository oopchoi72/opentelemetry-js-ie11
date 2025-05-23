// WebSocket enhancements for IE11
// IE11 has WebSocket but may need some enhancements

export function initializeWebSocketPolyfill(): void {
  // IE11 has WebSocket support but may need ArrayBuffer support
  if (typeof WebSocket !== "undefined") {
    // Check if WebSocket supports binary data properly
    const originalWebSocket = WebSocket;

    // Enhance WebSocket if needed
    if (!(originalWebSocket.prototype as any).sendArrayBuffer) {
      (originalWebSocket.prototype as any).sendArrayBuffer = function (
        data: ArrayBuffer
      ) {
        if (this.readyState === WebSocket.OPEN) {
          this.send(data);
        }
      };
    }
  }

  // ArrayBuffer polyfill for older IE11 versions
  if (typeof ArrayBuffer === "undefined") {
    // Basic ArrayBuffer polyfill (very simplified)
    (window as any).ArrayBuffer = function ArrayBufferPolyfill(length: number) {
      const buffer = new Array(length);
      for (let i = 0; i < length; i++) {
        buffer[i] = 0;
      }
      Object.defineProperty(buffer, "byteLength", {
        value: length,
        writable: false,
      });
      return buffer;
    };
  }

  // Uint8Array polyfill if missing
  if (typeof Uint8Array === "undefined") {
    (window as any).Uint8Array = function Uint8ArrayPolyfill(
      buffer: any,
      offset?: number,
      length?: number
    ) {
      if (buffer instanceof Array || typeof buffer === "number") {
        const arr = typeof buffer === "number" ? new Array(buffer) : buffer;
        const start = offset || 0;
        const end = length ? start + length : arr.length;

        const result: any = arr.slice(start, end);
        result.buffer = arr;
        result.byteLength = result.length;
        result.byteOffset = start;

        return result;
      }
      return buffer;
    };
  }

  console.log("WebSocket polyfills loaded for IE11");
}
