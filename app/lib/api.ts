const FALLBACK_API_BASE_URL = "https://stockfeedai-server-283151671335.us-central1.run.app/";

export type ArticleFilters = {
  search: string;
  timeRange: "1h" | "4h" | "24h" | "7d";
  sentiment: "all" | "positive" | "neutral" | "negative";
  sector: "all" | string;
  onlyWithTickers: boolean;
};

export const DEFAULT_ARTICLE_FILTERS: ArticleFilters = {
  search: "",
  timeRange: "7d",
  sentiment: "all",
  sector: "all",
  onlyWithTickers: true,
};

export type StockPeriod =
  | "1d"
  | "5d"
  | "1mo"
  | "3mo"
  | "6mo"
  | "ytd"
  | "1y"
  | "3y"
  | "5y";

export type Candle = {
  time: number;
  Close?: number;
  [key: string]: unknown;
};

export type TickerInfo = {
  name?: string;
  regularMarketPrice?: number;
  currency?: string;
  [key: string]: unknown;
};

export type StockHistory = {
  candles: Candle[];
  ticker: TickerInfo | null;
};

export class ApiError extends Error {
  status?: number;
  url: string;

  constructor(message: string, options: { status?: number; url: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.url = options.url;
  }
}

function resolveApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    FALLBACK_API_BASE_URL
  );
}

function buildApiUrl(path: string) {
  return new URL(path, resolveApiBaseUrl()).toString();
}

function hoursFromRange(range: ArticleFilters["timeRange"]) {
  if (range === "1h") return 1;
  if (range === "4h") return 4;
  if (range === "24h") return 24;
  return 24 * 7;
}

export function buildArticlesQuery(filters: ArticleFilters, symbol?: string | null) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.sentiment !== "all") params.set("sentiment", filters.sentiment);
  if (filters.sector !== "all") params.set("sectors", filters.sector);
  if (filters.onlyWithTickers) params.set("only_with_tickers", "true");
  params.set("hours", String(hoursFromRange(filters.timeRange)));
  params.set("limit", "100");

  if (symbol) params.set("tickers", symbol);

  return params;
}

function normalizeApiError(error: unknown, url: string) {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(error.message, { url });
  }
  return new ApiError("Unexpected API error", { url });
}

export async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
) {
  const url = buildApiUrl(path);
  const headers = new Headers(init.headers);
  const hasBody = init.body !== undefined && init.body !== null;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    let payload: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = text ? { message: text } : null;
    }

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}`;

      throw new ApiError(message, { status: response.status, url });
    }

    return payload as T;
  } catch (error) {
    throw normalizeApiError(error, url);
  }
}

export async function getArticles(
  filters: ArticleFilters = DEFAULT_ARTICLE_FILTERS,
  options: { symbol?: string | null; signal?: AbortSignal } = {},
) {
  const query = buildArticlesQuery(filters, options.symbol);
  const result = await fetchJson<{ articles?: unknown[] }>(`/articles?${query.toString()}`, {
    signal: options.signal,
  });

  return result.articles ?? [];
}

export async function getArticle(slug: string, signal?: AbortSignal) {
  const result = await fetchJson<{ article?: unknown }>(`/article/${encodeURIComponent(slug)}`, {
    signal,
  });

  return result.article ?? null;
}

export async function getStockHistory(
  symbol: string,
  options: { period?: StockPeriod; signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams();

  if (options.period) params.set("period", options.period);

  const path = params.size
    ? `/stock/${encodeURIComponent(symbol)}/history?${params.toString()}`
    : `/stock/${encodeURIComponent(symbol)}/history`;

  const result = await fetchJson<{ history?: Partial<StockHistory> }>(path, {
    signal: options.signal,
  });

  return {
    candles: result.history?.candles ?? [],
    ticker: result.history?.ticker ?? null,
  } satisfies StockHistory;
}

export async function searchStockSymbols(search: string, signal?: AbortSignal) {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();

  if (trimmedSearch) params.set("search", trimmedSearch);

  const result = await fetchJson<{ symbols?: Array<Record<string, unknown>> }>(
    `/stock/symbols?${params.toString()}`,
    { signal },
  );

  return result.symbols ?? [];
}
