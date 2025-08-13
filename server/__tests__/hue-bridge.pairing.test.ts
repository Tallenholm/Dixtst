import { test } from 'node:test';
import assert from 'node:assert/strict';
import { v3 } from '../services/hue-bridge/hue-api.ts';

import InMemoryStorage from '../storage.ts';
import { pairWithLinkButton } from '../services/hue-bridge/pairing.ts';

const createUserError = new Error('link button not pressed');
(createUserError as any).getHueErrorType = () => 101;

v3.api.createLocal = () => ({
  connect: async () => ({
    users: {
      createUser: async () => { throw createUserError; }
    }
  })
});

test('pairWithLinkButton throws when link button not pressed', async () => {
  const storage = new InMemoryStorage();
  await assert.rejects(() => pairWithLinkButton(storage, '1.2.3.4'), /link_button_not_pressed/);
});
