/** fetch with retries on 429 / 5xx and a readable error on anything else. */
export async function fetchWithRetry(url, init, { tries = 4, label = new URL(url).host } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    let res;
    try {
      res = await fetch(url, init);
    } catch (e) {
      lastErr = new Error(`${label}: ${e?.message ?? e}${e?.cause?.code ? ` (${e.cause.code})` : ""}`);
      await sleep(1000 * 2 ** i);
      continue;
    }
    if (res.ok) return res;
    const text = await res.text().catch(() => '');
    lastErr = new Error(`${label} ${res.status}: ${text.slice(0, 500)}`);
    if (res.status !== 429 && res.status < 500) throw lastErr;
    const retryAfter = Number(res.headers.get('retry-after'));
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** i);
  }
  throw lastErr;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
