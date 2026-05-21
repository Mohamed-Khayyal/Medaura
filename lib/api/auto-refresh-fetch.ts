type AutoRefreshOptions = {
  origin: string;
  refreshPath?: string;
  preflight?: boolean;
  preflightIntervalMs?: number;
  waitForInitialRefresh?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;
let lastRefreshFailureAt = 0;
let lastRefreshSuccessAt = 0;
const REFRESH_FAILURE_COOLDOWN_MS = 10_000;
const DEFAULT_PREFLIGHT_INTERVAL_MS = 60_000;
let initialRefreshPromise: Promise<void> | null = null;

export function setInitialRefreshPromise(promise: Promise<void>) {
  initialRefreshPromise = promise;
}

async function attemptRefresh(
  baseFetch: typeof fetch,
  origin: string,
  refreshPath: string
) {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const now = Date.now();
  if (now - lastRefreshFailureAt < REFRESH_FAILURE_COOLDOWN_MS) {
    return false;
  }

  refreshInFlight = baseFetch(
    new Request(`${origin}${refreshPath}`, {
      method: "POST",
      credentials: "include",
    })
  )
    .then((response) => {
      if (response.ok) {
        lastRefreshSuccessAt = Date.now();
        return true;
      }

      return false;
    })
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  const refreshed = await refreshInFlight;
  if (!refreshed) {
    lastRefreshFailureAt = Date.now();
  }

  return refreshed;
}

export function createAutoRefreshFetch(
  baseFetch: typeof fetch,
  options: AutoRefreshOptions
) {
  const refreshPath = options.refreshPath ?? "/api/auth/refresh";

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, {
      ...init,
      credentials: init?.credentials ?? "include",
    });
    const retryRequest = request.clone();

    const requestUrl = new URL(request.url);
    const isSameOrigin = requestUrl.origin === options.origin;
    const isApiRequest = requestUrl.pathname.startsWith("/api/");
    const isRefreshRequest = requestUrl.pathname === refreshPath;
    const isAuthRequest =
      requestUrl.pathname.startsWith("/api/auth/") && !isRefreshRequest;
    const isEligibleRequest =
      isSameOrigin && isApiRequest && !isRefreshRequest && !isAuthRequest;

    if (options.waitForInitialRefresh && isEligibleRequest && initialRefreshPromise) {
      try {
        await initialRefreshPromise;
      } catch {
        // Ignore initial refresh failure and proceed.
      }
    }

    const preflightEnabled = options.preflight ?? false;
    const preflightIntervalMs =
      options.preflightIntervalMs ?? DEFAULT_PREFLIGHT_INTERVAL_MS;
    const shouldPreflight =
      preflightEnabled &&
      isEligibleRequest &&
      Date.now() - lastRefreshSuccessAt > preflightIntervalMs;

    if (shouldPreflight) {
      await attemptRefresh(baseFetch, options.origin, refreshPath);
    }

    const response = await baseFetch(request);

    if (response.status !== 401) {
      return response;
    }

    if (!isEligibleRequest) {
      return response;
    }

    const refreshed = await attemptRefresh(
      baseFetch,
      options.origin,
      refreshPath
    );
    if (!refreshed) {
      return response;
    }

    return baseFetch(retryRequest);
  };
}
