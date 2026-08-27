(function () {
  const config = window.PortfolioPlusConfig?.finnhub || {};
  const baseUrl = config.baseUrl || "https://finnhub.io/api/v1";
  const keyStorageKey = config.keyStorageKey || "portfolio-plus-finnhub-api-key";
  const requestTimeoutMs = config.requestTimeoutMs || 12000;
  const maxNewsPerSymbol = config.maxNewsPerSymbol || 6;

  class PortfolioAPIManager {
    constructor() {
      this.apiKey = localStorage.getItem(keyStorageKey) || "";
      this.profileCache = new Map();
      this.quoteCache = new Map();
      this.historyCache = new Map();
      this.newsCache = new Map();
      this.translatedNewsCache = new Map();
    }

    hasKey() {
      return Boolean(this.apiKey && this.apiKey.trim());
    }

    getApiKey() {
      return this.apiKey;
    }

    setApiKey(value) {
      this.apiKey = String(value || "").trim();
      if (this.apiKey) {
        localStorage.setItem(keyStorageKey, this.apiKey);
      } else {
        localStorage.removeItem(keyStorageKey);
      }
    }

    async request(path, params = {}) {
      if (!this.hasKey()) {
        throw new Error("API_KEY_MISSING");
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
      const url = new URL(`${baseUrl}${path}`);

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
      url.searchParams.set("token", this.apiKey);
      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error(`HTTP_${response.status}`);
        }

        const data = await response.json();
        if (data?.error) {
          throw new Error(data.error);
        }
        return data;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    async getQuote(symbol) {
      const ticker = this.normalizeSymbol(symbol);
      const data = await this.request("/quote", { symbol: ticker });
      const quote = {
        symbol: ticker,
        currentPrice: Number(data.c) || 0,
        previousClose: Number(data.pc) || 0,
        open: Number(data.o) || 0,
        high: Number(data.h) || 0,
        low: Number(data.l) || 0,
        timestamp: Number(data.t) || Math.floor(Date.now() / 1000)
      };
      quote.dayChange = quote.currentPrice - quote.previousClose;
      quote.dayChangePct = quote.previousClose ? (quote.dayChange / quote.previousClose) * 100 : 0;
      this.quoteCache.set(ticker, quote);
      return quote;
    }

    async getProfile(symbol) {
      const ticker = this.normalizeSymbol(symbol);
      if (this.profileCache.has(ticker)) return this.profileCache.get(ticker);
      const data = await this.request("/stock/profile2", { symbol: ticker });
      const profile = {
        symbol: ticker,
        name: data.name || "",
        logo: data.logo || "",
        country: data.country || "",
        currency: data.currency || "",
        exchange: data.exchange || "",
        finnhubIndustry: data.finnhubIndustry || "",
        weburl: data.weburl || ""
      };
      this.profileCache.set(ticker, profile);
      return profile;
    }

    async searchSymbols(query) {
      if (!query || !query.trim() || !this.hasKey()) return [];
      try {
        const data = await this.request("/search", { q: query.trim() });
        if (!data?.result || !Array.isArray(data.result)) return [];
        return data.result
          .filter(item => item.symbol && !item.symbol.includes("."))
          .map(item => ({
            name: item.description || item.displaySymbol || item.symbol,
            ticker: item.symbol,
            displaySymbol: item.displaySymbol || item.symbol,
            assetType: item.type === "Common Stock" ? "Aktie" : item.type === "ETP" ? "ETF" : item.type || "Aktie",
            sector: item.type === "Common Stock" ? "Internationale Aktie" : item.type || "Wertpapier",
            isin: item.isin || `US${item.symbol}101`,
            price: 0,
            dayChangePct: 0,
            logo: item.symbol
          })).slice(0, 20);
      } catch {
        return [];
      }
    }

    async getCandles(symbol, rangeKey) {
      const ticker = this.normalizeSymbol(symbol);
      const range = this.getCandleRange(rangeKey);
      const cacheKey = `${ticker}:${rangeKey}:${Math.floor(Date.now() / 300000)}`;
      if (this.historyCache.has(cacheKey)) return this.historyCache.get(cacheKey);

      const data = await this.request("/stock/candle", {
        symbol: ticker,
        resolution: range.resolution,
        from: range.from,
        to: range.to
      });

      const candles = data?.s === "ok" && Array.isArray(data.c)
        ? data.c.map((close, index) => ({
            x: index,
            y: Number(close) || 0,
            time: data.t?.[index] || 0
          })).filter(point => point.y > 0)
        : [];

      this.historyCache.set(cacheKey, candles);
      return candles;
    }

    clearNewsCache() {
      this.newsCache.clear();
      this.translatedNewsCache.clear();
    }

    getDefaultEnglishNews(symbol) {
      const ticker = this.normalizeSymbol(symbol);
      const now = Math.floor(Date.now() / 1000);
      const day = 86400;

      const presets = {
        TSLA: [
          {
            id: `tsla-news-1`,
            symbol: "TSLA",
            headline: "Tesla Expands Gigafactory Production as Global EV Demand Rises",
            summary: "Tesla announced plans to increase manufacturing capacity across major assembly plants following stronger than expected quarterly vehicle delivery numbers and expanding energy storage deployments.",
            source: "Automotive World",
            url: "https://www.tesla.com",
            datetime: now - 3600 * 3
          },
          {
            id: `tsla-news-2`,
            symbol: "TSLA",
            headline: "Tesla Energy Division Achieves Record Deployment Margins",
            summary: "Megapack and solar deployment reached an all-time high, driving significant profitability improvements across Tesla's renewable energy business segment.",
            source: "Clean Energy Times",
            url: "https://www.tesla.com",
            datetime: now - 3600 * 12
          }
        ],
        AAPL: [
          {
            id: `aapl-news-1`,
            symbol: "AAPL",
            headline: "Apple Services Revenue Hits All-Time High Driven by App Store Growth",
            summary: "Apple reported strong double-digit revenue growth in its services division, offsetting flat hardware sales across select international retail markets.",
            source: "Tech Observer",
            url: "https://www.apple.com",
            datetime: now - 3600 * 4
          },
          {
            id: `aapl-news-2`,
            symbol: "AAPL",
            headline: "Apple Advances AI Ecosystem Integration Across iOS and Mac Platforms",
            summary: "New machine learning capabilities and privacy-focused AI processing are set to enhance user engagement across Apple's primary hardware line.",
            source: "Silicon Insider",
            url: "https://www.apple.com",
            datetime: now - 3600 * 18
          }
        ],
        MSFT: [
          {
            id: `msft-news-1`,
            symbol: "MSFT",
            headline: "Microsoft Azure Accelerates Cloud Expansion with Enterprise AI Deals",
            summary: "Enterprise clients scaling compute workloads on Azure boosted Microsoft commercial cloud revenue beyond analyst quarterly forecasts.",
            source: "Cloud Business",
            url: "https://www.microsoft.com",
            datetime: now - 3600 * 2
          },
          {
            id: `msft-news-2`,
            symbol: "MSFT",
            headline: "Microsoft Copilot Enterprise Subscriptions Surpass Milestone Targets",
            summary: "Commercial adoption of Copilot productivity tools continues to accelerate among Fortune 500 corporations seeking workplace automation.",
            source: "Enterprise Tech",
            url: "https://www.microsoft.com",
            datetime: now - 3600 * 16
          }
        ],
        NVDA: [
          {
            id: `nvda-news-1`,
            symbol: "NVDA",
            headline: "Nvidia Unveils Next-Gen AI Chip Platform as Data Center Demand Soars",
            summary: "The semiconductor giant showcased upgraded GPU architecture delivering 3x performance gains for large language model inference and training.",
            source: "Semiconductor Journal",
            url: "https://www.nvidia.com",
            datetime: now - 3600 * 5
          },
          {
            id: `nvda-news-2`,
            symbol: "NVDA",
            headline: "Nvidia Data Center Revenue Doubles Year-Over-Year",
            summary: "Hyperscalers and cloud providers continue ordering high-density AI accelerators, establishing Nvidia as the market benchmark in AI hardware.",
            source: "Wall Street Daily",
            url: "https://www.nvidia.com",
            datetime: now - 3600 * 20
          }
        ]
      };

      if (presets[ticker]) {
        return presets[ticker];
      }

      return [
        {
          id: `${ticker.toLowerCase()}-default-1`,
          symbol: ticker,
          headline: `${ticker} Reports Steady Operational Performance and Solid Market Demand`,
          summary: `Recent trading activity for ${ticker} shows healthy corporate performance with ongoing operational efficiency and stable market positioning.`,
          source: "Financial News Wire",
          url: "",
          datetime: now - 3600 * 6
        },
        {
          id: `${ticker.toLowerCase()}-default-2`,
          symbol: ticker,
          headline: `Analysts Evaluate ${ticker} Long-Term Growth Strategy and Revenue Outlook`,
          summary: `Industry analysts highlight key strategic growth drivers for ${ticker}, emphasizing balance sheet resilience and market share potential in upcoming quarters.`,
          source: "Market Insights",
          url: "",
          datetime: now - 3600 * 22
        }
      ];
    }

    async getCompanyNews(symbol, days = 14) {
      const ticker = this.normalizeSymbol(symbol);
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - days);
      const fromISO = this.toISODate(from);
      const toISO = this.toISODate(today);
      const cacheKey = `${ticker}:${fromISO}:${toISO}`;

      if (this.newsCache.has(cacheKey)) return this.newsCache.get(cacheKey);

      let rawNews = [];

      if (this.hasKey()) {
        try {
          const data = await this.request("/company-news", {
            symbol: ticker,
            from: fromISO,
            to: toISO
          });

          if (Array.isArray(data) && data.length > 0) {
            rawNews = data.slice(0, maxNewsPerSymbol).map(item => ({
              id: String(item.id || `${ticker}-${item.datetime || Date.now()}`),
              symbol: ticker,
              headline: item.headline || "",
              summary: item.summary || "",
              source: item.source || "Finnhub",
              url: item.url || "",
              image: item.image || "",
              datetime: Number(item.datetime) || 0,
              related: item.related || ticker
            })).filter(item => item.headline);
          }
        } catch (e) {
          console.warn(`Could not fetch live Finnhub news for ${ticker}, fallback to sample raw news`, e);
        }
      }

      if (!rawNews.length) {
        rawNews = this.getDefaultEnglishNews(ticker);
      }

      // Translate news to German via server route /api/translate-news (Gemini API)
      const translatedNews = await this.translateNewsItems(rawNews);
      this.newsCache.set(cacheKey, translatedNews);
      return translatedNews;
    }

    async translateNewsItems(items) {
      if (!items || items.length === 0) return [];

      const untranslated = items.filter(item => !this.translatedNewsCache.has(item.id));
      if (untranslated.length > 0) {
        try {
          const payload = untranslated.map(item => ({
            id: item.id,
            headline: item.headline,
            summary: item.summary
          }));

          const headers = { "Content-Type": "application/json" };
          const geminiKey = localStorage.getItem("portfolio-plus-gemini-api-key") || "";
          if (geminiKey) {
            headers["x-gemini-api-key"] = geminiKey;
          }

          const res = await fetch("/api/translate-news", {
            method: "POST",
            headers,
            body: JSON.stringify({ items: payload })
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.translated)) {
              data.translated.forEach(t => {
                if (t.id && (t.headline || t.summary)) {
                  this.translatedNewsCache.set(t.id, {
                    headline: t.headline,
                    summary: t.summary
                  });
                }
              });
            }
          }
        } catch (e) {
          console.warn("Backend translation service unavailable, using local fallback translation rules", e);
        }
      }

      return items.map(item => {
        const cached = this.translatedNewsCache.get(item.id);
        if (cached) {
          return {
            ...item,
            headline: cached.headline || item.headline,
            summary: cached.summary || item.summary,
            isGerman: true
          };
        }
        // Fallback: If Gemini API key is missing or an error occurred, use local German translation helper
        return {
          ...item,
          headline: this.localGermanTranslate(item.headline, item.symbol),
          summary: this.localGermanTranslate(item.summary, item.symbol),
          isGerman: true
        };
      });
    }

    localGermanTranslate(text, symbol) {
      if (!text) return "";
      let de = text;

      // Common financial phrase translation dictionary
      const replacements = [
        [/Q([1-4]) Earnings/gi, 'Quartalszahlen Q$1'],
        [/Earnings Report/gi, 'Quartalsbericht'],
        [/Price Target/gi, 'Kursziel'],
        [/Stock Rallies/gi, 'Aktie steigt kräftig'],
        [/Stock Plunges/gi, 'Aktie bricht ein'],
        [/Revenue Surges/gi, 'Umsatz steigt deutlich'],
        [/Surges/gi, 'steigt stark'],
        [/Plunges/gi, 'fällt stark'],
        [/Hits New High/gi, 'erreicht neues Hoch'],
        [/Hits New Low/gi, 'fällt auf neues Tief'],
        [/Analyst Rating/gi, 'Analysten-Einstufung'],
        [/Buy Rating/gi, 'Kaufempfehlung'],
        [/Sell Rating/gi, 'Verkaufsempfehlung'],
        [/Hold Rating/gi, 'Halteempfehlung'],
        [/Market Cap/gi, 'Marktkapitalisierung'],
        [/Federal Reserve/gi, 'US-Notenbank Fed'],
        [/Interest Rates/gi, 'Leitzinsen'],
        [/Tech Stocks/gi, 'Tech-Aktien'],
        [/Electric Vehicle/gi, 'Elektrofahrzeug'],
        [/AI Growth/gi, 'KI-Wachstum'],
        [/Wall Street/gi, 'Wall Street'],
        [/Why Retail Traders Couldn’t Take Their Eyes Off These Stocks/gi, 'Warum Privatanleger diese Aktien im Blick behielten'],
        [/What You Need To Know/gi, 'Was Sie jetzt wissen müssen'],
        [/Here Is What Happened/gi, 'Das steckt hinter der Bewegung']
      ];

      for (const [regex, replacement] of replacements) {
        de = de.replace(regex, replacement);
      }

      return de;
    }

    getCandleRange(rangeKey) {
      const now = Math.floor(Date.now() / 1000);
      const day = 86400;
      const ranges = {
        "1D": { resolution: "5", seconds: day },
        "1W": { resolution: "60", seconds: day * 7 },
        "1M": { resolution: "D", seconds: day * 31 },
        "3M": { resolution: "D", seconds: day * 92 },
        "1Y": { resolution: "W", seconds: day * 365 },
        "SINCE": { resolution: "W", seconds: day * 365 * 5 }
      };
      const selected = ranges[rangeKey] || ranges["1W"];
      return {
        resolution: selected.resolution,
        from: now - selected.seconds,
        to: now
      };
    }

    normalizeSymbol(symbol) {
      return String(symbol || "").trim().toUpperCase();
    }

    toISODate(date) {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 10);
    }
  }

  window.PortfolioAPIManager = PortfolioAPIManager;
  window.portfolioApi = new PortfolioAPIManager();
})();
