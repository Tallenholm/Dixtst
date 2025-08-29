/**
 * Subscribe to a message subscription and resolve the raw response data.
 * Previously this utility read the response as text via `response.text()`,
 * which corrupted any non‑text payload. The implementation now resolves
 * the underlying ArrayBuffer so callers can decode the payload as needed.
 *
 * @param input Request information for `fetch`.
 * @param init Optional request init for `fetch`.
 * @param fetchFn Optional fetch implementation, injected for testing.
 */
export async function subscribeMessageSubscription(
  input: RequestInfo | URL | string,
  init?: RequestInit,
  fetchFn: (
    input: RequestInfo | URL | string,
    init?: RequestInit,
  ) => Promise<Response> = fetch,
): Promise<ArrayBuffer> {
  const response = await fetchFn(input, init);
  // Use arrayBuffer() to return raw binary data instead of coerced text
  return await response.arrayBuffer();
}
