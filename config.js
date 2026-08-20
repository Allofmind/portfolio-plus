(function () {
  const win = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : globalThis;

  try {
    if (win) {
      var originalFetch = win.fetch;
      var getDescriptor = function (obj, prop) {
        var current = obj;
        while (current) {
          var desc = Object.getOwnPropertyDescriptor(current, prop);
          if (desc) return desc;
          current = Object.getPrototypeOf(current);
        }
        return null;
      };

      var desc = getDescriptor(win, "fetch");
      if (!desc || (desc.get && !desc.set) || !desc.writable) {
        try {
          Object.defineProperty(win, "fetch", {
            get: function () {
              return originalFetch;
            },
            set: function (fn) {
              originalFetch = fn;
            },
            configurable: true,
            enumerable: true
          });
        } catch (e) {
          // Ignore if property redefinition is restricted
        }
      }
    }
  } catch (err) {
    // Ignore errors in safeguard setup
  }

  win.PortfolioPlusConfig = {
    finnhub: {
      baseUrl: "https://finnhub.io/api/v1",
      keyStorageKey: "portfolio-plus-finnhub-api-key",
      refreshIntervalMs: 60000,
      requestTimeoutMs: 12000,
      maxNewsPerSymbol: 6
    }
  };
})();

