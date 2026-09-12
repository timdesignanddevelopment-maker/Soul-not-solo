// Free-tier backends and public APIs (bible-api.com, our own Render
// deployment) can occasionally stall with no response at all — without a
// cap, a stuck request left the UI spinning forever with no way out.
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
