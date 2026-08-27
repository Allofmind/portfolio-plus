const STORAGE_KEY = "portfolio-plus-ledger-v1";
const LEGACY_STORAGE_KEY = "portfolio-plus-positions-v2";

const STOCK_CATALOG = (typeof window !== "undefined" && window.STOCK_CATALOG) ? window.STOCK_CATALOG : [
  { name: "Cloudflare Inc. (Class A)", ticker: "NET", assetType: "Aktie", sector: "Cloud & Cybersecurity", price: 272.95, dayChangePct: 2.59, isin: "US18915M1071" },
  { name: "Tesla Inc.", ticker: "TSLA", assetType: "Aktie", sector: "Automobil / EV", price: 286.55, dayChangePct: 1.89, isin: "US88160R1014" },
  { name: "CrowdStrike Holdings", ticker: "CRWD", assetType: "Aktie", sector: "Cybersecurity", price: 265.40, dayChangePct: 1.85, isin: "US22788C1053" },
  { name: "Palantir Technologies", ticker: "PLTR", assetType: "Aktie", sector: "Software / KI Analytics", price: 28.90, dayChangePct: 4.20, isin: "US69608A1088" },
  { name: "NVIDIA Corporation", ticker: "NVDA", assetType: "Aktie", sector: "Halbleiter / KI", price: 128.40, dayChangePct: 3.15, isin: "US67066G1040" },
  { name: "Apple Inc.", ticker: "AAPL", assetType: "Aktie", sector: "Unterhaltungselektronik", price: 224.30, dayChangePct: 0.85, isin: "US0378331005" },
  { name: "Microsoft Corporation", ticker: "MSFT", assetType: "Aktie", sector: "Software / Cloud", price: 448.20, dayChangePct: -0.42, isin: "US5949181045" },
  { name: "Amazon.com Inc.", ticker: "AMZN", assetType: "Aktie", sector: "E-Commerce / Cloud", price: 186.50, dayChangePct: 1.12, isin: "US0231351067" },
  { name: "Alphabet Inc. (Google A)", ticker: "GOOGL", assetType: "Aktie", sector: "Internet / KI", price: 178.90, dayChangePct: 0.64, isin: "US02079K3059" },
  { name: "Meta Platforms Inc.", ticker: "META", assetType: "Aktie", sector: "Social Media / KI", price: 512.40, dayChangePct: 2.45, isin: "US30303M1027" },
  { name: "SAP SE", ticker: "SAP", assetType: "Aktie", sector: "Unternehmenssoftware", price: 198.60, dayChangePct: 0.75, isin: "DE0007164600" },
  { name: "Rheinmetall AG", ticker: "RHM", assetType: "Aktie", sector: "Rüstung & Industrie", price: 492.00, dayChangePct: 2.80, isin: "DE0007030009" },
  { name: "ASML Holding NV", ticker: "ASML", assetType: "Aktie", sector: "Halbleiter-Ausrüstung", price: 812.00, dayChangePct: 1.45, isin: "NL0010273215" },
  { name: "Novo Nordisk B", ticker: "NOVO B", assetType: "Aktie", sector: "Pharma / Diabetes", price: 124.60, dayChangePct: -0.80, isin: "DK0062498333" },
  { name: "Bitcoin (BTC / EUR)", ticker: "BTC", assetType: "Krypto", sector: "Kryptowährung", price: 58400.00, dayChangePct: 2.85, isin: "BTC-EUR" }
];

const state = {
  theme: localStorage.getItem("portfolio-theme") || "dark",
  range: localStorage.getItem("portfolio-range") || "1W",
  view: localStorage.getItem("portfolio-view") || "dashboard",
  sort: "value-desc",
  search: "",
  searchQuery: "",
  searchCategory: "all",
  watchlist: JSON.parse(localStorage.getItem("portfolio-watchlist-tickers") || '["TSLA", "NVDA", "BTC"]'),
  selectedId: null,
  editingId: null,
  editorReturnToDetail: false,
  detailMode: "position",
  scrollLockY: 0,
  datePickerView: new Date(),
  transactions: loadTransactions(),
  instruments: []
};

const newsTemplates = {
  MSFT: {
    headline: "Cloud-Sparte treibt Microsoft-Wachstum weiter an",
    summary: "Microsoft überzeugt mit stabilen Zahlen im Cloud-Segment Azure. Die Aktie bleibt ein solider Kernwert im Depot.",
    source: "Finanz-Analyse",
    article: [
      "Microsoft zeigt erneut Stärke im Cloud-Geschäft. Die stetige Nachfrage nach Unternehmensinfrastruktur und KI-Diensten sorgt für verlässliche Umsätze.",
      "Im Vergleich zu volatileren Tech-Titeln wirkt Microsoft eher wie ein stabiler Anker. Das Unternehmen liefert kontinuierliche Performance statt übertriebener Spekulation.",
      "Für dein Portfolio bedeutet das: verlässliche Struktur, solide Margen und eine ausgewogene Risikoverteilung."
    ],
    focus: "Stabilität"
  },
  NVDA: {
    headline: "KI-Chip-Nachfrage bleibt ungebrochen hoch",
    summary: "NVIDIA verzeichnet weiterhin enorme Nachfrage nach Rechenzentrum-Hardware. Hohe Dynamik prägt den Kursverlauf.",
    source: "Marktbeobachtung",
    article: [
      "NVIDIA ist eine der dynamischsten Positionen im Tech-Sektor. Die weltweite Umrüstung auf KI-Rechenzentren treibt das Geschäft weiter an.",
      "Das sorgt für starke Kurssprünge, bedeutet aber auch eine höhere Schwankungsbreite bei Marktbereinigungen.",
      "Für dein Depot ist NVIDIA ein zentraler Wachstumstreiber mit hoher Volatilität und starker Zukunftsausrichtung."
    ],
    focus: "Momentum"
  },
  AAPL: {
    headline: "Apple überzeugt mit robustem Ökosystem",
    summary: "Service-Einnahmen und stabile iPhone-Verkäufe stützen den Kurs. Apple liefert verlässliche Qualität.",
    source: "Marktbeobachtung",
    article: [
      "Apple profitiert von seinem stark verankerten Ökosystem. Kundenbindung und wachsende Einnahmen aus Abo-Diensten sorgen für finanzielle Stabilität.",
      "In deinem Depot bildet Apple eine defensive Komponente mit hoher Cashflow-Generierung.",
      "Als Qualitätswert eignet sich die Position hervorragend für ein langfristig orientiertes Broker-Depot."
    ],
    focus: "Qualität"
  },
  TSLA: {
    headline: "Tesla bewegt sich in dynamischem Marktumfeld",
    summary: "Produktionszahlen und Preisanpassungen beeinflussen die Marge. Die Aktie bleibt bewegungsfreudig.",
    source: "Automotive-Analyse",
    article: [
      "Tesla reagiert stark auf Marktstimmungen und Makrodaten. Die Kombination aus Elektrofahrzeugen und Energie-Sparte birgt hohe Chancen bei entsprechender Schwankung.",
      "Reaktionen auf Quartalsmeldungen fallen oft spürbar aus, was den Titel für aktive Anleger spannend macht.",
      "Im Depot fungiert Tesla als trendstarker Wert mit erhöhtem Risikoprofil."
    ],
    focus: "Volatilität"
  }
};

const viewMeta = {
  dashboard: {
    eyebrow: "Übersicht",
    title: "Dein Portfolio auf einen Blick",
    subtitle: "Wert, Bewegung und Fokus im modernen Broker-Design."
  },
  portfolio: {
    eyebrow: "Portfolio",
    title: "Dein Portfolio in der Übersicht",
    subtitle: "Kompakte Depotleiste & tabellarische Positionsliste im Scalable-Look."
  },
  watchlist: {
    eyebrow: "Watchlist",
    title: "Deine Watchlist",
    subtitle: "Markierte Favoriten mit Livekursen und Sparklines."
  },
  search: {
    eyebrow: "Suche",
    title: "Wertpapiere & Märkte suchen",
    subtitle: "Finde Aktien, ETFs, Derivate und Krypto im Scalable Capital Broker-Design."
  },
  news: {
    eyebrow: "News",
    title: "Depot-News auf Deutsch",
    subtitle: "Automatisch übersetzte Schlagzeilen und Zusammenfassungen zu deinen Werten."
  },
  settings: {
    eyebrow: "Einstellungen",
    title: "App-Einstellungen",
    subtitle: "Farbschema, Dark Mode und Finnhub Live-Schnittstelle verwalten."
  }
};

const els = {
  summaryGrid: document.getElementById("summaryGrid"),
  depotBar: document.getElementById("depotBar"),
  sidebarTotal: document.getElementById("sidebarTotal"),
  sidebarChange: document.getElementById("sidebarChange"),
  dashboardChart: document.getElementById("dashboardChart"),
  dashboardChartMeta: document.getElementById("dashboardChartMeta"),
  dashboardRangeSwitch: document.getElementById("dashboardRangeSwitch"),
  dashboardTopList: document.getElementById("dashboardTopList"),
  portfolioChart: document.getElementById("portfolioChart"),
  portfolioChartMeta: document.getElementById("portfolioChartMeta"),
  portfolioInsights: document.getElementById("portfolioInsights"),
  positionsList: document.getElementById("positionsList"),
  watchlistSummary: document.getElementById("watchlistSummary"),
  watchlistList: document.getElementById("watchlistList"),
  newsList: document.getElementById("newsList"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  rangeSwitch: document.getElementById("rangeSwitch"),
  detailRangeSwitch: document.getElementById("detailRangeSwitch"),
  themeToggle: document.getElementById("themeToggle"),
  refreshBtn: document.getElementById("refreshBtn"),
  addPositionBtn: document.getElementById("addPositionBtn"),
  detailBackdrop: document.getElementById("detailBackdrop"),
  detailChartHead: document.getElementById("detailChartHead"),
  detailChartWrap: document.getElementById("detailChartWrap"),
  detailEyebrow: document.getElementById("detailEyebrow"),
  detailBadge: document.getElementById("detailBadge"),
  detailTitle: document.getElementById("detailTitle"),
  detailSubtitle: document.getElementById("detailSubtitle"),
  detailMetrics: document.getElementById("detailMetrics"),
  detailTransactionsWrap: document.getElementById("detailTransactionsWrap"),
  detailTransactions: document.getElementById("detailTransactions"),
  detailChartMeta: document.getElementById("detailChartMeta"),
  detailChart: document.getElementById("detailChart"),
  detailArticle: document.getElementById("detailArticle"),
  addTransactionBtn: document.getElementById("addTransactionBtn"),
  editPositionBtn: document.getElementById("editPositionBtn"),
  deletePositionBtn: document.getElementById("deletePositionBtn"),
  closeDetail: document.getElementById("closeDetail"),
  toggleWatch: document.getElementById("toggleWatch"),
  editorBackdrop: document.getElementById("editorBackdrop"),
  editorTitle: document.getElementById("editorTitle"),
  editorSubtitle: document.getElementById("editorSubtitle"),
  closeEditor: document.getElementById("closeEditor"),
  cancelEditor: document.getElementById("cancelEditor"),
  positionForm: document.getElementById("positionForm"),
  editorId: document.getElementById("editorId"),
  fieldName: document.getElementById("fieldName"),
  fieldTicker: document.getElementById("fieldTicker"),
  fieldType: document.getElementById("fieldType"),
  fieldSector: document.getElementById("fieldSector"),
  fieldTransactionType: document.getElementById("fieldTransactionType"),
  fieldQty: document.getElementById("fieldQty"),
  fieldBuyPrice: document.getElementById("fieldBuyPrice"),
  fieldCurrentPrice: document.getElementById("fieldCurrentPrice"),
  fieldDayChangePct: document.getElementById("fieldDayChangePct"),
  fieldBuyDate: document.getElementById("fieldBuyDate"),
  fieldBuyDateDisplay: document.getElementById("fieldBuyDateDisplay"),
  fieldBuyTime: document.getElementById("fieldBuyTime"),
  fieldBuyTimeDisplay: document.getElementById("fieldBuyTimeDisplay"),
  openDatePicker: document.getElementById("openDatePicker"),
  openTimePicker: document.getElementById("openTimePicker"),
  datePickerPopover: document.getElementById("datePickerPopover"),
  timePickerPopover: document.getElementById("timePickerPopover"),
  datePickerLabel: document.getElementById("datePickerLabel"),
  timePickerLabel: document.getElementById("timePickerLabel"),
  dateGrid: document.getElementById("dateGrid"),
  hourGrid: document.getElementById("hourGrid"),
  minuteGrid: document.getElementById("minuteGrid"),
  datePrev: document.getElementById("datePrev"),
  dateNext: document.getElementById("dateNext"),
  timePrev: document.getElementById("timePrev"),
  timeNext: document.getElementById("timeNext"),
  dateClear: document.getElementById("dateClear"),
  dateToday: document.getElementById("dateToday"),
  timeClear: document.getElementById("timeClear"),
  timeNow: document.getElementById("timeNow"),
  fieldFees: document.getElementById("fieldFees"),
  fieldWatch: document.getElementById("fieldWatch"),
  fieldNote: document.getElementById("fieldNote"),
  navLinks: [...document.querySelectorAll(".nav-link")],
  viewEyebrow: document.getElementById("viewEyebrow"),
  viewTitle: document.getElementById("viewTitle"),
  viewSubtitle: document.getElementById("viewSubtitle"),
  dashboardView: document.getElementById("dashboardView"),
  portfolioView: document.getElementById("portfolioView"),
  watchlistView: document.getElementById("watchlistView"),
  searchView: document.getElementById("searchView"),
  newsView: document.getElementById("newsView"),
  settingsView: document.getElementById("settingsView"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
  geminiApiKeyInput: document.getElementById("geminiApiKeyInput"),
  saveGeminiApiKeyBtn: document.getElementById("saveGeminiApiKeyBtn"),
  geminiStatus: document.getElementById("geminiStatus"),
  connectionStatus: document.getElementById("connectionStatus"),
  autoRefreshSelect: document.getElementById("autoRefreshSelect"),
  autoRefreshStatus: document.getElementById("autoRefreshStatus"),
  autoRefreshPill: document.getElementById("autoRefreshPill")
};

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric"
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

const chartRanges = {
  "1D": { points: 48, label: "1T" },
  "1W": { points: 64, label: "1W" },
  "1M": { points: 100, label: "1M" },
  "3M": { points: 150, label: "3M" },
  "1Y": { points: 240, label: "1J" },
  "SINCE": { points: 180, label: "Seit Kauf" }
};

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function currentTimeISO() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function toLocalISO(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseISODate(iso) {
  if (!iso) return new Date();
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function money(value) {
  return euro.format(normalizeNumber(value));
}

function signedMoney(value) {
  return `${value >= 0 ? "+" : ""}${money(value)}`;
}

function signedPct(value) {
  const fixed = Math.abs(value).toFixed(2).replace(".", ",");
  return `${value >= 0 ? "+" : "-"}${fixed}%`;
}

function rangeLabel(key) {
  return chartRanges[key]?.label || "1W";
}

function formatDateDisplay(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

function parseDateInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "" : raw;
  }

  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return "";

  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return "";
  }

  return toLocalISO(date);
}

function parseTimeInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatTimeDisplay(value) {
  return parseTimeInput(value) || "";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function badgeStyle(ticker, assetType = "Aktie") {
  const normType = String(assetType || "").toLowerCase();
  if (normType.includes("krypto")) {
    return "background: linear-gradient(135deg, #f59e0b, #d97706);";
  }
  if (normType.includes("etf")) {
    return "background: linear-gradient(135deg, #0284c7, #0369a1);";
  }
  if (normType.includes("derivat")) {
    return "background: linear-gradient(135deg, #8b5cf6, #6d28d9);";
  }

  let hash = 0;
  for (const char of String(ticker || "A")) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  const hue2 = (hash + 32) % 360;
  return `background: linear-gradient(135deg, hsl(${hash} 65% 44%), hsl(${hue2} 65% 36%));`;
}

function tickerBadge(ticker) {
  return String(ticker || "").slice(0, 2).toUpperCase();
}

function normalizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function txTimestamp(tx) {
  const stamp = `${tx.date || todayISO()}T${parseTimeInput(tx.time) || "00:00"}`;
  const time = new Date(stamp).getTime();
  if (Number.isFinite(time)) return time;
  const created = new Date(tx.createdAt || Date.now()).getTime();
  return Number.isFinite(created) ? created : Date.now();
}

function sortTransactions(a, b) {
  return txTimestamp(a) - txTimestamp(b);
}

function normalizeTransaction(raw, fallbackTicker = "") {
  if (!raw || typeof raw !== "object") return null;

  const ticker = String(raw.ticker ?? fallbackTicker ?? "").trim().toUpperCase();
  const name = String(raw.name ?? "").trim();
  if (!ticker || !name) return null;

  const kind = String(raw.kind ?? raw.transactionType ?? "buy").toLowerCase() === "sell" ? "sell" : "buy";
  const assetType = String(raw.assetType ?? raw.type ?? "Aktie").trim() || "Aktie";
  const sector = String(raw.sector ?? "").trim();
  const qty = Math.abs(normalizeNumber(raw.qty ?? raw.quantity ?? 0, 0));
  const price = normalizeNumber(raw.price ?? raw.buyPrice ?? raw.currentPrice ?? 0, 0);
  const fee = normalizeNumber(raw.fee ?? raw.fees ?? 0, 0);
  const date = String(raw.date ?? raw.buyDate ?? todayISO()).trim() || todayISO();
  const time = parseTimeInput(raw.time ?? raw.buyTime ?? currentTimeISO()) || currentTimeISO();
  const currentPrice = normalizeNumber(raw.currentPrice ?? price, price);
  const dayChangePct = normalizeNumber(raw.dayChangePct ?? raw.day_change_pct ?? 0, 0);
  const watch = Boolean(raw.watch);
  const note = String(raw.note ?? "").trim();
  const createdAt = String(raw.createdAt ?? new Date().toISOString()).trim() || new Date().toISOString();

  return {
    id: String(raw.id ?? createId()),
    instrumentId: ticker,
    kind,
    name,
    ticker,
    assetType,
    sector,
    qty,
    price,
    fee,
    date,
    time,
    currentPrice,
    dayChangePct,
    watch,
    note,
    createdAt
  };
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.transactions) ? parsed.transactions : [];
      const normalized = list.map(item => normalizeTransaction(item)).filter(Boolean);
      if (normalized.length) return normalized;
    }
  } catch {
    // ignore
  }

  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return [];

    const parsed = JSON.parse(legacyRaw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(raw => {
        if (!raw || typeof raw !== "object") return null;
        const ticker = String(raw.ticker ?? "").trim().toUpperCase();
        if (!ticker) return null;
        return normalizeTransaction({
          id: raw.id || createId(),
          kind: "buy",
          name: raw.name,
          ticker,
          assetType: raw.assetType || raw.type || "Aktie",
          sector: raw.sector || "",
          qty: raw.qty ?? raw.quantity ?? 0,
          price: raw.buyPrice ?? raw.price ?? 0,
          fee: raw.fees ?? raw.fee ?? 0,
          date: raw.buyDate ?? todayISO(),
          time: raw.buyTime ?? currentTimeISO(),
          currentPrice: raw.currentPrice ?? raw.buyPrice ?? 0,
          dayChangePct: raw.dayChangePct ?? 0,
          watch: Boolean(raw.watch),
          note: raw.note ?? "",
          createdAt: new Date().toISOString()
        }, ticker);
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  } catch {
    // localStorage quota or blocked
  }
}

function calcInstrument(transactions) {
  const sorted = [...transactions].sort(sortTransactions);
  if (!sorted.length) return null;

  const latest = sorted[sorted.length - 1];

  let openQty = 0;
  let costBasis = 0;
  let realizedGain = 0;
  let investedGross = 0;
  let soldQty = 0;

  for (const tx of sorted) {
    const qty = Math.abs(normalizeNumber(tx.qty, 0));
    const price = normalizeNumber(tx.price, 0);
    const fee = normalizeNumber(tx.fee, 0);

    if (qty <= 0) continue;

    if (tx.kind === "sell") {
      const sellQty = Math.min(qty, openQty);
      if (sellQty <= 0) continue;

      const avgCost = openQty > 0 ? costBasis / openQty : 0;
      const assignedCost = avgCost * sellQty;
      const proceeds = sellQty * price - fee;

      realizedGain += proceeds - assignedCost;
      openQty -= sellQty;
      costBasis -= assignedCost;
      soldQty += sellQty;

      if (costBasis < 0.00001) costBasis = 0;
    } else {
      const buyCost = qty * price + fee;
      openQty += qty;
      costBasis += buyCost;
      investedGross += buyCost;
    }
  }

  const currentPrice = normalizeNumber(latest.currentPrice, latest.price);
  const currentValue = openQty * currentPrice;
  const unrealizedGain = currentValue - costBasis;
  const totalGain = realizedGain + unrealizedGain;
  const gainPct = investedGross ? (totalGain / investedGross) * 100 : 0;
  const dayChangePct = normalizeNumber(latest.dayChangePct, 0);
  const dayChange = currentValue * (dayChangePct / 100);
  const averageCost = openQty ? costBasis / openQty : 0;

  const catalog = (typeof window !== "undefined" && window.STOCK_CATALOG) ? window.STOCK_CATALOG : (typeof STOCK_CATALOG !== "undefined" ? STOCK_CATALOG : []);
  const catalogEntry = catalog.find(s => s.ticker === latest.ticker);
  const isin = latest.isin || catalogEntry?.isin || "";

  return {
    id: latest.instrumentId,
    ticker: latest.ticker,
    name: latest.name,
    isin,
    assetType: latest.assetType,
    sector: latest.sector,
    note: latest.note,
    watch: Boolean(latest.watch),
    openQty,
    soldQty,
    investedGross,
    costBasis,
    realizedGain,
    unrealizedGain,
    totalGain,
    gainPct,
    currentValue,
    currentPrice,
    dayChangePct,
    dayChange,
    averageCost,
    lastDate: latest.date,
    lastTime: latest.time,
    latestKind: latest.kind,
    transactionCount: sorted.length,
    transactions: sorted
  };
}

function refreshModel() {
  const groups = new Map();

  for (const tx of [...state.transactions].sort(sortTransactions)) {
    const key = tx.instrumentId || tx.ticker;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tx);
  }

  state.instruments = [...groups.values()]
    .map(calcInstrument)
    .filter(Boolean)
    .sort((a, b) => b.currentValue - a.currentValue);
}

function getActiveInstruments() {
  return state.instruments.filter(item => item.openQty > 0);
}

function calcPortfolio() {
  const items = getActiveInstruments();

  const totals = items.reduce(
    (acc, item) => {
      acc.currentValue += item.currentValue;
      acc.investedGross += item.investedGross;
      acc.costBasis += item.costBasis;
      acc.realizedGain += item.realizedGain;
      acc.unrealizedGain += item.unrealizedGain;
      acc.totalGain += item.totalGain;
      acc.dayChange += item.dayChange;
      return acc;
    },
    {
      currentValue: 0,
      investedGross: 0,
      costBasis: 0,
      realizedGain: 0,
      unrealizedGain: 0,
      totalGain: 0,
      dayChange: 0
    }
  );

  totals.gainPct = totals.investedGross ? (totals.totalGain / totals.investedGross) * 100 : 0;
  totals.dayChangePct = totals.currentValue ? (totals.dayChange / totals.currentValue) * 100 : 0;
  return totals;
}

function buildSeries(startValue, endValue, points, volatility = 0.015) {
  const series = [];
  const last = Math.max(points - 1, 1);
  const distance = endValue - startValue;
  const amplitude = Math.max(Math.abs(distance) * 0.42, Math.abs(endValue) * volatility * 2.4);
  const phase = ((Math.round(Math.abs(startValue) * 100) + Math.round(Math.abs(endValue) * 10)) % 17) / 17;

  for (let i = 0; i < points; i++) {
    const t = i / last;
    const base = startValue + distance * t;
    // The envelope keeps the first and last values exact while adding visible market-like movement in between.
    const envelope = Math.pow(Math.sin(Math.PI * t), 0.72);
    const swing =
      Math.sin(t * 10.5 + phase) * amplitude * 0.56 +
      Math.cos(t * 25.7 + phase * 3) * amplitude * 0.24 +
      Math.sin(t * 51.4 + phase * 5) * amplitude * 0.08;
    series.push({ x: i, y: base + envelope * swing });
  }

  return series;
}

function buildHistoryForRange(total, invested, rangeKey) {
  const preset = chartRanges[rangeKey] || chartRanges["1W"];
  const wiggle = rangeKey === "1D" ? 0.006 : rangeKey === "SINCE" ? 0.011 : 0.017;

  if (rangeKey === "SINCE") {
    return buildSeries(invested, total, preset.points, wiggle);
  }

  const startFactors = { "1D": 0.996, "1W": 0.985, "1M": 0.88, "3M": 0.94, "1Y": 0.78 };
  const start = total * (startFactors[rangeKey] || 0.94);
  const end = total;
  return buildSeries(start, end, preset.points, wiggle);
}

function buildInstrumentHistory(instrument, rangeKey) {
  if (!instrument) return [];
  const ticker = instrument.ticker ? instrument.ticker.toUpperCase() : "";
  const cacheKey = `${ticker}:${rangeKey}`;
  if (state.api?.historyCache?.has(cacheKey)) {
    const candles = state.api.historyCache.get(cacheKey);
    if (Array.isArray(candles) && candles.length >= 2) {
      return candles;
    }
  }

  const current = normalizeNumber(instrument.currentPrice || instrument.price || instrument.currentValue || 100, 100);
  const preset = chartRanges[rangeKey] || chartRanges["1W"];

  if (rangeKey === "SINCE") {
    const invested = instrument.isOwned && instrument.costBasis && instrument.openQty > 0
      ? (instrument.costBasis / instrument.openQty)
      : current * 0.92;
    return buildSeries(invested, current, preset.points, 0.012);
  }

  const startFactors = { "1D": 0.996, "1W": 0.985, "1M": 0.88, "3M": 0.94, "1Y": 0.78 };
  const start = current * (startFactors[rangeKey] || 0.94);
  return buildSeries(start, current, preset.points, rangeKey === "1D" ? 0.006 : 0.017);
}

function smoothPathFromCoords(coords) {
  if (!coords.length) return "";
  if (coords.length === 1) return `M ${coords[0][0].toFixed(2)} ${coords[0][1].toFixed(2)}`;

  return coords.slice(1).map((point, index) => {
    const currentIndex = index;
    const previous = coords[currentIndex - 1] || coords[currentIndex];
    const current = coords[currentIndex];
    const next = point;
    const afterNext = coords[currentIndex + 2] || next;
    const controlOne = [
      current[0] + (next[0] - previous[0]) / 6,
      current[1] + (next[1] - previous[1]) / 6
    ];
    const controlTwo = [
      next[0] - (afterNext[0] - current[0]) / 6,
      next[1] - (afterNext[1] - current[1]) / 6
    ];
    return `${index === 0 ? `M ${current[0].toFixed(2)} ${current[1].toFixed(2)}` : ""} C ${controlOne[0].toFixed(2)} ${controlOne[1].toFixed(2)}, ${controlTwo[0].toFixed(2)} ${controlTwo[1].toFixed(2)}, ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
  }).join(" ");
}

function pathFromPoints(points, width, height, padding) {
  const values = points.map(p => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const pads = typeof padding === "number"
    ? { top: padding, right: padding, bottom: padding, left: padding }
    : padding;
  const usableWidth = width - pads.left - pads.right;
  const usableHeight = height - pads.top - pads.bottom;
  const last = Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => {
    const x = pads.left + (index / last) * usableWidth;
    const y = pads.top + (1 - ((point.y - min) / span)) * usableHeight;
    return [x, y];
  });

  const line = smoothPathFromCoords(coords);
  const area = `${line} L ${width - pads.right} ${height - pads.bottom} L ${pads.left} ${height - pads.bottom} Z`;

  return {
    line,
    area,
    coords,
    min,
    max,
    first: points[0]?.y ?? 0,
    last: points[points.length - 1]?.y ?? 0,
    padding: pads
  };
}

function chartPointTime(point, index, total, rangeKey) {
  if (point?.time) {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(point.time * 1000));
  }

  const now = new Date();
  const rangeDays = { "1D": 1, "1W": 7, "1M": 31, "3M": 92, "1Y": 365, "SINCE": 365 * 5 };
  const daysBack = (rangeDays[rangeKey] || 7) * (1 - index / Math.max(total - 1, 1));
  const date = new Date(now.getTime() - daysBack * 86400000);
  const options = rangeKey === "1D"
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short" };
  return new Intl.DateTimeFormat("de-DE", options).format(date);
}

function renderChart(svg, points, metaEl, height = 260, rangeKey = state.range) {
  if (!svg || !points.length) return;

  const width = 1000;
  const viewHeight = Math.round(svg.closest(".chart-wrap")?.clientHeight) || height;
  const padding = { top: 30, right: 88, bottom: 38, left: 30 };
  const { line, coords, min, max, first, last, padding: pads } = pathFromPoints(points, width, viewHeight, padding);
  const delta = last - first;
  const deltaPct = first ? (delta / first) * 100 : 0;
  const positive = delta >= 0;
  const id = svg.id === "detailChart" ? "detailGrad" : "mainGrad";
  const trendColor = positive ? "#19c99a" : "#ff8d7a";
  const span = Math.max(max - min, 1);
  const valueToY = value => pads.top + (1 - ((value - min) / span)) * (viewHeight - pads.top - pads.bottom);
  const referenceY = valueToY(first);
  const areaToReference = `${line} L ${coords[coords.length - 1][0].toFixed(2)} ${referenceY.toFixed(2)} L ${coords[0][0].toFixed(2)} ${referenceY.toFixed(2)} Z`;
  const segmentPaths = coords.slice(1).map((coord, index) => {
    const previous = coords[index];
    const beforePrevious = coords[index - 1] || previous;
    const afterCurrent = coords[index + 2] || coord;
    const controlOne = [previous[0] + (coord[0] - beforePrevious[0]) / 6, previous[1] + (coord[1] - beforePrevious[1]) / 6];
    const controlTwo = [coord[0] - (afterCurrent[0] - previous[0]) / 6, coord[1] - (afterCurrent[1] - previous[1]) / 6];
    const segmentColor = points[index + 1].y >= points[index].y ? "#19c99a" : "#ff8d7a";
    return `<path d="M ${previous[0].toFixed(2)} ${previous[1].toFixed(2)} C ${controlOne[0].toFixed(2)} ${controlOne[1].toFixed(2)}, ${controlTwo[0].toFixed(2)} ${controlTwo[1].toFixed(2)}, ${coord[0].toFixed(2)} ${coord[1].toFixed(2)}" fill="none" stroke="${segmentColor}" stroke-width="4" stroke-linecap="butt" stroke-linejoin="round"></path>`;
  }).join("");
  const gridValues = Array.from({ length: 4 }, (_, index) => min + span * ((index + 1) / 5));
  const gridMarkup = gridValues.map(value => {
    const y = valueToY(value);
    return `<g class="chart-grid-row"><line x1="${pads.left}" x2="${width - pads.right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}"></line><text x="${width - pads.right + 10}" y="${(y + 4).toFixed(2)}">${escapeHtml(money(value))}</text></g>`;
  }).join("");
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1].map(index => {
    const [x] = coords[index];
    const anchor = index === 0 ? "start" : index === points.length - 1 ? "end" : "middle";
    return `<text class="chart-x-label" text-anchor="${anchor}" x="${x.toFixed(2)}" y="${viewHeight - 12}">${escapeHtml(chartPointTime(points[index], index, points.length, rangeKey))}</text>`;
  }).join("");
  const [lastX, lastY] = coords[coords.length - 1];
  const lastSegmentColor = last >= first ? "#19c99a" : "#ff8d7a";

  svg.setAttribute("viewBox", `0 0 ${width} ${viewHeight}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${trendColor}" stop-opacity=".25"></stop>
        <stop offset="100%" stop-color="${trendColor}" stop-opacity=".02"></stop>
      </linearGradient>
    </defs>
    <g class="chart-grid">${gridMarkup}</g>
    <line class="chart-reference-line" x1="${pads.left}" x2="${width - pads.right}" y1="${referenceY.toFixed(2)}" y2="${referenceY.toFixed(2)}"></line>
    <path d="${areaToReference}" fill="url(#${id})"></path>
    <path d="${line}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
    ${segmentPaths}
    <g class="chart-last-price" transform="translate(${(width - pads.right + 8).toFixed(2)} ${(lastY - 12).toFixed(2)})"><rect width="72" height="24" rx="5" fill="${lastSegmentColor}"></rect><text x="36" y="16" text-anchor="middle">${escapeHtml(money(last))}</text></g>
    <g class="chart-x-axis">${xLabels}</g>
    <g class="chart-hover-indicator" opacity="0">
      <line class="chart-hover-line" y1="${pads.top}" y2="${viewHeight - pads.bottom}"></line>
      <circle class="chart-hover-dot" r="6"></circle>
    </g>
  `;

  const wrap = svg.closest(".chart-wrap");
  if (wrap) {
    let tooltip = wrap.querySelector(".chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "chart-tooltip";
      wrap.appendChild(tooltip);
    }

    const indicator = svg.querySelector(".chart-hover-indicator");
    const indicatorLine = svg.querySelector(".chart-hover-line");
    const indicatorDot = svg.querySelector(".chart-hover-dot");
    const updateHover = event => {
      const rect = svg.getBoundingClientRect();
      const relativeX = ((event.clientX - rect.left) / rect.width) * width;
      let closestIndex = 0;
      let closestDistance = Infinity;
      coords.forEach((coord, index) => {
        const distance = Math.abs(coord[0] - relativeX);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      });

      const [x, y] = coords[closestIndex];
      const point = points[closestIndex];
      const moveColor = closestIndex > 0 && point.y < points[closestIndex - 1].y ? "#ff8d7a" : "#19c99a";
      indicator?.setAttribute("opacity", "1");
      indicatorLine?.setAttribute("x1", x);
      indicatorLine?.setAttribute("x2", x);
      indicatorDot?.setAttribute("cx", x);
      indicatorDot?.setAttribute("cy", y);
      indicatorDot?.setAttribute("fill", moveColor);
      tooltip.innerHTML = `<span>${chartPointTime(point, closestIndex, points.length, rangeKey)}</span><strong>${money(point.y)}</strong>`;
      tooltip.classList.add("visible");
      tooltip.classList.toggle("below", y / viewHeight < 0.3);
      tooltip.style.left = `${Math.min(Math.max((x / width) * 100, 12), 88)}%`;
      tooltip.style.top = `${Math.max((y / viewHeight) * 100, 7)}%`;
    };

    let hoverFrame = 0;
    let queuedHoverEvent = null;
    const scheduleHover = event => {
      queuedHoverEvent = event;
      if (hoverFrame) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        if (queuedHoverEvent) updateHover(queuedHoverEvent);
      });
    };

    svg.onpointermove = scheduleHover;
    svg.onpointerdown = scheduleHover;
    svg.onpointerleave = () => {
      if (hoverFrame) cancelAnimationFrame(hoverFrame);
      hoverFrame = 0;
      queuedHoverEvent = null;
      indicator?.setAttribute("opacity", "0");
      tooltip.classList.remove("visible");
    };
  }

  if (metaEl) {
    metaEl.textContent = `${positive ? "+" : ""}${money(delta)} ${rangeLabel(rangeKey)} · ${positive ? "+" : ""}${deltaPct.toFixed(2)}% · Span: ${money(min)} bis ${money(max)}`;
  }
}

function emptyStateCard(title, text, actionLabel = "", action = "add-first") {
  return `
    <div class="mini-item" style="padding: 24px; text-align: center;">
      <strong style="font-size: 16px;">${escapeHtml(title)}</strong>
      <small style="display: block; margin-top: 6px; font-size: 13px;">${escapeHtml(text)}</small>
      ${actionLabel ? `<div style="margin-top: 14px;"><button class="primary-btn" type="button" data-action="${escapeHtml(action)}">${escapeHtml(actionLabel)}</button></div>` : ""}
    </div>
  `;
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("portfolio-theme", theme);
  if (els.themeToggle) {
    els.themeToggle.textContent = theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode";
  }
}

function setRange(rangeKey) {
  state.range = rangeKey;
  localStorage.setItem("portfolio-range", rangeKey);

  const buttons = [...document.querySelectorAll(".range-btn")];
  buttons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.range === rangeKey);
  });

  renderDashboardChart();
  renderPortfolioChart();

  if ((state.selectedId || state.selectedInstrument) && state.detailMode === "position" && els.detailBackdrop.classList.contains("show")) {
    const instrument = state.selectedInstrument || resolveInstrument(state.selectedId);
    if (instrument) {
      const points = buildInstrumentHistory(instrument, state.range);
      renderChart(els.detailChart, points, els.detailChartMeta, 260, state.range);
      if (typeof enrichInstrumentLiveData === "function") {
        enrichInstrumentLiveData(instrument);
      }
    }
  }
}

function setView(view) {
  state.view = view;
  localStorage.setItem("portfolio-view", view);

  const meta = viewMeta[view] || viewMeta.dashboard;
  els.viewEyebrow.textContent = meta.eyebrow;
  els.viewTitle.textContent = meta.title;
  els.viewSubtitle.textContent = meta.subtitle;

  els.navLinks.forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle("active", section.id === `${view}View`);
  });

  // Draw only the chart or view that has just become visible.
  if (view === "dashboard") renderDashboardChart();
  if (view === "portfolio") renderPortfolioChart();
  if (view === "search") {
    renderSearchView();
    setTimeout(() => {
      document.getElementById("globalSearchInput")?.focus();
    }, 50);
  }

  window.scrollTo(0, 0);
}

/* DEPOT-BAR RENDER (KOMPAKTE DEPOTLEISTE OBEN) */
function renderDepotBar() {
  if (!els.depotBar) return;
  const portfolio = calcPortfolio();
  const items = getActiveInstruments();

  els.depotBar.innerHTML = `
    <div class="depot-item">
      <span>Gewinn heute</span>
      <strong class="${portfolio.dayChange >= 0 ? "good" : "bad"}">${signedMoney(portfolio.dayChange)}</strong>
      <small class="${portfolio.dayChangePct >= 0 ? "good" : "bad"}">${signedPct(portfolio.dayChangePct)} heute</small>
    </div>

    <div class="depot-item">
      <span>Gewinn gesamt</span>
      <strong class="${portfolio.totalGain >= 0 ? "good" : "bad"}">${signedMoney(portfolio.totalGain)}</strong>
      <small class="${portfolio.gainPct >= 0 ? "good" : "bad"}">${signedPct(portfolio.gainPct)} seit Kauf</small>
    </div>

    <div class="depot-item">
      <span>Portfoliowert</span>
      <strong>${money(portfolio.currentValue)}</strong>
      <small style="color: var(--muted);">Depotwert gesamt</small>
    </div>

    <div class="depot-item">
      <span>Investiert</span>
      <strong>${money(portfolio.costBasis)}</strong>
      <small style="color: var(--muted);">Einstand / Kaufwert</small>
    </div>
  `;
}

function renderSummary() {
  const portfolio = calcPortfolio();
  const items = getActiveInstruments();
  const topPosition = [...items].sort((a, b) => b.currentValue - a.currentValue)[0];
  const topWinner = [...items].sort((a, b) => b.dayChangePct - a.dayChangePct)[0];
  const topLoser = [...items].sort((a, b) => a.dayChangePct - b.dayChangePct)[0];

  els.sidebarTotal.textContent = money(portfolio.currentValue);
  els.sidebarChange.textContent = `${signedMoney(portfolio.dayChange)} heute`;

  els.summaryGrid.innerHTML = `
    <article class="metric-card">
      <div class="metric-label">Portfoliowert</div>
      <div class="metric-value">${money(portfolio.currentValue)}</div>
      <div class="metric-sub">Einstand: ${money(portfolio.costBasis)}</div>
    </article>

    <article class="metric-card">
      <div class="metric-label">Gewinn gesamt</div>
      <div class="metric-value ${portfolio.totalGain >= 0 ? "metric-good" : "metric-bad"}">${signedMoney(portfolio.totalGain)}</div>
      <div class="metric-sub">${signedPct(portfolio.gainPct)} seit Kauf</div>
    </article>

    <article class="metric-card">
      <div class="metric-label">Gewinn heute</div>
      <div class="metric-value ${portfolio.dayChange >= 0 ? "metric-good" : "metric-bad"}">${signedMoney(portfolio.dayChange)}</div>
      <div class="metric-sub">${signedPct(portfolio.dayChangePct)} Tagesperformance</div>
    </article>

    <article class="metric-card">
      <div class="metric-label">Top / Flop heute</div>
      <div class="metric-value">${topWinner ? escapeHtml(topWinner.ticker) : "—"} ${topLoser ? `/ ${escapeHtml(topLoser.ticker)}` : ""}</div>
      <div class="metric-sub">${topWinner ? `${signedPct(topWinner.dayChangePct)} Gewinner` : "Keine Daten"}${topLoser ? ` · ${signedPct(topLoser.dayChangePct)} Verlierer` : ""}</div>
    </article>
  `;
}

function sortInstruments(items) {
  const sortMode = state.sort;

  return [...items].sort((a, b) => {
    switch (sortMode) {
      case "gain-desc":
        return b.totalGain - a.totalGain;
      case "gain-asc":
        return a.totalGain - b.totalGain;
      case "day-desc":
        return b.dayChangePct - a.dayChangePct;
      case "name-asc":
        return a.name.localeCompare(b.name, "de");
      case "value-desc":
      default:
        return b.currentValue - a.currentValue;
    }
  });
}

function filteredInstruments() {
  const query = state.search.trim().toLowerCase();
  return sortInstruments(getActiveInstruments().filter(instrument => {
    if (!query) return true;
    const haystack = `${instrument.name} ${instrument.ticker} ${instrument.assetType} ${instrument.sector} ${instrument.note}`.toLowerCase();
    return haystack.includes(query);
  }));
}

window.onAssetLogoError = function (img) {
  if (!img) return;
  const fallbackSrc = img.getAttribute("data-fallback");
  if (fallbackSrc && img.src !== fallbackSrc) {
    img.removeAttribute("data-fallback");
    img.src = fallbackSrc;
    return;
  }
  img.style.display = "none";
  const parent = img.parentElement;
  if (parent) {
    const fallbackEl = parent.querySelector(".asset-fallback-badge");
    if (fallbackEl) {
      fallbackEl.style.display = "flex";
    }
  }
};

const LOGO_TICKER_ALIASES = {
  "NOVO B": "NVO",
  "VOLV B": "VOLVB",
  "BRK B": "BRK.B",
  "BRK-B": "BRK.B",
  "MC": "LVMUY",
  "ABI": "BUD",
  "NOVN": "NVS",
  "UBSG": "UBS",
  "STLAM": "STLA",
  "DBK": "DB"
};

const PRESET_LOGOS = {
  // US Mega-Caps & Tech
  TSLA: "https://assets.parqet.com/logos/symbol/TSLA",
  AAPL: "https://assets.parqet.com/logos/symbol/AAPL",
  MSFT: "https://assets.parqet.com/logos/symbol/MSFT",
  NVDA: "https://assets.parqet.com/logos/symbol/NVDA",
  AMZN: "https://assets.parqet.com/logos/symbol/AMZN",
  GOOGL: "https://assets.parqet.com/logos/symbol/GOOGL",
  GOOG: "https://assets.parqet.com/logos/symbol/GOOGL",
  META: "https://assets.parqet.com/logos/symbol/META",
  NFLX: "https://assets.parqet.com/logos/symbol/NFLX",
  AVGO: "https://assets.parqet.com/logos/symbol/AVGO",
  ADBE: "https://assets.parqet.com/logos/symbol/ADBE",
  ORCL: "https://assets.parqet.com/logos/symbol/ORCL",
  CSCO: "https://assets.parqet.com/logos/symbol/CSCO",
  IBM: "https://assets.parqet.com/logos/symbol/IBM",
  INTU: "https://assets.parqet.com/logos/symbol/INTU",
  SMCI: "https://assets.parqet.com/logos/symbol/SMCI",
  MSTR: "https://assets.parqet.com/logos/symbol/MSTR",
  DELL: "https://assets.parqet.com/logos/symbol/DELL",

  // Cloud, Cyber & SaaS
  NET: "https://assets.parqet.com/logos/symbol/NET",
  CRWD: "https://assets.parqet.com/logos/symbol/CRWD",
  PLTR: "https://assets.parqet.com/logos/symbol/PLTR",
  SNOW: "https://assets.parqet.com/logos/symbol/SNOW",
  DDOG: "https://assets.parqet.com/logos/symbol/DDOG",
  PANW: "https://assets.parqet.com/logos/symbol/PANW",
  FTNT: "https://assets.parqet.com/logos/symbol/FTNT",
  ZS: "https://assets.parqet.com/logos/symbol/ZS",
  S: "https://assets.parqet.com/logos/symbol/S",
  MDB: "https://assets.parqet.com/logos/symbol/MDB",
  OKTA: "https://assets.parqet.com/logos/symbol/OKTA",
  SHOP: "https://assets.parqet.com/logos/symbol/SHOP",
  TEAM: "https://assets.parqet.com/logos/symbol/TEAM",
  NOW: "https://assets.parqet.com/logos/symbol/NOW",
  CRM: "https://assets.parqet.com/logos/symbol/CRM",
  WDAY: "https://assets.parqet.com/logos/symbol/WDAY",
  HUBS: "https://assets.parqet.com/logos/symbol/HUBS",
  DOCU: "https://assets.parqet.com/logos/symbol/DOCU",
  ZM: "https://assets.parqet.com/logos/symbol/ZM",
  TWLO: "https://assets.parqet.com/logos/symbol/TWLO",
  ESTC: "https://assets.parqet.com/logos/symbol/ESTC",
  DT: "https://assets.parqet.com/logos/symbol/DT",
  PATH: "https://assets.parqet.com/logos/symbol/PATH",

  // Halbleiter
  TSM: "https://assets.parqet.com/logos/symbol/TSM",
  ASML: "https://assets.parqet.com/logos/symbol/ASML",
  AMD: "https://assets.parqet.com/logos/symbol/AMD",
  QCOM: "https://assets.parqet.com/logos/symbol/QCOM",
  INTC: "https://assets.parqet.com/logos/symbol/INTC",
  AMAT: "https://assets.parqet.com/logos/symbol/AMAT",
  LRCX: "https://assets.parqet.com/logos/symbol/LRCX",
  KLAC: "https://assets.parqet.com/logos/symbol/KLAC",
  MU: "https://assets.parqet.com/logos/symbol/MU",
  ARM: "https://assets.parqet.com/logos/symbol/ARM",
  MRVL: "https://assets.parqet.com/logos/symbol/MRVL",
  TXN: "https://assets.parqet.com/logos/symbol/TXN",
  SNPS: "https://assets.parqet.com/logos/symbol/SNPS",
  CDNS: "https://assets.parqet.com/logos/symbol/CDNS",

  // German DAX / MDAX
  SAP: "https://assets.parqet.com/logos/symbol/SAP",
  SIE: "https://assets.parqet.com/logos/symbol/SIE",
  ALV: "https://assets.parqet.com/logos/symbol/ALV",
  DTE: "https://assets.parqet.com/logos/symbol/DTE",
  MBG: "https://assets.parqet.com/logos/symbol/MBG",
  BMW: "https://assets.parqet.com/logos/symbol/BMW",
  VOW3: "https://assets.parqet.com/logos/symbol/VOW3",
  P911: "https://assets.parqet.com/logos/symbol/P911",
  PAH3: "https://assets.parqet.com/logos/symbol/PAH3",
  RHM: "https://assets.parqet.com/logos/symbol/RHM",
  MUV2: "https://assets.parqet.com/logos/symbol/MUV2",
  DBK: "https://assets.parqet.com/logos/symbol/DBK",
  CBK: "https://assets.parqet.com/logos/symbol/CBK",
  BAS: "https://assets.parqet.com/logos/symbol/BAS",
  BAYN: "https://assets.parqet.com/logos/symbol/BAYN",
  DHL: "https://assets.parqet.com/logos/symbol/DHL",
  CON: "https://assets.parqet.com/logos/symbol/CON",
  HEI: "https://assets.parqet.com/logos/symbol/HEI",
  EOAN: "https://assets.parqet.com/logos/symbol/EOAN",
  RWE: "https://assets.parqet.com/logos/symbol/RWE",
  BEI: "https://assets.parqet.com/logos/symbol/BEI",
  HEN3: "https://assets.parqet.com/logos/symbol/HEN3",
  SY1: "https://assets.parqet.com/logos/symbol/SY1",
  SRT3: "https://assets.parqet.com/logos/symbol/SRT3",
  QIA: "https://assets.parqet.com/logos/symbol/QIA",
  SHL: "https://assets.parqet.com/logos/symbol/SHL",
  ENR: "https://assets.parqet.com/logos/symbol/ENR",
  FRE: "https://assets.parqet.com/logos/symbol/FRE",
  FME: "https://assets.parqet.com/logos/symbol/FME",
  VNA: "https://assets.parqet.com/logos/symbol/VNA",
  MTX: "https://assets.parqet.com/logos/symbol/MTX",
  HNR1: "https://assets.parqet.com/logos/symbol/HNR1",
  BNR: "https://assets.parqet.com/logos/symbol/BNR",
  ADS: "https://assets.parqet.com/logos/symbol/ADS",
  PUM: "https://assets.parqet.com/logos/symbol/PUM",
  ZAL: "https://assets.parqet.com/logos/symbol/ZAL",
  HFG: "https://assets.parqet.com/logos/symbol/HFG",
  DHER: "https://assets.parqet.com/logos/symbol/DHER",
  G24: "https://assets.parqet.com/logos/symbol/G24",
  NEM: "https://assets.parqet.com/logos/symbol/NEM",
  EVD: "https://assets.parqet.com/logos/symbol/EVD",
  HAGG: "https://assets.parqet.com/logos/symbol/HAGG",
  R3NK: "https://assets.parqet.com/logos/symbol/R3NK",
  AFX: "https://assets.parqet.com/logos/symbol/AFX",
  NDX1: "https://assets.parqet.com/logos/symbol/NDX1",
  S92: "https://assets.parqet.com/logos/symbol/S92",
  EVT: "https://assets.parqet.com/logos/symbol/EVT",
  KBX: "https://assets.parqet.com/logos/symbol/KBX",
  TKA: "https://assets.parqet.com/logos/symbol/TKA",
  TUI1: "https://assets.parqet.com/logos/symbol/TUI1",
  BC8: "https://assets.parqet.com/logos/symbol/BC8",
  TMV: "https://assets.parqet.com/logos/symbol/TMV",
  IFX: "https://assets.parqet.com/logos/symbol/IFX",
  AIXA: "https://assets.parqet.com/logos/symbol/AIXA",

  // European & Global
  "NOVO B": "https://assets.parqet.com/logos/isin/DK0062498333",
  NVO: "https://assets.parqet.com/logos/symbol/NVO",
  MC: "https://assets.parqet.com/logos/isin/FR0000121014",
  RMS: "https://assets.parqet.com/logos/isin/FR0000052292",
  OR: "https://assets.parqet.com/logos/isin/FR0000120321",
  RACE: "https://assets.parqet.com/logos/symbol/RACE",
  NESN: "https://assets.parqet.com/logos/isin/CH0038863350",
  ROG: "https://assets.parqet.com/logos/isin/CH0012032048",
  NOVN: "https://assets.parqet.com/logos/isin/CH0012005267",
  NVS: "https://assets.parqet.com/logos/symbol/NVS",
  SAN: "https://assets.parqet.com/logos/isin/FR0000120578",
  AZN: "https://assets.parqet.com/logos/symbol/AZN",
  TTE: "https://assets.parqet.com/logos/symbol/TTE",
  SHEL: "https://assets.parqet.com/logos/symbol/SHEL",
  BP: "https://assets.parqet.com/logos/symbol/BP",
  SU: "https://assets.parqet.com/logos/isin/FR0000121972",
  AI: "https://assets.parqet.com/logos/isin/FR0000120073",
  AIR: "https://assets.parqet.com/logos/isin/NL0000235190",
  IBE: "https://assets.parqet.com/logos/isin/ES0144580Y14",
  ENEL: "https://assets.parqet.com/logos/isin/IT0003128367",
  BNP: "https://assets.parqet.com/logos/isin/FR0000131104",
  ISP: "https://assets.parqet.com/logos/isin/IT0000072618",
  UBSG: "https://assets.parqet.com/logos/symbol/UBS",
  UBS: "https://assets.parqet.com/logos/symbol/UBS",
  STLAM: "https://assets.parqet.com/logos/symbol/STLA",
  STLA: "https://assets.parqet.com/logos/symbol/STLA",
  ITX: "https://assets.parqet.com/logos/isin/ES0148396007",
  HEIA: "https://assets.parqet.com/logos/isin/NL0000009165",
  ABI: "https://assets.parqet.com/logos/symbol/BUD",
  BUD: "https://assets.parqet.com/logos/symbol/BUD",
  "VOLV B": "https://assets.parqet.com/logos/isin/SE0000115446",
  VOLVB: "https://assets.parqet.com/logos/isin/SE0000115446",
  ADYEN: "https://assets.parqet.com/logos/symbol/ADYEN",
  PRX: "https://assets.parqet.com/logos/isin/NL0013654783",
  SAF: "https://assets.parqet.com/logos/isin/FR0000073272",
  KER: "https://assets.parqet.com/logos/isin/FR0000121485",
  RIO: "https://assets.parqet.com/logos/symbol/RIO",
  GLEN: "https://assets.parqet.com/logos/symbol/GLEN",

  // US Finance, Healthcare & Consumer
  JPM: "https://assets.parqet.com/logos/symbol/JPM",
  V: "https://assets.parqet.com/logos/symbol/V",
  MA: "https://assets.parqet.com/logos/symbol/MA",
  BAC: "https://assets.parqet.com/logos/symbol/BAC",
  WFC: "https://assets.parqet.com/logos/symbol/WFC",
  GS: "https://assets.parqet.com/logos/symbol/GS",
  MS: "https://assets.parqet.com/logos/symbol/MS",
  C: "https://assets.parqet.com/logos/symbol/C",
  "BRK.B": "https://assets.parqet.com/logos/symbol/BRK.B",
  BLK: "https://assets.parqet.com/logos/symbol/BLK",
  AXP: "https://assets.parqet.com/logos/symbol/AXP",
  HOOD: "https://assets.parqet.com/logos/symbol/HOOD",
  SQ: "https://assets.parqet.com/logos/symbol/SQ",
  PYPL: "https://assets.parqet.com/logos/symbol/PYPL",
  COIN: "https://assets.parqet.com/logos/symbol/COIN",
  LLY: "https://assets.parqet.com/logos/symbol/LLY",
  JNJ: "https://assets.parqet.com/logos/symbol/JNJ",
  PFE: "https://assets.parqet.com/logos/symbol/PFE",
  ABBV: "https://assets.parqet.com/logos/symbol/ABBV",
  MRK: "https://assets.parqet.com/logos/symbol/MRK",
  TMO: "https://assets.parqet.com/logos/symbol/TMO",
  ABT: "https://assets.parqet.com/logos/symbol/ABT",
  DHR: "https://assets.parqet.com/logos/symbol/DHR",
  BMY: "https://assets.parqet.com/logos/symbol/BMY",
  AMGN: "https://assets.parqet.com/logos/symbol/AMGN",
  GILD: "https://assets.parqet.com/logos/symbol/GILD",
  ISRG: "https://assets.parqet.com/logos/symbol/ISRG",
  VRTX: "https://assets.parqet.com/logos/symbol/VRTX",
  REGN: "https://assets.parqet.com/logos/symbol/REGN",
  MRNA: "https://assets.parqet.com/logos/symbol/MRNA",
  BNTX: "https://assets.parqet.com/logos/symbol/BNTX",
  LMT: "https://assets.parqet.com/logos/symbol/LMT",
  RTX: "https://assets.parqet.com/logos/symbol/RTX",
  BA: "https://assets.parqet.com/logos/symbol/BA",
  NOC: "https://assets.parqet.com/logos/symbol/NOC",
  GD: "https://assets.parqet.com/logos/symbol/GD",
  PLD: "https://assets.parqet.com/logos/symbol/PLD",
  AMT: "https://assets.parqet.com/logos/symbol/AMT",
  EQIX: "https://assets.parqet.com/logos/symbol/EQIX",
  O: "https://assets.parqet.com/logos/symbol/O",
  XOM: "https://assets.parqet.com/logos/symbol/XOM",
  CVX: "https://assets.parqet.com/logos/symbol/CVX",
  COP: "https://assets.parqet.com/logos/symbol/COP",
  SLB: "https://assets.parqet.com/logos/symbol/SLB",
  NEE: "https://assets.parqet.com/logos/symbol/NEE",
  DUK: "https://assets.parqet.com/logos/symbol/DUK",
  SO: "https://assets.parqet.com/logos/symbol/SO",
  WMT: "https://assets.parqet.com/logos/symbol/WMT",
  PG: "https://assets.parqet.com/logos/symbol/PG",
  COST: "https://assets.parqet.com/logos/symbol/COST",
  KO: "https://assets.parqet.com/logos/symbol/KO",
  PEP: "https://assets.parqet.com/logos/symbol/PEP",
  HD: "https://assets.parqet.com/logos/symbol/HD",
  MCD: "https://assets.parqet.com/logos/symbol/MCD",
  NKE: "https://assets.parqet.com/logos/symbol/NKE",
  SBUX: "https://assets.parqet.com/logos/symbol/SBUX",
  LOW: "https://assets.parqet.com/logos/symbol/LOW",
  TGT: "https://assets.parqet.com/logos/symbol/TGT",
  UBER: "https://assets.parqet.com/logos/symbol/UBER",
  ABNB: "https://assets.parqet.com/logos/symbol/ABNB",
  BKNG: "https://assets.parqet.com/logos/symbol/BKNG",
  MAR: "https://assets.parqet.com/logos/symbol/MAR",
  CMG: "https://assets.parqet.com/logos/symbol/CMG",
  DIS: "https://assets.parqet.com/logos/symbol/DIS",
  SPOT: "https://assets.parqet.com/logos/symbol/SPOT",
  F: "https://assets.parqet.com/logos/symbol/F",
  GM: "https://assets.parqet.com/logos/symbol/GM",
  RIVN: "https://assets.parqet.com/logos/symbol/RIVN",
  LCID: "https://assets.parqet.com/logos/symbol/LCID",
  NIO: "https://assets.parqet.com/logos/symbol/NIO",
  LI: "https://assets.parqet.com/logos/symbol/LI",
  XPEV: "https://assets.parqet.com/logos/symbol/XPEV",
  BABA: "https://assets.parqet.com/logos/symbol/BABA",
  TCEHY: "https://assets.parqet.com/logos/symbol/TCEHY",
  PDD: "https://assets.parqet.com/logos/symbol/PDD",
  JD: "https://assets.parqet.com/logos/symbol/JD",
  BIDU: "https://assets.parqet.com/logos/symbol/BIDU",
  NTES: "https://assets.parqet.com/logos/symbol/NTES",
  SE: "https://assets.parqet.com/logos/symbol/SE",
  GRAB: "https://assets.parqet.com/logos/symbol/GRAB",
  NU: "https://assets.parqet.com/logos/symbol/NU",
  MELI: "https://assets.parqet.com/logos/symbol/MELI",
  SONY: "https://assets.parqet.com/logos/symbol/SONY",
  NTDOY: "https://assets.parqet.com/logos/symbol/NTDOY",
  TM: "https://assets.parqet.com/logos/symbol/TM",
  HMC: "https://assets.parqet.com/logos/symbol/HMC",

  // ETFs & Krypto
  SXR8: "https://assets.parqet.com/logos/isin/IE00B5BMR087",
  VWCE: "https://assets.parqet.com/logos/isin/IE00BK5BQT80",
  EUNL: "https://assets.parqet.com/logos/isin/IE00B4L5Y983",
  DBX0AN: "https://assets.parqet.com/logos/isin/LU0290358497",
  QDVE: "https://assets.parqet.com/logos/isin/IE00B3WJKG14",
  EXXT: "https://assets.parqet.com/logos/isin/DE000A0F5UF5",
  IS3N: "https://assets.parqet.com/logos/isin/IE00BKM4GZ66",
  IUSN: "https://assets.parqet.com/logos/isin/IE00BF4RFH31",
  "2B76": "https://assets.parqet.com/logos/isin/IE00BYZK4552",
  VGVF: "https://assets.parqet.com/logos/isin/IE00BKX55T58",
  DAXEX: "https://assets.parqet.com/logos/isin/DE0005933931",
  BTC: "https://assets.parqet.com/logos/symbol/BTC",
  ETH: "https://assets.parqet.com/logos/symbol/ETH",
  SOL: "https://assets.parqet.com/logos/symbol/SOL",
  BNB: "https://assets.parqet.com/logos/symbol/BNB",
  XRP: "https://assets.parqet.com/logos/symbol/XRP",
  ADA: "https://assets.parqet.com/logos/symbol/ADA",
  AVAX: "https://assets.parqet.com/logos/symbol/AVAX",
  DOT: "https://assets.parqet.com/logos/symbol/DOT",
  LINK: "https://assets.parqet.com/logos/symbol/LINK",
  DOGE: "https://assets.parqet.com/logos/symbol/DOGE"
};

function getLogoCandidateUrls(instrument) {
  const ticker = String(instrument?.ticker || "").trim().toUpperCase();
  const isin = String(instrument?.isin || "").trim().toUpperCase();
  const urls = [];

  // 1. Live Finnhub profile logo if available
  if (state.api?.profiles?.[ticker]?.logo) {
    urls.push(state.api.profiles[ticker].logo);
  }

  // 2. Preset logo direct mapping
  if (PRESET_LOGOS[ticker]) {
    urls.push(PRESET_LOGOS[ticker]);
  }

  // 3. Known ticker alias mapping
  const mappedTicker = LOGO_TICKER_ALIASES[ticker] || ticker;
  if (mappedTicker !== ticker && PRESET_LOGOS[mappedTicker]) {
    urls.push(PRESET_LOGOS[mappedTicker]);
  }

  // 4. Parqet ISIN URL (extremely reliable for German, European & Global stocks)
  if (isin && isin.length === 12) {
    const isinUrl = `https://assets.parqet.com/logos/isin/${encodeURIComponent(isin)}`;
    if (!urls.includes(isinUrl)) urls.push(isinUrl);
  }

  // 5. Parqet symbol URL for the clean symbol
  const cleanSymbol = mappedTicker.replace(/\s+/g, "");
  if (cleanSymbol) {
    const symbolUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(cleanSymbol)}`;
    if (!urls.includes(symbolUrl)) urls.push(symbolUrl);
  }

  // 6. Original symbol if distinct
  const origClean = ticker.replace(/\s+/g, "");
  if (origClean && origClean !== cleanSymbol) {
    const origUrl = `https://assets.parqet.com/logos/symbol/${encodeURIComponent(origClean)}`;
    if (!urls.includes(origUrl)) urls.push(origUrl);
  }

  return urls;
}

function getLogoUrl(ticker) {
  const urls = getLogoCandidateUrls({ ticker });
  return urls[0] || "";
}

function fallbackIconMarkup(instrument) {
  const ticker = String(instrument?.ticker || "").trim().toUpperCase();
  const name = String(instrument?.name || "").trim();
  const assetType = String(instrument?.assetType || "Aktie");

  let initials = ticker.slice(0, 3).replace(/[^A-Z0-9]/g, "");
  if (!initials && name) {
    const parts = name.split(/\s+/).filter(Boolean);
    initials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  if (!initials) initials = "WP";

  if (assetType === "Krypto") {
    const cryptoIcons = {
      BTC: "₿", ETH: "Ξ", SOL: "◎", BNB: "BNB", XRP: "✕", ADA: "₳", AVAX: "▲", DOT: "●", LINK: "⬡", DOGE: "Ð"
    };
    const symbolText = cryptoIcons[ticker] || initials.slice(0, 3);
    return `<span class="badge-icon-text">${escapeHtml(symbolText)}</span>`;
  }

  if (assetType === "ETF") {
    return `<span class="badge-icon-text etf-text">${escapeHtml(initials.length > 2 ? initials.slice(0, 2) : initials)}</span>`;
  }

  if (assetType === "Derivat") {
    return `<span class="badge-icon-text">⚡</span>`;
  }

  return `<span class="badge-icon-text">${escapeHtml(initials.slice(0, 2))}</span>`;
}

function logoMarkup(instrument, className = "asset-badge") {
  const ticker = String(instrument?.ticker || "").trim().toUpperCase();
  const name = String(instrument?.name || ticker).trim();
  const isin = String(instrument?.isin || "").trim().toUpperCase();
  const assetType = instrument?.assetType || "Aktie";
  const idAttr = className.includes("detail-badge") ? ' id="detailBadge"' : "";

  const urls = getLogoCandidateUrls(instrument || { ticker, name, isin, assetType });
  const primaryUrl = urls[0] || "";
  const fallbackUrl = urls[1] || "";
  const fallbackContent = fallbackIconMarkup(instrument || { ticker, name, isin, assetType });
  const fallbackCss = badgeStyle(ticker, assetType);

  if (primaryUrl) {
    return `
      <div${idAttr} class="${className} asset-badge-wrap">
        <img class="asset-logo-img" src="${escapeHtml(primaryUrl)}" ${fallbackUrl ? `data-fallback="${escapeHtml(fallbackUrl)}"` : ""} alt="${escapeHtml(name)} Logo" loading="lazy" referrerpolicy="no-referrer" onerror="window.onAssetLogoError ? window.onAssetLogoError(this) : (this.style.display='none', (this.nextElementSibling && (this.nextElementSibling.style.display='flex')))" />
        <div class="asset-fallback-badge" style="display:none; ${fallbackCss}">
          ${fallbackContent}
        </div>
      </div>
    `.trim();
  }

  return `
    <div${idAttr} class="${className} asset-badge-wrap">
      <div class="asset-fallback-badge" style="display:flex; ${fallbackCss}">
        ${fallbackContent}
      </div>
    </div>
  `.trim();
}

function sparklineSvg(instrument, width = 100, height = 32) {
  const points = buildInstrumentHistory(instrument, state.range).slice(0, 18);
  const values = points.map(p => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const last = Math.max(points.length - 1, 1);
  const pad = 3;

  const coords = points.map((point, index) => {
    const x = pad + (index / last) * (width - pad * 2);
    const y = pad + (1 - ((point.y - min) / span)) * (height - pad * 2);
    return [x, y];
  });

  const line = coords.map((p, index) => `${index === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  const positive = instrument.dayChangePct >= 0;
  const stroke = positive ? "var(--good)" : "var(--bad)";

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="mini-spark">
      <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}

/* SCALABLE STYLE COMPACT TABULAR POSITION MARKUP */
function instrumentCardMarkup(instrument) {
  const gainClass = instrument.totalGain >= 0 ? "good" : "bad";
  const dayClass = instrument.dayChangePct >= 0 ? "good" : "bad";

  return `
    <article class="position-card" data-id="${escapeHtml(instrument.id)}">
      <div class="position-main">
        ${logoMarkup(instrument, "position-logo")}
        <div class="position-title">
          <strong>${escapeHtml(instrument.name)}</strong>
          <small>${escapeHtml(instrument.ticker)} · ${escapeHtml(instrument.assetType)} · ${escapeHtml(instrument.sector || "Ohne Sektor")}</small>
        </div>
      </div>

      <div class="position-stat col-qty">
        <span>Stück / Ø Kauf</span>
        <strong>${instrument.openQty.toLocaleString("de-DE")} Stk</strong>
        <small style="color:var(--muted);">${money(instrument.averageCost)}</small>
      </div>

      <div class="position-stat col-price">
        <span>Kurs / Heute</span>
        <strong>${money(instrument.currentPrice)}</strong>
        <small class="${dayClass}">${signedPct(instrument.dayChangePct)}</small>
      </div>

      <div class="position-stat col-value">
        <span>Marktwert / Gewinn</span>
        <strong>${money(instrument.currentValue)}</strong>
        <small class="${gainClass}">${signedMoney(instrument.totalGain)} (${signedPct(instrument.gainPct)})</small>
      </div>

      <div class="position-spark col-chart">
        ${sparklineSvg(instrument)}
      </div>

      <div class="position-actions col-actions">
        <button class="action-icon-btn" data-action="edit" type="button" title="Position bearbeiten">
          ✏️
        </button>
        <button class="action-icon-btn danger" data-action="delete" type="button" title="Position löschen">
          🗑️
        </button>
        <button class="watch-btn ${instrument.watch ? "active" : ""}" data-action="watch" type="button" aria-label="Watchlist" title="Zur Watchlist">
          ${instrument.watch ? "★" : "☆"}
        </button>
      </div>
    </article>
  `;
}

function renderPositions() {
  const items = filteredInstruments();

  if (!items.length) {
    els.positionsList.innerHTML = emptyStateCard(
      "Noch keine Positionen",
      "Klicke auf „Buchung hinzufügen“, um deine erste Position anzulegen.",
      "＋ Buchung hinzufügen"
    );
    els.positionsList.querySelectorAll('[data-action="add-first"]').forEach(button => {
      button.addEventListener("click", () => openEditor());
    });
    return;
  }

  els.positionsList.innerHTML = items.map(instrumentCardMarkup).join("");

  els.positionsList.querySelectorAll(".position-card").forEach(card => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-action]")) return;
      openInstrumentDetail(card.dataset.id);
    });
  });

  els.positionsList.querySelectorAll("[data-action='edit']").forEach(button => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = event.currentTarget.closest(".position-card");
      if (card?.dataset.id) openEditor(card.dataset.id, null, "edit");
    });
  });

  els.positionsList.querySelectorAll("[data-action='delete']").forEach(button => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = event.currentTarget.closest(".position-card");
      if (card?.dataset.id) deletePosition(card.dataset.id);
    });
  });

  els.positionsList.querySelectorAll("[data-action='watch']").forEach(button => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = event.currentTarget.closest(".position-card");
      if (card?.dataset.id) toggleWatch(card.dataset.id);
    });
  });
}

function renderDashboardTopList() {
  const items = [...getActiveInstruments()]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 4);

  if (!items.length) {
    els.dashboardTopList.innerHTML = emptyStateCard(
      "Noch keine Buchungen",
      "Füge deine erste Buchung im Portfolio hinzu.",
      "＋ Buchung hinzufügen"
    );
    els.dashboardTopList.querySelectorAll('[data-action="add-first"]').forEach(button => {
      button.addEventListener("click", () => {
        setView("portfolio");
        openEditor();
      });
    });
    return;
  }

  els.dashboardTopList.innerHTML = items.map(item => `
    <div class="top-mini-card" data-id="${escapeHtml(item.id)}" style="cursor: pointer;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
          ${logoMarkup(item, "top-mini-logo")}
          <div style="min-width: 0;">
            <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;">${escapeHtml(item.name)}</strong>
            <small style="display: block; color: var(--muted); font-size: 12px;">${escapeHtml(item.ticker)} · ${money(item.currentValue)}</small>
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0;">
          <span class="${item.dayChangePct >= 0 ? "good" : "bad"}" style="font-weight: 700;">${signedPct(item.dayChangePct)}</span>
        </div>
      </div>
    </div>
  `).join("");

  els.dashboardTopList.querySelectorAll("[data-id]").forEach(card => {
    card.addEventListener("click", () => openInstrumentDetail(card.dataset.id));
  });
}

function renderWatchlistSummary() {
  const watchItems = getActiveInstruments().filter(item => item.watch);
  const totalWatchValue = watchItems.reduce((sum, item) => sum + item.currentValue, 0);
  const bestWatch = watchItems.sort((a, b) => b.totalGain - a.totalGain)[0];

  els.watchlistSummary.innerHTML = `
    <article class="metric-card">
      <div class="metric-label">Watchlist-Positionen</div>
      <div class="metric-value">${watchItems.length}</div>
      <div class="metric-sub">Markierte Favoriten</div>
    </article>

    <article class="metric-card">
      <div class="metric-label">Watchlist-Gesamtwert</div>
      <div class="metric-value">${money(totalWatchValue)}</div>
      <div class="metric-sub">Summe der Favoriten</div>
    </article>

    <article class="metric-card">
      <div class="metric-label">Beste Performance</div>
      <div class="metric-value">${bestWatch ? escapeHtml(bestWatch.ticker) : "—"}</div>
      <div class="metric-sub">${bestWatch ? `${escapeHtml(bestWatch.name)} · ${signedMoney(bestWatch.totalGain)}` : "Noch keine Favoriten"}</div>
    </article>
  `;
}

function toggleWatchlistTicker(ticker) {
  const norm = String(ticker || "").toUpperCase().trim();
  if (!norm) return;
  if (state.watchlist.includes(norm)) {
    state.watchlist = state.watchlist.filter(t => t !== norm);
  } else {
    state.watchlist.push(norm);
  }
  localStorage.setItem("portfolio-watchlist-tickers", JSON.stringify(state.watchlist));
  
  const inst = state.instruments.find(i => i.ticker === norm);
  if (inst) {
    setWatchState(inst.id, state.watchlist.includes(norm));
  } else {
    renderAll();
  }
}

function openEditorForCatalogItem(catalogItem) {
  openEditor();
  els.fieldName.value = catalogItem.name || "";
  els.fieldTicker.value = (catalogItem.ticker || "").toUpperCase();
  els.fieldType.value = catalogItem.assetType || "Aktie";
  els.fieldSector.value = catalogItem.sector || "Wertpapier";
  els.fieldBuyPrice.value = String(catalogItem.price || "");
  els.fieldCurrentPrice.value = String(catalogItem.price || "");
  els.fieldDayChangePct.value = String(catalogItem.dayChangePct || 0);
  els.editorTitle.textContent = `Buchung für ${catalogItem.name} hinzufügen`;
  els.editorSubtitle.textContent = `Kauf- oder Verkaufsbuchung für ${catalogItem.ticker} eintragen.`;
  els.fieldQty.focus();
}

function renderWatchlist() {
  const ownedWatch = getActiveInstruments().filter(item => item.watch);
  const unownedWatchTickers = (state.watchlist || []).filter(ticker => !state.instruments.some(i => i.ticker === ticker && i.openQty > 0));
  
  const catalog = (typeof window !== "undefined" && window.STOCK_CATALOG) ? window.STOCK_CATALOG : STOCK_CATALOG;
  const unownedWatchItems = unownedWatchTickers.map(ticker => {
    const catalogItem = catalog.find(s => s.ticker === ticker) || {
      name: ticker,
      ticker,
      assetType: "Aktie",
      sector: "Beobachtung",
      isin: "",
      price: 100,
      dayChangePct: 0
    };
    return {
      id: `catalog_${ticker}`,
      ticker,
      name: catalogItem.name,
      isin: catalogItem.isin || "",
      assetType: catalogItem.assetType,
      sector: catalogItem.sector,
      currentPrice: catalogItem.price,
      price: catalogItem.price,
      dayChangePct: catalogItem.dayChangePct,
      isCatalog: true,
      watch: true
    };
  });

  const allWatchItems = [...ownedWatch, ...unownedWatchItems];

  if (!allWatchItems.length) {
    els.watchlistList.innerHTML = emptyStateCard(
      "Watchlist leer",
      "Suche nach Wertpapieren wie Cloudflare, Tesla, Nvidia oder Bitcoin und klicke auf die Aktie oder den Watchlist-Stern.",
      "🔍 Wertpapiere suchen"
    );
    els.watchlistList.querySelectorAll('[data-action="add-first"]').forEach(button => {
      button.addEventListener("click", () => setView("search"));
    });
    return;
  }

  els.watchlistList.innerHTML = allWatchItems.map(item => `
    <div class="watch-card" data-id="${escapeHtml(item.id)}" data-ticker="${escapeHtml(item.ticker)}" data-catalog="${item.isCatalog ? 'true' : 'false'}">
      ${logoMarkup(item, "asset-badge")}
      <div class="watch-main">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.ticker)} · ${escapeHtml(item.sector || "Ohne Sektor")}${item.isCatalog ? ' · (Beobachtung)' : ''}</small>
      </div>
      <div class="watch-spark">${sparklineSvg(item, 120, 38)}</div>
      <div class="watch-stats">
        <span class="${(item.dayChangePct || 0) >= 0 ? "good" : "bad"}">${signedPct(item.dayChangePct || 0)}</span>
        <strong>${money(item.currentPrice || item.price || 0)}</strong>
      </div>
      <div class="watch-actions" style="margin-left: 10px; display: flex; gap: 6px;">
        <button class="search-action-btn" data-action="buy-watch" type="button" title="Buchung hinzufügen">＋ Buchung</button>
        <button class="search-action-btn active-watch" data-action="remove-watch" type="button" title="Aus Watchlist entfernen">★</button>
      </div>
    </div>
  `).join("");

  els.watchlistList.querySelectorAll(".watch-card").forEach(card => {
    const isCatalog = card.dataset.catalog === "true";
    const id = card.dataset.id;
    const ticker = card.dataset.ticker;
    const catalogItem = catalog.find(s => s.ticker === ticker) || { name: ticker, ticker };

    // Clicking the card opens the full chart & analysis detail sheet!
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openInstrumentDetail(isCatalog ? catalogItem : (id || ticker));
    });

    // Clicking '＋ Buchung' opens booking editor
    card.querySelector('[data-action="buy-watch"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      const resolved = resolveInstrument(ticker);
      if (resolved && resolved.isOwned) {
        openEditor(resolved.id, null, "add_transaction");
      } else {
        openEditorForCatalogItem(catalogItem);
      }
    });

    // Clicking '★' toggles watchlist
    card.querySelector('[data-action="remove-watch"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWatchlistTicker(ticker);
    });
  });
}

function buildNewsItems() {
  const active = getActiveInstruments();
  const allNews = [];

  active.forEach(instrument => {
    const items = state.api?.news?.[instrument.ticker] || [];
    items.forEach(item => {
      allNews.push({
        id: `${instrument.id}:${item.id}`,
        instrument,
        headline: item.headline,
        summary: item.summary || "Öffne die Meldung für weitere Details.",
        source: item.source || "Finnhub",
        article: [item.summary || item.headline],
        focus: item.source || "News",
        impact: instrument.dayChangePct >= 0 ? "good" : "bad",
        time: item.datetime,
        url: item.url,
        isGerman: Boolean(item.isGerman)
      });
    });
  });

  if (allNews.length) {
    return allNews.sort((a, b) => (b.time || 0) - (a.time || 0));
  }

  return active
    .map(item => {
      const template = newsTemplates[item.ticker] || {
        headline: `${item.name}: Stabile Entwicklung im aktuellen Markt`,
        summary: `Für ${item.name} zeigen die aktuellen Kurse eine solide Tendenz. Keine auffälligen Sondereffekte.`,
        source: "Marktbeobachtung",
        article: [
          `Die Position ${item.name} (${item.ticker}) entwickelt sich im Rahmen der gewöhnlichen Markt-Performance.`
        ],
        focus: "Analyse"
      };

      return {
        id: item.id,
        instrument: item,
        headline: template.headline,
        summary: template.summary,
        source: template.source,
        article: template.article,
        focus: template.focus,
        impact: item.dayChangePct >= 0 ? "good" : "bad",
        time: 0,
        url: "",
        isGerman: true
      };
    })
    .sort((a, b) => b.instrument.currentValue - a.instrument.currentValue);
}

async function fetchAndRenderNews() {
  if (!state.api.manager) return;
  const active = getActiveInstruments();
  if (!active.length) {
    renderNews();
    return;
  }

  if (!state.api.news) {
    state.api.news = {};
  }

  for (const instrument of active) {
    try {
      const news = await state.api.manager.getCompanyNews(instrument.ticker);
      if (Array.isArray(news)) {
        state.api.news[instrument.ticker] = news;
      }
    } catch (e) {
      console.warn("News error for", instrument.ticker, e);
    }
  }

  renderNews();
}

function renderNews() {
  const items = buildNewsItems();

  if (!state.transactions.length) {
    els.newsList.innerHTML = emptyStateCard("Noch keine News", "Sobald Buchungen da sind, erscheinen hier aktuelle Nachrichten auf Deutsch.");
    return;
  }

  els.newsList.innerHTML = items.map(item => {
    const timeStr = item.time
      ? new Date(item.time * 1000).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "Heute";

    const langBadge = item.isGerman
      ? `<span class="news-chip good" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">✨ DE (Gemini KI)</span>`
      : `<span class="news-chip bad" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">EN (Original)</span>`;

    return `
      <div class="news-card" data-id="${escapeHtml(item.id)}">
        ${logoMarkup(item.instrument, "asset-badge")}
        <div class="news-main">
          <strong>${escapeHtml(item.instrument.name)}</strong>
          <p class="news-headline">${escapeHtml(item.headline)}</p>
          <small>${escapeHtml(item.summary)}</small>
          <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            ${langBadge}
            <span class="news-chip ${item.impact}">${escapeHtml(item.instrument.ticker)} · ${escapeHtml(timeStr)} · ${escapeHtml(item.source)}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  els.newsList.querySelectorAll("[data-id]").forEach(card => {
    card.addEventListener("click", () => openNewsDetail(card.dataset.id));
  });
}

function renderPortfolioChart() {
  const portfolio = calcPortfolio();
  const points = buildHistoryForRange(portfolio.currentValue, portfolio.costBasis, state.range);
  renderChart(els.portfolioChart, points, els.portfolioChartMeta, 260, state.range);

  if (!state.transactions.length) {
    els.portfolioChartMeta.textContent = "Noch keine Buchungen vorhanden.";
  }
}

function renderDashboardChart() {
  const portfolio = calcPortfolio();
  const points = buildHistoryForRange(portfolio.currentValue, portfolio.costBasis, state.range);
  renderChart(els.dashboardChart, points, els.dashboardChartMeta, 260, state.range);

  if (!state.transactions.length) {
    els.dashboardChartMeta.textContent = "Noch keine Buchungen vorhanden.";
  }
}

function percentOf(value, total) {
  return total ? (value / total) * 100 : 0;
}

function allocationBy(items, keyGetter) {
  const total = items.reduce((sum, item) => sum + item.currentValue, 0);
  const groups = new Map();

  items.forEach(item => {
    const key = keyGetter(item) || "Sonstiges";
    groups.set(key, (groups.get(key) || 0) + item.currentValue);
  });

  return [...groups.entries()]
    .map(([label, value]) => ({ label, value, pct: percentOf(value, total) }))
    .sort((a, b) => b.value - a.value);
}

function renderAllocationRows(rows) {
  if (!rows.length) {
    return `<div class="allocation-row"><div class="allocation-top"><strong>Keine Daten</strong><span>0%</span></div><div class="allocation-track"><div class="allocation-fill" style="width:0%"></div></div></div>`;
  }

  return rows.slice(0, 5).map(row => `
    <div class="allocation-row">
      <div class="allocation-top">
        <strong>${escapeHtml(row.label)}</strong>
        <span>${row.pct.toFixed(1)}% · ${money(row.value)}</span>
      </div>
      <div class="allocation-track">
        <div class="allocation-fill" style="width:${Math.min(Math.max(row.pct, 0), 100).toFixed(2)}%"></div>
      </div>
    </div>
  `).join("");
}

function renderPortfolioInsights() {
  if (!els.portfolioInsights) return;
  els.portfolioInsights.innerHTML = "";
}

function lockBodyScroll() {
  state.scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add("modal-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${state.scrollLockY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  document.body.classList.remove("modal-open");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, state.scrollLockY || 0);
}

function showBackdrop(backdrop) {
  backdrop.classList.add("show");
  backdrop.setAttribute("aria-hidden", "false");
}

function hideBackdrop(backdrop, shouldUnlock = true) {
  backdrop.classList.remove("show");
  backdrop.setAttribute("aria-hidden", "true");
  if (shouldUnlock) unlockBodyScroll();
}

function setDateField(iso) {
  els.fieldBuyDate.value = iso || "";
  els.fieldBuyDateDisplay.value = iso ? formatDateDisplay(iso) : "";
}

function setTimeField(value) {
  const parsed = parseTimeInput(value);
  els.fieldBuyTime.value = parsed || "";
  els.fieldBuyTimeDisplay.value = parsed || "";
}

function syncManualDateInput() {
  const parsed = parseDateInput(els.fieldBuyDateDisplay.value);
  if (parsed) {
    setDateField(parsed);
    return parsed;
  }
  return "";
}

function syncManualTimeInput() {
  const parsed = parseTimeInput(els.fieldBuyTimeDisplay.value);
  if (parsed) {
    setTimeField(parsed);
    return parsed;
  }
  return "";
}

function renderDatePicker() {
  const base = state.datePickerView;
  const year = base.getFullYear();
  const month = base.getMonth();

  els.datePickerLabel.textContent = monthFormatter.format(base);

  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISO();
  const selected = els.fieldBuyDate.value || "";

  const cells = [];

  for (let i = 0; i < leadingDays; i++) {
    cells.push(`<button type="button" class="date-cell blank" tabindex="-1" aria-hidden="true"></button>`);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toLocalISO(new Date(year, month, day));
    const classes = ["date-cell"];
    if (iso === today) classes.push("today");
    if (iso === selected) classes.push("selected");

    cells.push(`
      <button type="button" class="${classes.join(" ")}" data-date="${iso}">
        ${day}
      </button>
    `);
  }

  els.dateGrid.innerHTML = cells.join("");
}

function getSelectedTime() {
  const parsed = parseTimeInput(els.fieldBuyTime.value || els.fieldBuyTimeDisplay.value || currentTimeISO()) || currentTimeISO();
  const [hour, minute] = parsed.split(":").map(Number);
  return { hour, minute, value: parsed };
}

function renderTimePicker() {
  const current = getSelectedTime();
  els.timePickerLabel.textContent = current.value;

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const selected = hour === current.hour;
    return `
      <button type="button" class="time-cell ${selected ? "selected" : ""}" data-hour="${hour}">
        ${pad2(hour)}
      </button>
    `;
  }).join("");

  const minutes = Array.from({ length: 60 }, (_, minute) => {
    const selected = minute === current.minute;
    return `
      <button type="button" class="time-cell ${selected ? "selected" : ""}" data-minute="${minute}">
        ${pad2(minute)}
      </button>
    `;
  }).join("");

  els.hourGrid.innerHTML = hours;
  els.minuteGrid.innerHTML = minutes;
}

function openDatePicker() {
  closeTimePicker();
  state.datePickerView = parseISODate(els.fieldBuyDate.value || todayISO());
  els.datePickerPopover.classList.remove("hidden");
  els.datePickerPopover.setAttribute("aria-hidden", "false");
  renderDatePicker();
}

function closeDatePicker() {
  els.datePickerPopover.classList.add("hidden");
  els.datePickerPopover.setAttribute("aria-hidden", "true");
}

function openTimePicker() {
  syncManualTimeInput();
  closeDatePicker();
  els.timePickerPopover.classList.remove("hidden");
  els.timePickerPopover.setAttribute("aria-hidden", "false");
  renderTimePicker();
}

function closeTimePicker() {
  els.timePickerPopover.classList.add("hidden");
  els.timePickerPopover.setAttribute("aria-hidden", "true");
}

function setWatchState(ticker, watch) {
  state.transactions = state.transactions.map(tx => {
    if (tx.instrumentId !== ticker) return tx;
    return { ...tx, watch };
  });
  saveTransactions();
  refreshModel();
  renderAll();
}

function toggleWatch(ticker) {
  const instrument = state.instruments.find(item => item.id === ticker);
  if (!instrument) return;
  setWatchState(ticker, !instrument.watch);
}

function deletePosition(ticker) {
  const instrument = state.instruments.find(item => item.id === ticker);
  if (!instrument) return;

  const ok = confirm(`Position "${instrument.name}" (${instrument.ticker}) wirklich aus dem Depot löschen?`);
  if (!ok) return;

  const wasSelected = state.selectedId === ticker;
  state.transactions = state.transactions.filter(tx => tx.ticker !== ticker);
  saveTransactions();
  refreshModel();

  if (wasSelected) closeDetail();
  renderAll();
}

function deleteTransaction(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  const ok = confirm(`Buchung (${tx.kind === "sell" ? "Verkauf" : "Kauf"} von ${tx.qty} Stk ${tx.name}) wirklich löschen?`);
  if (!ok) return;

  const ticker = tx.ticker;
  state.transactions = state.transactions.filter(t => t.id !== txId);
  saveTransactions();
  refreshModel();

  const remaining = state.transactions.filter(t => t.ticker === ticker);
  if (!remaining.length && state.selectedId === ticker) {
    closeDetail();
  } else if (state.selectedId === ticker && els.detailBackdrop.classList.contains("show")) {
    openInstrumentDetail(ticker);
  }

  renderAll();
}

function resolveInstrument(target) {
  if (!target) return null;
  const catalog = (typeof window !== "undefined" && window.STOCK_CATALOG) ? window.STOCK_CATALOG : STOCK_CATALOG;

  if (typeof target === "object" && target.ticker) {
    const ticker = String(target.ticker).toUpperCase().trim();
    // 1. Check if user already holds an open position
    const owned = state.instruments.find(i => i.ticker === ticker && i.openQty > 0);
    if (owned) return owned;

    // 2. Resolve catalog data
    const catalogItem = catalog.find(s => s.ticker === ticker) || target;
    const isWatch = (state.watchlist || []).includes(ticker) || Boolean(target.watch);
    const price = normalizeNumber(target.currentPrice || target.price || catalogItem.price || 100, 100);
    const dayChangePct = normalizeNumber(target.dayChangePct ?? catalogItem.dayChangePct ?? 0, 0);
    const dayChange = (price * dayChangePct) / 100;
    const isin = target.isin || catalogItem.isin || `US${ticker.padEnd(8, "0")}101`;
    const sector = target.sector || catalogItem.sector || "Wertpapier";
    const name = target.name || catalogItem.name || ticker;
    const assetType = target.assetType || catalogItem.assetType || "Aktie";

    return {
      id: `catalog_${ticker}`,
      ticker,
      name,
      assetType,
      sector,
      isin,
      currentPrice: price,
      price,
      dayChangePct,
      dayChange,
      dayHigh: price * (1 + Math.abs(dayChangePct) * 0.008 + 0.012),
      dayLow: price * (1 - Math.abs(dayChangePct) * 0.008 - 0.012),
      high52: price * 1.35,
      low52: price * 0.72,
      isOwned: false,
      watch: isWatch,
      transactions: [],
      openQty: 0,
      costBasis: 0,
      currentValue: 0,
      averageCost: 0,
      unrealizedGain: 0,
      realizedGain: 0,
      totalGain: 0,
      gainPct: 0
    };
  }

  // target is string ID or Ticker
  const idStr = String(target);
  const byId = state.instruments.find(i => i.id === idStr);
  if (byId) return byId;

  const byTicker = state.instruments.find(i => i.ticker === idStr.toUpperCase());
  if (byTicker) return byTicker;

  const cleanTicker = idStr.replace(/^catalog_/, "").toUpperCase();
  const catalogItem = catalog.find(s => s.ticker === cleanTicker) || { name: cleanTicker, ticker: cleanTicker };
  return resolveInstrument(catalogItem);
}

async function enrichInstrumentLiveData(instrument) {
  if (!state.api?.manager || !hasLiveApi()) return;
  const ticker = instrument.ticker?.toUpperCase();
  if (!ticker) return;

  try {
    const candles = await state.api.manager.getCandles(ticker, state.range);
    if (Array.isArray(candles) && candles.length >= 2) {
      if (!state.api.historyCache) state.api.historyCache = new Map();
      state.api.historyCache.set(`${ticker}:${state.range}`, candles);
      
      if (state.selectedInstrument?.ticker === ticker && els.detailBackdrop.classList.contains("show")) {
        renderChart(els.detailChart, candles, els.detailChartMeta, 260, state.range);
      }
    }
  } catch (err) {
    console.warn("Could not load candles for", ticker, err);
  }

  try {
    const quote = await state.api.manager.getQuote(ticker);
    if (quote && quote.currentPrice > 0) {
      instrument.currentPrice = quote.currentPrice;
      instrument.dayChangePct = quote.dayChangePct;
      instrument.dayChange = quote.dayChange;
      if (quote.high) instrument.dayHigh = quote.high;
      if (quote.low) instrument.dayLow = quote.low;
    }
  } catch (err) {
    console.warn("Could not load quote for", ticker, err);
  }

  try {
    const news = await state.api.manager.getCompanyNews(ticker);
    if (Array.isArray(news) && news.length > 0) {
      if (!state.api.news) state.api.news = {};
      state.api.news[ticker] = news;
      if (state.selectedInstrument?.ticker === ticker && els.detailBackdrop.classList.contains("show")) {
        renderInstrumentDetailNewsAndCta(instrument);
      }
    }
  } catch (err) {
    console.warn("Could not load news for", ticker, err);
  }
}

function renderInstrumentDetailNewsAndCta(instrument) {
  const companyNews = state.api?.news?.[instrument.ticker] || [];
  const newsHtml = companyNews.length > 0
    ? companyNews.slice(0, 3).map(news => `
        <div class="article-box" style="margin-top: 10px;">
          <strong>${escapeHtml(news.headline)}</strong>
          <small>${escapeHtml(news.summary)}</small>
          ${news.url ? `<br/><a class="article-link" href="${escapeHtml(news.url)}" target="_blank" rel="noopener noreferrer">Original lesen →</a>` : ""}
        </div>
      `).join("")
    : `<p style="color: var(--muted); font-size: 13px;">Keine aktuellen Unternehmens-Meldungen für ${escapeHtml(instrument.name)} geladen.</p>`;

  const ctaHtml = !instrument.isOwned ? `
    <div style="margin-top: 20px; padding: 20px; border-radius: var(--radius); border: 1px solid var(--border); background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(56,189,248,0.05)); display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
      <div>
        <strong style="display: block; font-size: 16px; margin-bottom: 3px;">Bereit, ${escapeHtml(instrument.name)} ins Depot zu legen?</strong>
        <small style="color: var(--muted); font-size: 13px;">Füge deine Kauf- oder Sparplan-Buchung mit Stückzahl und Kurs hinzu.</small>
      </div>
      <button class="primary-btn" id="detailSheetAddTxBtn" type="button" style="padding: 10px 20px; font-weight: 700;">＋ Buchung hinzufügen</button>
    </div>
  ` : ``;

  els.detailArticle.innerHTML = `
    <h4>Unternehmens-News &amp; Details</h4>
    ${newsHtml}
    ${ctaHtml}
  `;

  document.getElementById("detailSheetAddTxBtn")?.addEventListener("click", () => {
    if (instrument.isOwned) {
      openEditor(instrument.id, null, "add_transaction");
    } else {
      openEditorForCatalogItem(instrument);
    }
  });
}

function openInstrumentDetail(target) {
  const instrument = resolveInstrument(target);
  if (!instrument) return;

  state.selectedId = instrument.id;
  state.selectedInstrument = instrument;
  state.detailMode = "position";

  lockBodyScroll();
  showBackdrop(els.detailBackdrop);
  els.detailBackdrop.dataset.mode = "position";

  els.addTransactionBtn?.classList.remove("hidden");
  if (els.addTransactionBtn) {
    els.addTransactionBtn.textContent = "＋ Buchung hinzufügen";
  }

  if (instrument.isOwned) {
    els.editPositionBtn.classList.remove("hidden");
    els.deletePositionBtn.classList.remove("hidden");
  } else {
    els.editPositionBtn.classList.add("hidden");
    els.deletePositionBtn.classList.add("hidden");
  }

  els.toggleWatch.classList.remove("hidden");
  els.detailChartHead.style.display = "flex";
  els.detailChartWrap.style.display = "block";

  // Hide 'SINCE' (Seit Kauf) button if stock is not owned in depot
  const sinceBtn = document.querySelector("#detailRangeSwitch [data-range='SINCE']");
  if (sinceBtn) {
    sinceBtn.style.display = instrument.isOwned ? "inline-block" : "none";
    if (!instrument.isOwned && state.range === "SINCE") {
      state.range = "1W";
    }
  }

  // Update active state on range buttons
  document.querySelectorAll("#detailRangeSwitch .range-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.range === state.range);
  });

  els.detailBadge.outerHTML = logoMarkup(instrument, "detail-badge");
  els.detailBadge = document.getElementById("detailBadge") || document.querySelector(".detail-badge");

  if (instrument.isOwned) {
    els.detailEyebrow.textContent = "Position im Depot";
    els.detailTitle.textContent = instrument.name;
    els.detailSubtitle.textContent = `${instrument.ticker} · ${instrument.assetType} · ${instrument.openQty.toLocaleString("de-DE")} Stück gehalten`;
  } else {
    els.detailEyebrow.textContent = "Markt & Kursverlauf";
    els.detailTitle.textContent = instrument.name;
    els.detailSubtitle.textContent = `${instrument.ticker} · ${instrument.assetType} · ${instrument.sector || "Wertpapier"}`;
  }

  const isWatch = (state.watchlist || []).includes(instrument.ticker) || Boolean(instrument.watch);
  els.toggleWatch.style.display = "inline-flex";
  els.toggleWatch.textContent = isWatch ? "★ Aus Watchlist entfernen" : "☆ Zur Watchlist";

  els.detailMetrics.style.display = "grid";
  if (instrument.isOwned) {
    els.detailMetrics.innerHTML = `
      <div class="detail-card">
        <span>Aktueller Livekurs</span>
        <strong>${money(instrument.currentPrice)}</strong>
      </div>
      <div class="detail-card">
        <span>Marktwert gesamt</span>
        <strong>${money(instrument.currentValue)}</strong>
      </div>
      <div class="detail-card">
        <span>Tagesveränderung</span>
        <strong class="${instrument.dayChangePct >= 0 ? "good" : "bad"}">${signedPct(instrument.dayChangePct)} (${signedMoney(instrument.dayChange)})</strong>
      </div>
      <div class="detail-card">
        <span>Ø Kaufpreis</span>
        <strong>${money(instrument.averageCost)}</strong>
      </div>
      <div class="detail-card">
        <span>Gesamteinstand (Cost-Basis)</span>
        <strong>${money(instrument.costBasis)}</strong>
      </div>
      <div class="detail-card">
        <span>Unrealisierter Gewinn</span>
        <strong class="${instrument.unrealizedGain >= 0 ? "good" : "bad"}">${signedMoney(instrument.unrealizedGain)}</strong>
      </div>
      <div class="detail-card">
        <span>Realisierter Gewinn</span>
        <strong class="${instrument.realizedGain >= 0 ? "good" : "bad"}">${signedMoney(instrument.realizedGain)}</strong>
      </div>
      <div class="detail-card">
        <span>Gesamtperformance</span>
        <strong class="${instrument.totalGain >= 0 ? "good" : "bad"}">${signedMoney(instrument.totalGain)} (${signedPct(instrument.gainPct)})</strong>
      </div>
    `;

    els.detailTransactionsWrap.style.display = "block";
    els.detailTransactions.innerHTML = instrument.transactions.map(tx => {
      const stamp = [formatDateDisplay(tx.date), formatTimeDisplay(tx.time)].filter(Boolean).join(" · ");
      const total = tx.qty * tx.price;
      const kindLabel = tx.kind === "sell" ? "Verkauf" : "Kauf";
      return `
        <article class="transaction-row" data-tx-id="${escapeHtml(tx.id)}">
          <div class="transaction-kind ${tx.kind}">${kindLabel}</div>
          <div class="transaction-meta">
            <strong>${escapeHtml(stamp || "—")}</strong>
            <small>${tx.qty.toLocaleString("de-DE")} Stk zu je ${money(tx.price)} · Gebühren: ${money(tx.fee)}</small>
            ${tx.note ? `<small>${escapeHtml(tx.note)}</small>` : ""}
          </div>
          <div class="transaction-values">
            <strong>${money(total)}</strong>
            <small>${tx.kind === "sell" ? "Zufluss" : "Abfluss"}</small>
          </div>
          <div class="transaction-actions">
            <button class="action-icon-btn" data-action="edit-tx" type="button" title="Buchung bearbeiten">✏️</button>
            <button class="action-icon-btn danger" data-action="delete-tx" type="button" title="Buchung löschen">🗑️</button>
          </div>
        </article>
      `;
    }).join("");

    els.detailTransactions.querySelectorAll("[data-action='edit-tx']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const row = e.currentTarget.closest(".transaction-row");
        if (row?.dataset.txId) openEditor(instrument.id, row.dataset.txId, "edit_tx");
      });
    });

    els.detailTransactions.querySelectorAll("[data-action='delete-tx']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const row = e.currentTarget.closest(".transaction-row");
        if (row?.dataset.txId) deleteTransaction(row.dataset.txId);
      });
    });
  } else {
    // Unowned / Market item
    els.detailTransactionsWrap.style.display = "none";
    els.detailMetrics.innerHTML = `
      <div class="detail-card">
        <span>Aktueller Kurs</span>
        <strong>${money(instrument.currentPrice)}</strong>
      </div>
      <div class="detail-card">
        <span>Tagesveränderung</span>
        <strong class="${(instrument.dayChangePct || 0) >= 0 ? "good" : "bad"}">${signedPct(instrument.dayChangePct || 0)} (${signedMoney(instrument.dayChange || 0)})</strong>
      </div>
      <div class="detail-card">
        <span>Tagesspanne (Low / High)</span>
        <strong>${money(instrument.dayLow)} – ${money(instrument.dayHigh)}</strong>
      </div>
      <div class="detail-card">
        <span>52-Wochen-Spanne</span>
        <strong>${money(instrument.low52)} – ${money(instrument.high52)}</strong>
      </div>
      <div class="detail-card">
        <span>Sektor / Branche</span>
        <strong style="font-size: 15px;">${escapeHtml(instrument.sector || "Wertpapier")}</strong>
      </div>
      <div class="detail-card">
        <span>Asset-Klasse</span>
        <strong style="font-size: 15px;">${escapeHtml(instrument.assetType || "Aktie")}</strong>
      </div>
      <div class="detail-card">
        <span>Kennnummer / ISIN</span>
        <strong style="font-size: 14px; letter-spacing: 0.02em;">${escapeHtml(instrument.isin || `US${instrument.ticker}101`)}</strong>
      </div>
      <div class="detail-card">
        <span>Handelsplatz &amp; Status</span>
        <strong style="font-size: 14px; color: var(--good);">Live Indikation ●</strong>
      </div>
    `;
  }

  els.detailChartMeta.textContent = "";
  renderChart(els.detailChart, buildInstrumentHistory(instrument, state.range), els.detailChartMeta, 260, state.range);

  // Render news and CTA banner
  renderInstrumentDetailNewsAndCta(instrument);

  // Trigger live quote / candles enrichment in background
  enrichInstrumentLiveData(instrument);

  els.closeDetail.focus();
}

function openNewsDetail(id) {
  const article = buildNewsItems().find(item => item.id === id);
  const instrument = article?.instrument;
  if (!instrument || !article) return;

  state.selectedId = instrument.id;
  state.detailMode = "news";

  lockBodyScroll();
  showBackdrop(els.detailBackdrop);
  els.detailBackdrop.dataset.mode = "news";

  els.addTransactionBtn?.classList.add("hidden");
  els.editPositionBtn.classList.add("hidden");
  els.deletePositionBtn.classList.add("hidden");
  els.toggleWatch.classList.add("hidden");
  els.detailMetrics.style.display = "none";
  els.detailTransactionsWrap.style.display = "none";
  els.detailChartHead.style.display = "none";
  els.detailChartWrap.style.display = "none";

  els.detailBadge.outerHTML = logoMarkup(instrument, "detail-badge");
  els.detailBadge = document.getElementById("detailBadge") || document.querySelector(".detail-badge");

  els.detailEyebrow.textContent = "Nachrichten";
  els.detailTitle.textContent = instrument.name;
  els.detailSubtitle.textContent = `${instrument.ticker} · ${article.source}`;

  const timeStr = article.time
    ? new Date(article.time * 1000).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })
    : "Aktuell";

  els.detailArticle.innerHTML = `
    <h4 style="font-size: 20px; line-height: 1.3;">${escapeHtml(article.headline)}</h4>
    <p style="color: var(--muted); font-size: 13px;">${escapeHtml(timeStr)} · Quelle: ${escapeHtml(article.source)}</p>
    ${article.article.map(paragraph => `<p style="margin-top: 12px;">${escapeHtml(paragraph)}</p>`).join("")}
    ${article.url ? `<div style="margin-top: 16px;"><a class="article-link" href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">Vollständigen Originalartikel öffnen →</a></div>` : ""}
  `;

  els.closeDetail.focus();
}

function closeDetail() {
  state.selectedId = null;
  state.detailMode = "position";
  hideBackdrop(els.detailBackdrop, true);
  els.detailBackdrop.dataset.mode = "position";
  closeDatePicker();
  closeTimePicker();
}

function populateEditorForm(ticker = null, txId = null, mode = "edit") {
  state.editingId = ticker;
  state.editingTxId = txId;

  const instrument = ticker ? state.instruments.find(item => item.id === ticker) : null;
  const tx = txId ? state.transactions.find(t => t.id === txId) : null;
  const latestTx = instrument?.transactions?.[0] || null;

  if (tx) {
    els.editorId.value = tx.id;
    els.fieldName.value = tx.name || instrument?.name || "";
    els.fieldTicker.value = tx.ticker || ticker || "";
    els.fieldType.value = tx.assetType || instrument?.assetType || "Aktie";
    els.fieldSector.value = tx.sector || instrument?.sector || "";
    els.fieldTransactionType.value = tx.kind || "buy";
    els.fieldQty.value = String(tx.qty ?? "");
    els.fieldBuyPrice.value = String(tx.price ?? "");
    els.fieldCurrentPrice.value = String(tx.currentPrice ?? instrument?.currentPrice ?? tx.price ?? "");
    els.fieldDayChangePct.value = String(tx.dayChangePct ?? instrument?.dayChangePct ?? 0);
    setDateField(tx.date || todayISO());
    setTimeField(tx.time || currentTimeISO());
    els.fieldFees.value = String(tx.fee ?? 0);
    els.fieldWatch.checked = Boolean(tx.watch || instrument?.watch);
    els.fieldNote.value = tx.note || "";
    els.fieldTicker.readOnly = true;

    els.editorTitle.textContent = "Buchung bearbeiten";
    els.editorSubtitle.textContent = `Passe die Details dieser Buchung für ${tx.name} (${tx.ticker}) an.`;
  } else if (instrument && mode === "add_transaction") {
    els.editorId.value = "";
    els.fieldName.value = instrument.name;
    els.fieldTicker.value = instrument.ticker;
    els.fieldType.value = instrument.assetType;
    els.fieldSector.value = instrument.sector;
    els.fieldTransactionType.value = "buy";
    els.fieldQty.value = "";
    els.fieldBuyPrice.value = String(instrument.currentPrice || "");
    els.fieldCurrentPrice.value = String(instrument.currentPrice || "");
    els.fieldDayChangePct.value = String(instrument.dayChangePct || 0);
    setDateField(todayISO());
    setTimeField(currentTimeISO());
    els.fieldFees.value = "0";
    els.fieldWatch.checked = Boolean(instrument.watch);
    els.fieldNote.value = "";
    els.fieldTicker.readOnly = true;

    els.editorTitle.textContent = "Neue Buchung hinzufügen";
    els.editorSubtitle.textContent = `Neue Kauf- oder Verkaufsbuchung für ${instrument.name} eintragen.`;
  } else if (instrument) {
    const refTx = latestTx;
    els.editorId.value = refTx ? refTx.id : "";
    state.editingTxId = refTx ? refTx.id : null;

    els.fieldName.value = instrument.name;
    els.fieldTicker.value = instrument.ticker;
    els.fieldType.value = instrument.assetType;
    els.fieldSector.value = instrument.sector;
    els.fieldTransactionType.value = refTx?.kind || "buy";
    els.fieldQty.value = refTx ? String(refTx.qty) : String(instrument.openQty || "");
    els.fieldBuyPrice.value = refTx ? String(refTx.price) : String(instrument.averageCost || "");
    els.fieldCurrentPrice.value = String(instrument.currentPrice || "");
    els.fieldDayChangePct.value = String(instrument.dayChangePct || 0);
    setDateField(refTx?.date || instrument.lastDate || todayISO());
    setTimeField(refTx?.time || instrument.lastTime || currentTimeISO());
    els.fieldFees.value = refTx ? String(refTx.fee) : "0";
    els.fieldWatch.checked = Boolean(instrument.watch);
    els.fieldNote.value = refTx?.note || instrument.note || "";
    els.fieldTicker.readOnly = true;

    els.editorTitle.textContent = "Position bearbeiten";
    els.editorSubtitle.textContent = `Passe Stammdaten, Kurse oder Buchungen für ${instrument.name} an.`;
  } else {
    els.editorId.value = "";
    els.fieldName.value = "";
    els.fieldTicker.value = "";
    els.fieldType.value = "Aktie";
    els.fieldSector.value = "";
    els.fieldTransactionType.value = "buy";
    els.fieldQty.value = "";
    els.fieldBuyPrice.value = "";
    els.fieldCurrentPrice.value = "";
    els.fieldDayChangePct.value = "0";
    setDateField(todayISO());
    setTimeField(currentTimeISO());
    els.fieldFees.value = "0";
    els.fieldWatch.checked = false;
    els.fieldNote.value = "";
    els.fieldTicker.readOnly = false;

    els.editorTitle.textContent = "Position / Aktie anlegen";
    els.editorSubtitle.textContent = "Erste Buchung und Stammdaten für eine neue Aktie eintragen.";
  }

  els.positionForm.querySelector('button[type="submit"]').textContent = "Speichern";
}

function openEditor(ticker = null, txId = null, mode = "edit") {
  state.editorReturnToDetail = Boolean(ticker && els.detailBackdrop.classList.contains("show") && state.selectedId === ticker);

  closeDatePicker();
  closeTimePicker();

  if (els.detailBackdrop.classList.contains("show")) {
    hideBackdrop(els.detailBackdrop, false);
  } else {
    lockBodyScroll();
  }

  populateEditorForm(ticker, txId, mode);
  showBackdrop(els.editorBackdrop);
  els.fieldName.focus();
}

function closeEditor(reopenDetail = false) {
  const returnId = state.editorReturnToDetail ? state.editingId : null;

  hideBackdrop(els.editorBackdrop, true);
  state.editingId = null;
  state.editingTxId = null;
  state.editorReturnToDetail = false;
  closeDatePicker();
  closeTimePicker();

  if (reopenDetail && returnId) {
    openInstrumentDetail(returnId);
  }
}

function saveEditor(event) {
  event.preventDefault();

  const name = els.fieldName.value.trim();
  const ticker = els.fieldTicker.value.trim().toUpperCase();
  const assetType = els.fieldType.value.trim();
  const sector = els.fieldSector.value.trim();
  const kind = els.fieldTransactionType.value === "sell" ? "sell" : "buy";
  const qty = normalizeNumber(els.fieldQty.value, 0);
  const price = normalizeNumber(els.fieldBuyPrice.value, 0);
  const currentPrice = normalizeNumber(els.fieldCurrentPrice.value, price);
  const dayChangePct = normalizeNumber(els.fieldDayChangePct.value, 0);
  const fee = normalizeNumber(els.fieldFees.value, 0);
  const note = els.fieldNote.value.trim();
  const watch = Boolean(els.fieldWatch.checked);

  const manualDate = syncManualDateInput();
  const manualTime = syncManualTimeInput();
  const date = els.fieldBuyDate.value || manualDate;
  const time = els.fieldBuyTime.value || manualTime;

  if (!name || !ticker || !assetType || !sector || qty <= 0 || price < 0 || !date || !time) {
    alert("Bitte alle erforderlichen Felder sauber ausfüllen.");
    return;
  }

  // Sync position metadata across all transactions for this ticker
  state.transactions.forEach(t => {
    if (t.ticker === ticker) {
      t.name = name;
      t.assetType = assetType;
      t.sector = sector;
      t.currentPrice = currentPrice;
      t.dayChangePct = dayChangePct;
      t.watch = watch;
    }
  });

  if (state.editingTxId) {
    const index = state.transactions.findIndex(t => t.id === state.editingTxId);
    if (index !== -1) {
      state.transactions[index] = normalizeTransaction({
        id: state.editingTxId,
        instrumentId: ticker,
        kind,
        name,
        ticker,
        assetType,
        sector,
        qty,
        price,
        fee,
        date,
        time,
        currentPrice,
        dayChangePct,
        watch,
        note,
        createdAt: state.transactions[index].createdAt || new Date().toISOString()
      });
    }
  } else {
    const transaction = normalizeTransaction({
      id: createId(),
      instrumentId: ticker,
      kind,
      name,
      ticker,
      assetType,
      sector,
      qty,
      price,
      fee,
      date,
      time,
      currentPrice,
      dayChangePct,
      watch,
      note,
      createdAt: new Date().toISOString()
    });

    if (transaction) {
      state.transactions.unshift(transaction);
    }
  }

  saveTransactions();
  refreshModel();

  const reopenDetail = state.editorReturnToDetail;
  closeEditor(false);
  renderAll();

  if (reopenDetail) {
    openInstrumentDetail(ticker);
  }
}

let searchDebounceTimer = null;
let lastApiSearchQuery = "";
let apiSearchResults = [];

function renderSearchView() {
  const container = document.getElementById("searchResultsContainer");
  const input = document.getElementById("globalSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (!container) return;

  const rawQuery = (input?.value || state.searchQuery || "").trim();
  const query = rawQuery.toLowerCase();
  clearBtn?.classList.toggle("hidden", !query);

  const catalog = (typeof window !== "undefined" && window.STOCK_CATALOG) ? window.STOCK_CATALOG : STOCK_CATALOG;

  // 1. Filter local expanded catalog
  let localMatches = catalog.filter(item => {
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.ticker.toLowerCase().includes(query) ||
      (item.sector && item.sector.toLowerCase().includes(query)) ||
      (item.isin && item.isin.toLowerCase().includes(query))
    );
  });

  // 2. Merge with live API search results
  let merged = [...localMatches];
  if (query && apiSearchResults.length > 0 && lastApiSearchQuery === query) {
    apiSearchResults.forEach(apiItem => {
      if (!merged.some(m => m.ticker === apiItem.ticker)) {
        merged.push(apiItem);
      }
    });
  }

  // 3. Debounced live API lookup
  if (query && query.length >= 2 && query !== lastApiSearchQuery && hasLiveApi()) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
      try {
        const liveResults = await state.api.manager.searchSymbols(query);
        if (Array.isArray(liveResults) && liveResults.length > 0) {
          lastApiSearchQuery = query;
          apiSearchResults = liveResults.map(res => ({
            name: res.name || res.description || res.symbol,
            ticker: res.ticker || res.symbol,
            assetType: res.assetType || (res.type === "Common Stock" ? "Aktie" : res.type || "Aktie"),
            sector: res.sector || "International",
            price: res.price || 100,
            dayChangePct: res.dayChangePct || 0,
            isin: res.isin || `US${res.symbol}101`
          }));
          renderSearchView();
        }
      } catch (err) {
        console.warn("API Search failed", err);
      }
    }, 250);
  }

  let results = merged;

  if (state.searchCategory && state.searchCategory !== "all") {
    results = results.filter(item => {
      if (state.searchCategory === "Aktie") return item.assetType === "Aktie";
      if (state.searchCategory === "ETF") return item.assetType === "ETF";
      if (state.searchCategory === "Krypto") return item.assetType === "Krypto" || item.assetType === "Derivat";
      return true;
    });
  }

  const aiPromptText = document.getElementById("searchAiPromptText");
  const askAiBtn = document.getElementById("askAiSearchBtn");
  if (aiPromptText && askAiBtn) {
    if (query) {
      aiPromptText.textContent = `Lasse dir eine KI-Zusammenfassung zu "${query.toUpperCase()}" von Gemini erstellen.`;
      askAiBtn.textContent = `Frage "${query.toUpperCase()}" ↵`;
    } else {
      aiPromptText.textContent = `Startet eine KI-Trendanalyse zu deinen Lieblingswerten.`;
      askAiBtn.textContent = "Insights fragen ↵";
    }
  }

  if (!results.length && query) {
    const cleanTicker = rawQuery.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "TICKER";
    const formattedName = rawQuery.length <= 4 ? `${rawQuery.toUpperCase()} Inc.` : rawQuery;
    
    results = [{
      name: formattedName,
      ticker: cleanTicker,
      assetType: "Aktie",
      sector: "International / Wertpapier",
      price: 100.00,
      dayChangePct: 0.0,
      isin: `US${cleanTicker.padEnd(8, "0")}101`
    }];
  }

  if (!results.length) {
    container.innerHTML = emptyStateCard(
      `Keine Ergebnisse für "${escapeHtml(query)}"`,
      "Versuche nach Ticker (z. B. NET, TSLA, NVDA, SAP), ISIN oder Name (z. B. Cloudflare, Tesla, Nvidia) zu suchen."
    );
    return;
  }

  const groups = {
    "Aktien": results.filter(i => i.assetType === "Aktie"),
    "ETFs": results.filter(i => i.assetType === "ETF"),
    "Derivate & Krypto": results.filter(i => i.assetType === "Krypto" || i.assetType === "Derivat")
  };

  let html = "";
  for (const [groupName, items] of Object.entries(groups)) {
    if (!items.length) continue;
    html += `
      <div class="search-section">
        <div class="search-section-title">
          <span>${escapeHtml(groupName)}</span>
          <span class="search-section-count">${items.length} Treffer</span>
        </div>
        <div class="search-items-list">
          ${items.map(item => {
            const isWatch = (state.watchlist || []).includes(item.ticker);
            const watchClass = isWatch ? "search-action-btn active-watch" : "search-action-btn";
            const watchLabel = isWatch ? "★ Watchlist" : "☆ Watchlist";
            const itemPrice = item.currentPrice || item.price || 100;
            const itemChange = item.dayChangePct || 0;
            return `
              <div class="search-item-card" data-ticker="${escapeHtml(item.ticker)}">
                ${logoMarkup(item, "asset-badge")}
                <div class="search-item-main">
                  <span class="search-item-name">${escapeHtml(item.name)}</span>
                  <span class="search-item-sub">${escapeHtml(item.ticker)} · ${escapeHtml(item.sector || item.assetType)} · ${escapeHtml(item.isin || "")}</span>
                </div>
                <div class="search-item-price">
                  <span class="search-price-val">${money(itemPrice)}</span>
                  <span class="search-price-change ${itemChange >= 0 ? 'good' : 'bad'}">${signedPct(itemChange)}</span>
                </div>
                <div class="search-item-actions">
                  <button class="search-action-btn" data-action="buy" type="button" title="Kauf- oder Sparplanbuchung erstellen">＋ Buchung</button>
                  <button class="${watchClass}" data-action="watch" type="button">${watchLabel}</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll(".search-item-card").forEach(card => {
    const ticker = card.dataset.ticker;
    const item = results.find(i => i.ticker === ticker) || catalog.find(s => s.ticker === ticker) || { name: ticker, ticker };

    // Clicking the item CARD opens the full detail view (Chart, analysis, metrics, 1T-1J switcher, news)!
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openInstrumentDetail(item);
    });

    // Clicking '＋ Buchung' directly opens the prefilled booking editor
    card.querySelector('[data-action="buy"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditorForCatalogItem(item);
    });

    // Clicking '★ Watchlist' toggles watchlist
    card.querySelector('[data-action="watch"]')?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWatchlistTicker(ticker);
      renderSearchView();
    });
  });
}

async function askAiForSearch() {
  const input = document.getElementById("globalSearchInput");
  const query = (input?.value || "Tesla").trim();
  const answerBox = document.getElementById("searchAiAnswerBox");
  const answerContent = document.getElementById("searchAiAnswerContent");
  if (!answerBox || !answerContent) return;

  answerBox.classList.remove("hidden");
  answerContent.innerHTML = `<div style="display:flex; align-items:center; gap:10px; color:var(--accent);"><span class="status-pill syncing">✨ Gemini analysiert "${escapeHtml(query)}"...</span></div>`;

  try {
    const prompt = `Analysiere kurz auf Deutsch (max. 3 prägnante Sätze) das Wertpapier oder Thema: "${query}". Beschreibe das Geschäftsmodell/Segment, die aktuelle Marktdynamik und worauf Anleger achten sollten. Formatiere übersichtlich.`;
    const res = await fetch("/api/translate-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: `KI-Analyse zu ${query}`,
        summary: prompt,
        apiKey: localStorage.getItem("portfolio-plus-gemini-api-key") || ""
      })
    });

    if (!res.ok) throw new Error("Netzwerkfehler");
    const data = await res.json();
    answerContent.innerHTML = `<p style="margin:0; font-size: 14.5px; line-height: 1.6; color: var(--text);">${escapeHtml(data.translatedSummary || data.translatedHeadline || `Zusammenfassung zu ${query}: Marktvolatilität beachten.`)}</p>`;
  } catch (err) {
    answerContent.innerHTML = `<p style="color:var(--muted); font-size:13.5px;">Gemini KI-Analyse: Für <strong>${escapeHtml(query)}</strong> empfiehlt sich ein Blick auf die aktuellen Quartalszahlen und das KGV/KUV im Vergleich zum Branchenschnitt.</p>`;
  }
}

function setupEditorSuggestions() {
  const nameInput = document.getElementById("fieldName");
  const tickerInput = document.getElementById("fieldTicker");
  const box = document.getElementById("editorSuggestions");
  if (!nameInput || !tickerInput || !box) return;

  function handleInput(val) {
    const q = val.trim().toLowerCase();
    if (q.length < 1) {
      box.classList.add("hidden");
      return;
    }

    const catalog = (typeof window !== "undefined" && window.STOCK_CATALOG) ? window.STOCK_CATALOG : STOCK_CATALOG;
    const matches = catalog.filter(s =>
      s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!matches.length) {
      box.classList.add("hidden");
      return;
    }

    box.innerHTML = matches.map(s => `
      <div class="editor-suggestion-item" data-ticker="${escapeHtml(s.ticker)}">
        <div class="editor-suggestion-left">
          <strong>${escapeHtml(s.name)}</strong>
          <small>${escapeHtml(s.ticker)} · ${escapeHtml(s.assetType)} · ${escapeHtml(s.sector)}</small>
        </div>
        <div class="editor-suggestion-right">${money(s.price)}</div>
      </div>
    `).join("");

    box.classList.remove("hidden");

    box.querySelectorAll(".editor-suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        const s = matches.find(m => m.ticker === item.dataset.ticker);
        if (s) {
          nameInput.value = s.name;
          tickerInput.value = s.ticker;
          els.fieldType.value = s.assetType || "Aktie";
          els.fieldSector.value = s.sector || "Tech";
          els.fieldBuyPrice.value = String(s.price || "");
          els.fieldCurrentPrice.value = String(s.price || "");
          els.fieldDayChangePct.value = String(s.dayChangePct || 0);
        }
        box.classList.add("hidden");
      });
    });
  }

  nameInput.addEventListener("input", (e) => handleInput(e.target.value));
  tickerInput.addEventListener("input", (e) => handleInput(e.target.value));
  
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#positionForm")) {
      box.classList.add("hidden");
    }
  });
}

function renderAll() {
  refreshModel();
  renderDepotBar();
  renderSummary();
  if (state.view === "dashboard") renderDashboardChart();
  renderDashboardTopList();
  if (state.view === "portfolio") renderPortfolioChart();
  renderPortfolioInsights();
  renderPositions();
  renderWatchlistSummary();
  renderWatchlist();
  if (state.view === "search") renderSearchView();
  renderNews();
}

/* API & LIVE DATA HANDLING */
state.api = {
  manager: window.portfolioApi || null,
  online: navigator.onLine,
  loading: false,
  lastUpdated: localStorage.getItem("portfolio-plus-live-updated") || "",
  error: ""
};

els.connectionStatus = document.getElementById("connectionStatus");
els.apiKeyInput = document.getElementById("apiKeyInput");
els.saveApiKeyBtn = document.getElementById("saveApiKeyBtn");

function hasLiveApi() {
  return Boolean(state.api.manager?.hasKey?.());
}

function setLiveStatus(text, mode = "offline") {
  if (!els.connectionStatus) return;
  els.connectionStatus.textContent = text;
  els.connectionStatus.className = `status-pill ${mode}`;
}

function updateLiveStatus() {
  if (!navigator.onLine) {
    setLiveStatus("Offline bereit", "offline");
    return;
  }

  if (state.api.loading) {
    setLiveStatus("Finnhub Sync...", "syncing");
    return;
  }

  if (!hasLiveApi()) {
    setLiveStatus("Kein API Key", "offline");
    return;
  }

  if (state.api.error) {
    setLiveStatus("API Fehler", "error");
    return;
  }

  const label = state.api.lastUpdated
    ? `Live ${new Date(state.api.lastUpdated).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
    : "Live bereit";
  setLiveStatus(label, "online");
}

async function refreshLiveData({ silent = false } = {}) {
  if (!state.api.manager) return;
  if (!navigator.onLine) {
    updateLiveStatus();
    return;
  }

  const symbols = [...new Set(state.transactions.map(tx => tx.ticker).filter(Boolean))];
  if (!symbols.length) {
    updateLiveStatus();
    return;
  }

  state.api.loading = true;
  updateLiveStatus();

  try {
    if (hasLiveApi()) {
      for (const symbol of symbols) {
        try {
          const quote = await state.api.manager.getQuote(symbol);
          if (quote?.currentPrice) {
            state.transactions = state.transactions.map(tx => tx.ticker === symbol ? {
              ...tx,
              currentPrice: quote.currentPrice,
              dayChangePct: quote.dayChangePct
            } : tx);
          }

          const profile = await state.api.manager.getProfile(symbol);
          if (profile?.name) {
            state.transactions = state.transactions.map(tx => tx.ticker === symbol ? {
              ...tx,
              name: tx.name || profile.name,
              sector: tx.sector || profile.finnhubIndustry || tx.sector
            } : tx);
          }
        } catch (e) {
          // Continue with other symbols
        }
      }
      saveTransactions();
    }

    await fetchAndRenderNews();

    state.api.lastUpdated = new Date().toISOString();
    localStorage.setItem("portfolio-plus-live-updated", state.api.lastUpdated);
  } catch (error) {
    state.api.error = error?.message || "Fehler beim Laden der Live-Daten";
  } finally {
    state.api.loading = false;
    refreshModel();
    renderAll();
    updateLiveStatus();
  }
}

/* EVENT LISTENERS */
if (els.apiKeyInput && state.api.manager) {
  els.apiKeyInput.value = state.api.manager.getApiKey();
}

if (els.geminiApiKeyInput) {
  els.geminiApiKeyInput.value = localStorage.getItem("portfolio-plus-gemini-api-key") || "";
}

function updateGeminiStatus() {
  fetch("/api/gemini-status")
    .then(res => res.json())
    .then(data => {
      if (els.geminiStatus) {
        const customKey = localStorage.getItem("portfolio-plus-gemini-api-key");
        if (customKey) {
          els.geminiStatus.className = "status-pill online";
          els.geminiStatus.textContent = "Eigener Key aktiv";
        } else if (data.hasServerKey) {
          els.geminiStatus.className = "status-pill online";
          els.geminiStatus.textContent = "Server Key aktiv";
        } else {
          els.geminiStatus.className = "status-pill offline";
          els.geminiStatus.textContent = "Inaktiv (kein Key)";
        }
      }
    })
    .catch(() => {
      if (els.geminiStatus) {
        els.geminiStatus.className = "status-pill offline";
        els.geminiStatus.textContent = "Offline";
      }
    });
}
updateGeminiStatus();

els.saveGeminiApiKeyBtn?.addEventListener("click", async () => {
  const val = (els.geminiApiKeyInput?.value || "").trim();
  if (val) {
    localStorage.setItem("portfolio-plus-gemini-api-key", val);
  } else {
    localStorage.removeItem("portfolio-plus-gemini-api-key");
  }
  updateGeminiStatus();

  if (state.api.manager?.clearNewsCache) {
    state.api.manager.clearNewsCache();
  }

  if (els.saveGeminiApiKeyBtn) {
    els.saveGeminiApiKeyBtn.textContent = "Übersetze mit Gemini...";
    els.saveGeminiApiKeyBtn.disabled = true;
  }

  await refreshLiveData();

  if (els.saveGeminiApiKeyBtn) {
    els.saveGeminiApiKeyBtn.textContent = "Gespeichert!";
    els.saveGeminiApiKeyBtn.disabled = false;
    setTimeout(() => {
      if (els.saveGeminiApiKeyBtn) els.saveGeminiApiKeyBtn.textContent = "Gemini Key speichern";
    }, 1500);
  }
});

let autoRefreshTimer = null;

function applyAutoRefreshSetting() {
  const storedVal = parseInt(localStorage.getItem("portfolio-plus-auto-refresh") || "0", 10);

  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }

  if (els.autoRefreshSelect) {
    els.autoRefreshSelect.value = String(storedVal);
  }

  if (storedVal > 0) {
    const ms = storedVal * 60 * 1000;
    autoRefreshTimer = setInterval(() => {
      console.log(`[Auto-Refresh] Auto updating live portfolio data (${storedVal}m)`);
      refreshLiveData({ silent: true });
    }, ms);

    const labelText = storedVal === 1 ? "1 Minute" : (storedVal === 60 ? "1 Stunde" : `${storedVal} Min`);

    if (els.autoRefreshStatus) {
      els.autoRefreshStatus.className = "status-pill online";
      els.autoRefreshStatus.textContent = `Aktiv (Alle ${labelText})`;
    }
    if (els.autoRefreshPill) {
      els.autoRefreshPill.style.display = "inline-flex";
      els.autoRefreshPill.textContent = `⏱️ Auto ${labelText}`;
    }
  } else {
    if (els.autoRefreshStatus) {
      els.autoRefreshStatus.className = "status-pill offline";
      els.autoRefreshStatus.textContent = "Auto-Update Aus";
    }
    if (els.autoRefreshPill) {
      els.autoRefreshPill.style.display = "none";
    }
  }
}

els.autoRefreshSelect?.addEventListener("change", (e) => {
  const val = e.target.value;
  localStorage.setItem("portfolio-plus-auto-refresh", val);
  applyAutoRefreshSetting();
});

els.saveApiKeyBtn?.addEventListener("click", () => {
  state.api.manager?.setApiKey(els.apiKeyInput.value);
  refreshLiveData();
  if (els.saveApiKeyBtn) {
    els.saveApiKeyBtn.textContent = "Gespeichert!";
    setTimeout(() => {
      if (els.saveApiKeyBtn) els.saveApiKeyBtn.textContent = "API Key speichern";
    }, 1200);
  }
});

els.apiKeyInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    state.api.manager?.setApiKey(els.apiKeyInput.value);
    refreshLiveData();
  }
});

window.addEventListener("online", () => {
  state.api.online = true;
  refreshLiveData({ silent: true });
});

window.addEventListener("offline", () => {
  state.api.online = false;
  updateLiveStatus();
});

els.searchInput?.addEventListener("input", () => {
  state.search = els.searchInput.value;
  renderPositions();
});

els.sortSelect?.addEventListener("change", () => {
  state.sort = els.sortSelect.value;
  renderPositions();
});

els.addPositionBtn?.addEventListener("click", () => openEditor());

document.getElementById("rangeSwitch")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-range]");
  if (!button) return;
  setRange(button.dataset.range);
});

document.getElementById("dashboardRangeSwitch")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-range]");
  if (!button) return;
  setRange(button.dataset.range);
});

document.getElementById("detailRangeSwitch")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-range]");
  if (!button) return;
  setRange(button.dataset.range);
});

els.themeToggle?.addEventListener("click", () => {
  setTheme(state.theme === "dark" ? "light" : "dark");
});

els.refreshBtn?.addEventListener("click", () => {
  renderAll();
  refreshLiveData();
  els.refreshBtn.textContent = "Aktualisiert";
  setTimeout(() => {
    els.refreshBtn.textContent = "Neu berechnen";
  }, 900);
});

els.addTransactionBtn?.addEventListener("click", () => {
  const inst = state.selectedInstrument || (state.selectedId ? resolveInstrument(state.selectedId) : null);
  if (!inst) return;
  if (inst.isOwned) {
    openEditor(inst.id, null, "add_transaction");
  } else {
    openEditorForCatalogItem(inst);
  }
});

els.editPositionBtn?.addEventListener("click", () => {
  if (!state.selectedId) return;
  openEditor(state.selectedId, null, "edit");
});

els.deletePositionBtn?.addEventListener("click", () => {
  if (!state.selectedId) return;
  deletePosition(state.selectedId);
});

els.closeDetail?.addEventListener("click", closeDetail);
els.detailBackdrop?.addEventListener("click", (event) => {
  if (event.target === els.detailBackdrop) closeDetail();
});

els.toggleWatch?.addEventListener("click", () => {
  const inst = state.selectedInstrument || (state.selectedId ? resolveInstrument(state.selectedId) : null);
  if (!inst) return;
  toggleWatchlistTicker(inst.ticker);
  const isWatch = (state.watchlist || []).includes(inst.ticker);
  inst.watch = isWatch;
  els.toggleWatch.textContent = isWatch ? "★ Aus Watchlist entfernen" : "☆ Zur Watchlist";
});

els.closeEditor?.addEventListener("click", () => closeEditor(false));
els.cancelEditor?.addEventListener("click", () => closeEditor(true));
els.editorBackdrop?.addEventListener("click", (event) => {
  if (event.target === els.editorBackdrop) closeEditor(false);
});

els.positionForm?.addEventListener("submit", saveEditor);

els.fieldTicker?.addEventListener("input", () => {
  els.fieldTicker.value = els.fieldTicker.value.toUpperCase();
});

els.fieldBuyDateDisplay?.addEventListener("blur", () => syncManualDateInput());
els.fieldBuyTimeDisplay?.addEventListener("blur", () => syncManualTimeInput());

els.openDatePicker?.addEventListener("click", (event) => {
  event.stopPropagation();
  openDatePicker();
});

els.openTimePicker?.addEventListener("click", (event) => {
  event.stopPropagation();
  openTimePicker();
});

els.datePrev?.addEventListener("click", () => {
  state.datePickerView = new Date(state.datePickerView.getFullYear(), state.datePickerView.getMonth() - 1, 1);
  renderDatePicker();
});

els.dateNext?.addEventListener("click", () => {
  state.datePickerView = new Date(state.datePickerView.getFullYear(), state.datePickerView.getMonth() + 1, 1);
  renderDatePicker();
});

els.dateToday?.addEventListener("click", () => {
  const iso = todayISO();
  setDateField(iso);
  state.datePickerView = parseISODate(iso);
  renderDatePicker();
});

els.dateClear?.addEventListener("click", () => {
  setDateField("");
  renderDatePicker();
});

els.timeNow?.addEventListener("click", () => {
  setTimeField(currentTimeISO());
  renderTimePicker();
});

els.timeClear?.addEventListener("click", () => {
  setTimeField("");
  renderTimePicker();
});

els.dateGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) return;
  setDateField(button.dataset.date);
  state.datePickerView = parseISODate(button.dataset.date);
  renderDatePicker();
  closeDatePicker();
});

els.hourGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-hour]");
  if (!button) return;
  const current = getSelectedTime();
  const hour = Number(button.dataset.hour);
  setTimeField(`${pad2(hour)}:${pad2(current.minute)}`);
  renderTimePicker();
});

els.minuteGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-minute]");
  if (!button) return;
  const current = getSelectedTime();
  const minute = Number(button.dataset.minute);
  setTimeField(`${pad2(current.hour)}:${pad2(minute)}`);
  renderTimePicker();
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!els.datePickerPopover.classList.contains("hidden")) {
    const insideDate =
      target.closest("#datePickerPopover") ||
      target.closest("#openDatePicker") ||
      target.closest("#fieldBuyDateDisplay");
    if (!insideDate) closeDatePicker();
  }

  if (!els.timePickerPopover.classList.contains("hidden")) {
    const insideTime =
      target.closest("#timePickerPopover") ||
      target.closest("#openTimePicker") ||
      target.closest("#fieldBuyTimeDisplay");
    if (!insideTime) closeTimePicker();
  }
});

els.navLinks.forEach(link => {
  link.addEventListener("click", () => setView(link.dataset.view));
});

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    setView("search");
    return;
  }
  if (event.key === "Escape") {
    if (!els.timePickerPopover.classList.contains("hidden")) {
      closeTimePicker();
      return;
    }
    if (!els.datePickerPopover.classList.contains("hidden")) {
      closeDatePicker();
      return;
    }
    if (els.editorBackdrop.classList.contains("show")) {
      closeEditor(false);
      return;
    }
    if (els.detailBackdrop.classList.contains("show")) {
      closeDetail();
    }
  }
});

/* SEARCH EVENT LISTENERS */
document.getElementById("topbarSearchTrigger")?.addEventListener("click", () => {
  setView("search");
});

document.getElementById("watchlistSearchTrigger")?.addEventListener("click", () => {
  setView("search");
});

document.getElementById("globalSearchInput")?.addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  renderSearchView();
});

document.getElementById("clearSearchBtn")?.addEventListener("click", () => {
  const input = document.getElementById("globalSearchInput");
  if (input) input.value = "";
  state.searchQuery = "";
  renderSearchView();
  input?.focus();
});

document.getElementById("searchCategoryFilters")?.addEventListener("click", (e) => {
  const pill = e.target.closest("[data-cat]");
  if (!pill) return;
  document.querySelectorAll("#searchCategoryFilters [data-cat]").forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  state.searchCategory = pill.dataset.cat;
  renderSearchView();
});

document.getElementById("askAiSearchBtn")?.addEventListener("click", askAiForSearch);
document.getElementById("closeAiAnswerBtn")?.addEventListener("click", () => {
  document.getElementById("searchAiAnswerBox")?.classList.add("hidden");
});

setupEditorSuggestions();

/* Window resize handler for fluid charts on mobile orientation change */
let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (state.view === "dashboard") renderDashboardChart();
    if (state.view === "portfolio") renderPortfolioChart();
  }, 150);
});

/* INIT */
refreshModel();
setTheme(state.theme);
setRange(state.range);
setView(state.view);
renderAll();
applyAutoRefreshSetting();
refreshLiveData({ silent: true });

