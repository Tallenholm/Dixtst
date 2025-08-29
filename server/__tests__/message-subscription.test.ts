import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subscribeMessageSubscription } from '../subscribeMessageSubscription';

// Ensure the helper resolves the raw binary payload returned by fetch
// without coercing the response into text.
test('subscribeMessageSubscription resolves raw response data', async () => {
  const payload = new Uint8Array([0, 1, 2, 255]);
  const mockFetch = async () => new Response(payload, { status: 200 });

  const data = await subscribeMessageSubscription('http://example.com', undefined, mockFetch);

  assert.ok(data instanceof ArrayBuffer);
  assert.deepStrictEqual(new Uint8Array(data), payload);
});
