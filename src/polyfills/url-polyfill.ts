// URL API polyfill for IE11
// IE11 doesn't support the URL constructor

export function initializeURLPolyfill(): void {
  if (typeof URL === "undefined" || !URL) {
    // Simple URL polyfill for IE11
    (window as any).URL = function URLPolyfill(url: string, base?: string) {
      // Create a temporary anchor element to parse URL
      const anchor = document.createElement("a");
      anchor.href = url;

      if (base) {
        const baseAnchor = document.createElement("a");
        baseAnchor.href = base;
        anchor.href = anchor.href; // Resolve relative to base
      }

      return {
        href: anchor.href,
        protocol: anchor.protocol,
        hostname: anchor.hostname,
        port: anchor.port,
        pathname: anchor.pathname,
        search: anchor.search,
        hash: anchor.hash,
        host: anchor.host,
        origin: anchor.protocol + "//" + anchor.host,
        toString: function () {
          return anchor.href;
        },
      };
    };

    // Static createObjectURL for Blob support
    (window as any).URL.createObjectURL = function (blob: any) {
      if (typeof (window as any).createObjectURL !== "undefined") {
        return (window as any).createObjectURL(blob);
      }
      throw new Error("URL.createObjectURL is not supported in this browser");
    };

    (window as any).URL.revokeObjectURL = function (url: string) {
      if (typeof (window as any).revokeObjectURL !== "undefined") {
        return (window as any).revokeObjectURL(url);
      }
    };
  }

  console.log("URL polyfill loaded for IE11");
}
