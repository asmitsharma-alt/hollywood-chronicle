// Crawler Rate Limiter & Domain Throttling
interface DomainState {
  lastRequestTime: number;
  minIntervalMs: number;
}

const domainStates: Map<string, DomainState> = new Map();

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (HollywoodChronicleNewsBot/2.0; +https://hollywood-chronicle.vercel.app)';

export async function throttledFetch(
  url: string,
  options: RequestInit = {},
  minIntervalMs = 500
): Promise<Response> {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;

  const state = domainStates.get(hostname) || {
    lastRequestTime: 0,
    minIntervalMs,
  };

  const now = Date.now();
  const elapsed = now - state.lastRequestTime;
  if (elapsed < state.minIntervalMs) {
    const delay = state.minIntervalMs - elapsed + Math.floor(Math.random() * 100);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  state.lastRequestTime = Date.now();
  domainStates.set(hostname, state);

  const headers = new Headers(options.headers || {});
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', DEFAULT_USER_AGENT);
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s hard timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
